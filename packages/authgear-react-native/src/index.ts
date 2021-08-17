/* global fetch, Request */
import URL from "core-js-pure/features/url";
import {
  _BaseAPIClient,
  ContainerOptions,
  _GlobalJSONContainerStorage,
  _MemoryStorageDriver,
  _StorageDriver,
  _BaseContainer,
  AuthorizeResult,
  ReauthenticateResult,
  UserInfo,
  SettingOptions,
  OAuthError,
  _ContainerStorage,
  _encodeUTF8,
  _base64URLEncode,
  SessionState,
  SessionStateChangeReason,
  AuthgearError,
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
import {
  BiometricOptions,
  ReactNativeContainerDelegate,
  AuthorizeOptions,
  ReauthenticateOptions,
  PromoteOptions,
} from "./types";
import { getAnonymousJWK, signAnonymousJWT } from "./jwt";
import { BiometricPrivateKeyNotFoundError } from "./error";
import { Platform } from "react-native";
export * from "@authgear/core";
export * from "./types";
export {
  BiometricPrivateKeyNotFoundError,
  BiometricNotSupportedOrPermissionDeniedError,
  BiometricNoPasscodeError,
  BiometricNoEnrollmentError,
  BiometricLockoutError,
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
 * @internal
 *
 * Use for checking SessionType validity.
 */
const SessionTypes = ["transient", "app", "device"] as const;
/**
 * @public
 */
export type SessionType = "transient" | "app" | "device";

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
   * sessionType indicate how the session is supposed to be stored.
   */
  sessionType?: SessionType;
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
  const xDeviceInfo = _base64URLEncode(_encodeUTF8(deviceInfoJSON));
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
  _sessionType: SessionType;

  /**
   * @internal
   */
  wechatRedirectDeepLinkListener: (url: string) => void;

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
  public get sessionType(): SessionType {
    return this._sessionType;
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

    this._sessionType = "app";

    this.wechatRedirectDeepLinkListener = (url: string) => {
      this._sendWechatRedirectURIToDelegate(url);
    };
    EventEmitter.addListener(
      "onAuthgearOpenWechatRedirectURI",
      this.wechatRedirectDeepLinkListener
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
   * getIDTokenHint() returns the ID token for the OIDC id_token_hint parameter.
   *
   * @public
   */
  getIDTokenHint(): string | undefined {
    return this.baseContainer.getIDTokenHint();
  }

  /**
   * canReauthenticate() reports whether the current user can reauthenticate.
   * The information comes from the ID token and the ID token is NOT verified.
   *
   * @public
   */
  canReauthenticate(): boolean {
    return this.baseContainer.canReauthenticate();
  }

  /**
   * getAuthTime() reports the last time the user was authenticated.
   * The information comes from the ID token and the ID token is NOT verified.
   *
   * @public
   */
  getAuthTime(): Date | undefined {
    return this.baseContainer.getAuthTime();
  }

  /**
   * refreshIDToken() asks the server to issue an ID token with latest claims.
   * After refreshing, getIDTokenHint() and canReauthenticate() may return up-to-date value.
   *
   * @public
   */
  async refreshIDToken(): Promise<void> {
    await this.refreshAccessTokenIfNeeded();
    return this.baseContainer.refreshIDToken();
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
    this._sessionType =
      options.sessionType && SessionTypes.indexOf(options.sessionType) !== -1
        ? options.sessionType
        : "app";
    if (this._sessionType === "transient") {
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
   * Authenticate the end user via the web.
   *
   * @public
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
      options.wechatRedirectURI
    );
    const xDeviceInfo = await getXDeviceInfo();
    const result = await this.baseContainer._finishAuthorization(redirectURL, {
      x_device_info: xDeviceInfo,
    });
    await this.disableBiometric();
    return result;
  }

  /**
   * Reauthenticate the end user via biometric or the web.
   *
   * If biometricOptions is given, biometric is used when possible.
   *
   * @public
   */
  async reauthenticate(
    options: ReauthenticateOptions,
    biometricOptions?: BiometricOptions
  ): Promise<ReauthenticateResult> {
    // Use biometric to reauthenticate if the developer instructs us to do so.
    const biometricEnabled = await this.isBiometricEnabled();
    if (biometricEnabled && biometricOptions != null) {
      return this.authenticateBiometric(biometricOptions);
    }

    const platform = Platform.OS;

    const idToken = this.getIDTokenHint();
    if (idToken == null || !this.canReauthenticate()) {
      throw new Error(
        "You can only trigger reauthentication when canReauthenticate() returns true"
      );
    }

    const maxAge = options.maxAge ?? 0;
    const endpoint = await this.baseContainer.authorizeEndpoint({
      ...options,
      platform,
      maxAge,
      idTokenHint: idToken,
      responseType: "code",
      scope: ["openid", "https://authgear.com/scopes/full-access"],
    });

    const redirectURL = await openAuthorizeURL(
      endpoint,
      options.redirectURI,
      options.wechatRedirectURI
    );
    const xDeviceInfo = await getXDeviceInfo();
    const result = await this.baseContainer._finishReauthentication(
      redirectURL,
      {
        x_device_info: xDeviceInfo,
      }
    );
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
      throw new AuthgearError("refresh token not found");
    }

    // Use app session token to copy session into webview.
    const { app_session_token } =
      await this.baseContainer.apiClient.appSessionToken(refreshToken);

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
      ...(options?.wechatRedirectURI
        ? { wechatRedirectURI: options.wechatRedirectURI }
        : {}),
    });

    await openURL(targetURL, options?.wechatRedirectURI);
  }

  async open(page: Page, options?: SettingOptions): Promise<void> {
    const { endpoint } = this.baseContainer.apiClient;
    if (endpoint == null) {
      throw new AuthgearError(
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
      throw new AuthgearError("missing client ID");
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
      throw new AuthgearError("anonymous user credentials not found");
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
      options.wechatRedirectURI
    );
    const result = await this.baseContainer._finishAuthorization(redirectURL);
    await this.storage.delAnonymousKeyID(this.name);
    await this.disableBiometric();
    return result;
  }

  /**
   * @internal
   */
  async authorizeEndpoint(options: AuthorizeOptions): Promise<string> {
    return this.baseContainer.authorizeEndpoint({
      ...options,
      responseType: "code",
      scope: [
        "openid",
        "offline_access",
        "https://authgear.com/scopes/full-access",
      ],
    });
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
  async wechatAuthCallback(code: string, state: string): Promise<void> {
    return this.baseContainer.apiClient._wechatAuthCallbackRequest(
      code,
      state,
      Platform.OS
    );
  }

  /**
   * @internal
   */
  _sendWechatRedirectURIToDelegate(deepLink: string): void {
    const u = new URL(deepLink);
    const params = u.searchParams;
    const state = params.get("state");
    if (state) {
      this.delegate?.sendWechatAuthRequest(state);
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
      throw new AuthgearError("missing client ID");
    }
    await this.refreshAccessTokenIfNeeded();
    const accessToken = this.accessToken;
    if (accessToken == null) {
      throw new AuthgearError("enableBiometric requires authenticated user");
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
      throw new AuthgearError("biometric key ID not found");
    }
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
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
      const tokenResponse =
        await this.baseContainer.apiClient._oidcTokenRequest({
          grant_type: "urn:authgear:params:oauth:grant-type:biometric-request",
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
      return { userInfo };
    } catch (e) {
      if (e instanceof BiometricPrivateKeyNotFoundError) {
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
