/* global fetch, Request */
import URL from "core-js-pure/features/url";
import {
  _BaseAPIClient,
  ContainerOptions,
  _GlobalJSONContainerStorage,
  _MemoryStorageDriver,
  _StorageDriver,
  _BaseContainer,
  AuthorizeOptions,
  AuthorizeResult,
  PromoteOptions,
  UserInfo,
  SettingOptions,
  OAuthError,
  _ContainerStorage,
  _encodeUTF8,
  _encodeBase64URLFromByteArray,
  SessionState,
  SessionStateChangeReason,
} from "@authgear/core";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";
import {
  openURL,
  openAuthorizeURL,
  createBiometricPrivateKey,
  checkBiometricSupported,
  removeBiometricPrivateKey,
  signWithBiometricPrivateKey,
  generateUUID,
  getDeviceInfo,
  storageGetItem,
  storageSetItem,
  storageDeleteItem,
} from "./nativemodule";
import { BiometricOptions, ReactNativeContainerDelegate } from "./types";
import { getAnonymousJWK, signAnonymousJWT } from "./jwt";
import { isBiometricPrivateKeyNotFoundError } from "./error";
import { Platform } from "react-native";
export * from "@authgear/core";
export * from "./types";
export {
  isBiometricCancel,
  isBiometricPrivateKeyNotFoundError,
  isBiometricNotSupportedOrPermissionDenied,
  isBiometricNoEnrollment,
  isBiometricNoPasscode,
  isBiometricLockout,
} from "./error";
import EventEmitter from "./eventEmitter";

const globalMemoryStore = new _GlobalJSONContainerStorage(
  new _MemoryStorageDriver()
);

/**
 * @public
 */
export enum Page {
  Settings = "/settings",
  Identities = "/settings/identities",
}

/**
 * @public
 */
export interface ConfigureOptions {
  /**
   * The OAuth client ID.
   */
  clientID: string;
  /**
   * The endpoint.
   */
  endpoint: string;
  /**
   * transientSession indicate if the session in SDK is short-lived session.
   * If transientSession is true means the session is short-lived session and won't be persist.
   * In react-native app, the session will be gone when calling authgear.configure.
   */
  transientSession?: boolean;
}

/**
 * @internal
 */
export class _ReactNativeAPIClient extends _BaseAPIClient {
  _fetchFunction = fetch;
  _requestClass = Request;
}

/**
 * @internal
 */
export class _PlatformStorageDriver implements _StorageDriver {
  // eslint-disable-next-line class-methods-use-this
  async get(key: string): Promise<string | null> {
    return storageGetItem(key);
  }
  // eslint-disable-next-line class-methods-use-this
  async set(key: string, value: string): Promise<void> {
    return storageSetItem(key, value);
  }
  // eslint-disable-next-line class-methods-use-this
  async del(key: string): Promise<void> {
    return storageDeleteItem(key);
  }
}

async function getXDeviceInfo(): Promise<string> {
  const deviceInfo = await getDeviceInfo();
  const deviceInfoJSON = JSON.stringify(deviceInfo);
  const xDeviceInfo = _encodeBase64URLFromByteArray(
    _encodeUTF8(deviceInfoJSON)
  );
  return xDeviceInfo;
}

/**
 * React Native Container.
 *
 * @public
 */
export class ReactNativeContainer {
  /**
   * @internal
   */
  baseContainer: _BaseContainer<_ReactNativeAPIClient>;

  /**
   * implements _BaseContainerDelegate
   *
   * @internal
   */
  storage: _ContainerStorage;

  /**
   * implements _BaseContainerDelegate
   *
   * @internal
   */
  refreshTokenStorage: _ContainerStorage;

  /**
   * @internal
   */
  weChatRedirectDeepLinkListener: (url: string) => void;

  /**
   * @public
   */
  delegate?: ReactNativeContainerDelegate;

  /**
   *
   * Unique ID for this container.
   * @defaultValue "default"
   *
   * @public
   */
  public get name(): string {
    return this.baseContainer.name;
  }

  public set name(name: string) {
    this.baseContainer.name = name;
  }

  /**
   * OIDC client ID
   *
   * @public
   */
  public get clientID(): string | undefined {
    return this.baseContainer.clientID;
  }

  public set clientID(clientID: string | undefined) {
    this.baseContainer.clientID = clientID;
  }

  /**
   *
   * @public
   */
  public get sessionState(): SessionState {
    return this.baseContainer.sessionState;
  }

  public set sessionState(sessionState: SessionState) {
    this.baseContainer.sessionState = sessionState;
  }

  /**
   *
   * @public
   */
  public get accessToken(): string | undefined {
    return this.baseContainer.accessToken;
  }

  public set accessToken(accessToken: string | undefined) {
    this.baseContainer.accessToken = accessToken;
  }

  constructor(options?: ContainerOptions) {
    const _storage = new _GlobalJSONContainerStorage(
      new _PlatformStorageDriver()
    );
    const o = {
      ...options,
    } as ContainerOptions;

    const apiClient = new _ReactNativeAPIClient();

    this.baseContainer = new _BaseContainer<_ReactNativeAPIClient>(
      o,
      apiClient,
      this
    );
    this.baseContainer.apiClient._delegate = this;

    this.storage = _storage;
    this.refreshTokenStorage = this.storage;

    this.weChatRedirectDeepLinkListener = (url: string) => {
      this._sendWeChatRedirectURIToDelegate(url);
    };
    EventEmitter.addListener(
      "onAuthgearOpenWeChatRedirectURI",
      this.weChatRedirectDeepLinkListener
    );
  }

  /**
   * implements _APIClientDelegate
   *
   * @internal
   */
  getAccessToken(): string | undefined {
    return this.baseContainer.accessToken;
  }

  /**
   * implements _APIClientDelegate
   *
   * @internal
   */
  shouldRefreshAccessToken(): boolean {
    return this.baseContainer.shouldRefreshAccessToken();
  }

  /**
   * implements _BaseContainerDelegate
   *
   * @internal
   */
  onSessionStateChange(reason: SessionStateChangeReason): void {
    this.delegate?.onSessionStateChange(this, reason);
  }

  /**
   * configure() configures the container with the client ID and the endpoint.
   * It also does local IO to retrieve the refresh token.
   * It only obtains the refresh token locally and no network call will
   * be triggered. So the session state maybe outdated for some reason, e.g.
   * user session is revoked. fetchUserInfo should be called to obtain the
   * latest user session state.
   *
   * configure() can be called more than once if it failed.
   * Otherwise, it is NOT recommended to call it more than once.
   *
   * @public
   */
  async configure(options: ConfigureOptions): Promise<void> {
    if (options.transientSession) {
      this.refreshTokenStorage = globalMemoryStore;
    } else {
      this.refreshTokenStorage = this.storage;
    }
    // TODO: verify if we need to support configure for second time
    // and guard if initialized
    const refreshToken = await this.refreshTokenStorage.getRefreshToken(
      this.name
    );

    this.clientID = options.clientID;
    this.baseContainer.apiClient.endpoint = options.endpoint;
    this.baseContainer.refreshToken = refreshToken ?? undefined;

    if (this.baseContainer.refreshToken != null) {
      // consider user as logged in if refresh token is available
      this.baseContainer._updateSessionState("AUTHENTICATED", "FOUND_TOKEN");
    } else {
      this.baseContainer._updateSessionState("NO_SESSION", "NO_TOKEN");
    }
  }

  /**
   * implements _BaseContainerDelegate
   *
   * @internal
   */
  // eslint-disable-next-line class-methods-use-this
  async _setupCodeVerifier(): Promise<{ verifier: string; challenge: string }> {
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);
    return {
      verifier: codeVerifier,
      challenge: codeChallenge,
    };
  }

  /**
   * Open authorize page.
   *
   * To allow re-authentication of different user smoothly, default value for `options.prompt` is `login`.
   *
   * @param options - authorize options
   */
  async authorize(options: AuthorizeOptions): Promise<AuthorizeResult> {
    const platform = Platform.OS;
    const authorizeURL = await this.authorizeEndpoint({
      ...options,
      platform,
    });
    const redirectURL = await openAuthorizeURL(
      authorizeURL,
      options.redirectURI,
      options.weChatRedirectURI
    );
    const xDeviceInfo = await getXDeviceInfo();
    const result = await this.baseContainer._finishAuthorization(redirectURL, {
      x_device_info: xDeviceInfo,
    });
    await this.disableBiometric();
    return result;
  }

  /**
   * Open the URL with the user agent authenticated with current user.
   */

  // eslint-disable-next-line class-methods-use-this
  async openURL(url: string, options?: SettingOptions): Promise<void> {
    let targetURL = url;

    const refreshToken = await this.refreshTokenStorage.getRefreshToken(
      this.name
    );
    if (!refreshToken) {
      throw new Error("refresh token not found");
    }

    // Use app session token to copy session into webview.
    const {
      app_session_token,
    } = await this.baseContainer.apiClient.appSessionToken(refreshToken);

    const loginHint = `https://authgear.com/login_hint?type=app_session_token&app_session_token=${encodeURIComponent(
      app_session_token
    )}`;

    const platform = Platform.OS;
    targetURL = await this.authorizeEndpoint({
      redirectURI: url,
      prompt: "none",
      responseType: "none",
      loginHint,
      platform,
      ...(options?.weChatRedirectURI
        ? { weChatRedirectURI: options.weChatRedirectURI }
        : {}),
    });

    await openURL(targetURL, options?.weChatRedirectURI);
  }

  async open(page: Page, options?: SettingOptions): Promise<void> {
    const { endpoint } = this.baseContainer.apiClient;
    if (endpoint == null) {
      throw new Error(
        "Endpoint cannot be undefined, please double check whether you have run configure()"
      );
    }
    const endpointWithoutTrailingSlash = endpoint.replace(/\/$/, "");
    await this.openURL(`${endpointWithoutTrailingSlash}${page}`, options);
  }

  /**
   * Logout.
   *
   * @remarks
   * If `force` parameter is set to `true`, all potential errors (e.g. network
   * error) would be ignored.
   *
   * @param options - Logout options
   */
  async logout(
    options: {
      force?: boolean;
    } = {}
  ): Promise<void> {
    const refreshToken =
      (await this.refreshTokenStorage.getRefreshToken(this.name)) ?? "";
    if (refreshToken !== "") {
      try {
        await this.baseContainer.apiClient._oidcRevocationRequest(refreshToken);
      } catch (error) {
        if (!options.force) {
          throw error;
        }
      }
      await this.baseContainer._clearSession("LOGOUT");
    }
  }

  /**
   * Authenticate as an anonymous user.
   */
  async authenticateAnonymously(): Promise<AuthorizeResult> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const { token } = await this.baseContainer.apiClient.oauthChallenge(
      "anonymous_request"
    );

    const keyID = await this.storage.getAnonymousKeyID(this.name);
    const key = await getAnonymousJWK(keyID);

    const now = Math.floor(+new Date() / 1000);
    const header = { typ: "vnd.authgear.anonymous-request", ...key };
    const payload = {
      iat: +now,
      exp: +now + 60,
      challenge: token,
      action: "auth",
    };
    const jwt = await signAnonymousJWT(key.kid, header, payload);

    const tokenResponse = await this.baseContainer.apiClient._oidcTokenRequest({
      grant_type: "urn:authgear:params:oauth:grant-type:anonymous-request",
      client_id: clientID,
      jwt,
    });

    const userInfo = await this.baseContainer.apiClient._oidcUserInfoRequest(
      tokenResponse.access_token
    );

    await this.baseContainer._persistTokenResponse(
      tokenResponse,
      "AUTHENTICATED"
    );
    await this.storage.setAnonymousKeyID(this.name, key.kid);
    await this.disableBiometric();
    return { userInfo };
  }

  /**
   * Open promote anonymous user page
   *
   * @param options - promote options
   */
  async promoteAnonymousUser(
    options: PromoteOptions
  ): Promise<AuthorizeResult> {
    const keyID = await this.storage.getAnonymousKeyID(this.name);
    if (!keyID) {
      throw new Error("anonymous user credentials not found");
    }
    const key = await getAnonymousJWK(keyID);

    const { token } = await this.baseContainer.apiClient.oauthChallenge(
      "anonymous_request"
    );

    const now = Math.floor(+new Date() / 1000);
    const header = { typ: "vnd.authgear.anonymous-request", ...key };
    const payload = {
      iat: +now,
      exp: +now + 60,
      challenge: token,
      action: "promote",
    };
    const jwt = await signAnonymousJWT(key.kid, header, payload);
    const loginHint = `https://authgear.com/login_hint?type=anonymous&jwt=${encodeURIComponent(
      jwt
    )}`;

    const platform = Platform.OS;
    const authorizeURL = await this.authorizeEndpoint({
      ...options,
      prompt: "login",
      loginHint,
      platform,
    });
    const redirectURL = await openAuthorizeURL(
      authorizeURL,
      options.redirectURI,
      options.weChatRedirectURI
    );
    const result = await this.baseContainer._finishAuthorization(redirectURL);
    await this.storage.delAnonymousKeyID(this.name);
    await this.disableBiometric();
    return result;
  }

  /**
   * @public
   */
  async authorizeEndpoint(options: AuthorizeOptions): Promise<string> {
    return this.baseContainer.authorizeEndpoint(options);
  }

  /**
   * Fetch user info.
   */
  async fetchUserInfo(): Promise<UserInfo> {
    await this.refreshAccessTokenIfNeeded();
    return this.baseContainer.apiClient._oidcUserInfoRequest(this.accessToken);
  }

  /**
   * implements _BaseContainerDelegate
   *
   * @internal
   */
  async refreshAccessToken(): Promise<void> {
    const xDeviceInfo = await getXDeviceInfo();
    await this.baseContainer._refreshAccessToken({
      x_device_info: xDeviceInfo,
    });
  }

  /**
   * @public
   */
  async refreshAccessTokenIfNeeded(): Promise<void> {
    return this.baseContainer.refreshAccessTokenIfNeeded();
  }

  /**
   * Fetch function for you to call your application server.
   * The fetch function will include Authorization header in your application
   * request, and handle refresh access token automatically.
   *
   * @public
   */
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.baseContainer.fetch(input, init);
  }

  /**
   * WeChat auth callback function. In WeChat login flow, after returning from the WeChat SDK,
   * this function should be called to complete the authorization.
   *
   * @param code - WeChat Authorization code.
   * @param state - WeChat Authorization state.
   */
  async weChatAuthCallback(code: string, state: string): Promise<void> {
    return this.baseContainer.apiClient._weChatAuthCallbackRequest(
      code,
      state,
      Platform.OS
    );
  }

  /**
   * @internal
   */
  _sendWeChatRedirectURIToDelegate(deepLink: string): void {
    const u = new URL(deepLink);
    const params = u.searchParams;
    const state = params.get("state");
    if (state) {
      this.delegate?.sendWeChatAuthRequest(state);
    }
  }

  /**
   * Check whether biometric is supported on the current device.
   * If biometric is not supported, then a platform specific error is thrown.
   */
  // eslint-disable-next-line class-methods-use-this
  async checkBiometricSupported(options: BiometricOptions): Promise<void> {
    await checkBiometricSupported(options);
  }

  /**
   * Check whether biometric was enabled for the last logged in user.
   */
  async isBiometricEnabled(): Promise<boolean> {
    const keyID = await this.storage.getBiometricKeyID(this.name);
    return keyID != null;
  }

  async disableBiometric(): Promise<void> {
    const keyID = await this.storage.getBiometricKeyID(this.name);
    if (keyID != null) {
      await removeBiometricPrivateKey(keyID);
      await this.storage.delBiometricKeyID(this.name);
    }
  }

  async enableBiometric(options: BiometricOptions): Promise<void> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }
    await this.refreshAccessTokenIfNeeded();
    const accessToken = this.accessToken;
    if (accessToken == null) {
      throw new Error("enableBiometric requires authenticated user");
    }

    const kid = await generateUUID();
    const deviceInfo = await getDeviceInfo();
    const { token } = await this.baseContainer.apiClient.oauthChallenge(
      "biometric_request"
    );
    const now = Math.floor(+new Date() / 1000);
    const payload = {
      iat: now,
      exp: now + 300,
      challenge: token,
      action: "setup",
      device_info: deviceInfo,
    };
    const jwt = await createBiometricPrivateKey({
      ...options,
      kid,
      payload,
    });
    await this.baseContainer.apiClient._setupBiometricRequest({
      access_token: accessToken,
      client_id: clientID,
      jwt,
    });
    await this.storage.setBiometricKeyID(this.name, kid);
  }

  async authenticateBiometric(
    options: BiometricOptions
  ): Promise<AuthorizeResult> {
    const kid = await this.storage.getBiometricKeyID(this.name);
    if (kid == null) {
      throw new Error("biometric key ID not found");
    }
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }
    const deviceInfo = await getDeviceInfo();
    const { token } = await this.baseContainer.apiClient.oauthChallenge(
      "biometric_request"
    );
    const now = Math.floor(+new Date() / 1000);
    const payload = {
      iat: now,
      exp: now + 300,
      challenge: token,
      action: "authenticate",
      device_info: deviceInfo,
    };

    try {
      const jwt = await signWithBiometricPrivateKey({
        ...options,
        kid,
        payload,
      });
      const tokenResponse = await this.baseContainer.apiClient._oidcTokenRequest(
        {
          grant_type: "urn:authgear:params:oauth:grant-type:biometric-request",
          client_id: clientID,
          jwt,
        }
      );

      const userInfo = await this.baseContainer.apiClient._oidcUserInfoRequest(
        tokenResponse.access_token
      );
      await this.baseContainer._persistTokenResponse(
        tokenResponse,
        "AUTHENTICATED"
      );
      return { userInfo };
    } catch (e) {
      if (isBiometricPrivateKeyNotFoundError(e)) {
        await this.disableBiometric();
      }
      if (
        e instanceof OAuthError &&
        e.error === "invalid_grant" &&
        e.error_description === "InvalidCredentials"
      ) {
        await this.disableBiometric();
      }
      throw e;
    }
  }
}

/**
 * Default container.
 *
 * @remarks
 * This is a global shared container, provided for convenience.
 *
 * @public
 */
const defaultContainer: ReactNativeContainer = new ReactNativeContainer();

export default defaultContainer;
