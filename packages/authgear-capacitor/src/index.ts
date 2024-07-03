/* global window, Request */
import { Capacitor } from "@capacitor/core";
import {
  type ContainerOptions,
  type TokenStorage,
  type UserInfo,
  AuthgearError,
  OAuthError,
  SessionState,
  SessionStateChangeReason,
  Page,
  PromptOption,
  SettingsAction,
  _BaseAPIClient,
  _BaseContainer,
  _ContainerStorage,
  _base64URLEncode,
  _encodeUTF8,
} from "@authgear/core";
import { PersistentContainerStorage, PersistentTokenStorage } from "./storage";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";
import {
  generateUUID,
  getDeviceInfo,
  openURL,
  createBiometricPrivateKey,
  checkBiometricSupported,
  removeBiometricPrivateKey,
  signWithBiometricPrivateKey,
} from "./plugin";
import {
  UIImplementation,
  DeviceBrowserUIImplementation,
} from "./ui_implementation";
import {
  type CapacitorContainerDelegate,
  type AuthenticateOptions,
  type AuthenticateResult,
  type ReauthenticateOptions,
  type ReauthenticateResult,
  type SettingOptions,
  type BiometricOptions,
  type SettingsActionOptions,
} from "./types";
import { BiometricPrivateKeyNotFoundError } from "./error";

export * from "@authgear/core";
export * from "./types";
export * from "./storage";
export * from "./ui_implementation";
export {
  BiometricPrivateKeyNotFoundError,
  BiometricNotSupportedOrPermissionDeniedError,
  BiometricNoPasscodeError,
  BiometricNoEnrollmentError,
  BiometricLockoutError,
} from "./error";

function getPlatform(): string {
  const platform = Capacitor.getPlatform();
  switch (platform) {
    case "ios":
      return "ios";
    case "android":
      return "android";
    default:
      return "unknown";
  }
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
   * An implementation of TokenStorage.
   */
  tokenStorage?: TokenStorage;

  /**
   * Single-sign-on (SSO) is defined as login once, logged in all apps.
   * When isSSOEnabled is true, users only need to enter their authentication credentials once.
   * When the user login the second app, they will see the continue screen so that they can log in with just a click.
   * Logout from one app will also logout from all the apps.
   * @defaultValue false
   */
  isSSOEnabled?: boolean;

  /**
   * When isAppInitiatedSSOToWebEnabled is true, native apps can share session with a web browser.
   * @defaultValue false
   */
  isAppInitiatedSSOToWebEnabled?: boolean;

  /*
   * The UIImplementation.
   */
  uiImplementation?: UIImplementation;
}

/**
 * @internal
 */
export class _CapacitorAPIClient extends _BaseAPIClient {
  _fetchFunction = window.fetch.bind(window);
  _requestClass = Request;
}

async function getXDeviceInfo(): Promise<string> {
  const deviceInfo = await getDeviceInfo();
  const deviceInfoJSON = JSON.stringify(deviceInfo);
  const xDeviceInfo = _base64URLEncode(_encodeUTF8(deviceInfoJSON));
  return xDeviceInfo;
}

/**
 * CapacitorContainer is the entrypoint of the SDK.
 * An instance of a container allows the user to authenticate, reauthenticate, etc.
 *
 * Every container has a name.
 * The default name of a container is `default`.
 * If your app supports multi login sessions, you can use multiple containers with different names.
 * You are responsible for managing the list of names in this case.
 *
 * @public
 */
export class CapacitorContainer {
  /**
   * @internal
   */
  baseContainer: _BaseContainer<_CapacitorAPIClient>;

  /**
   * @internal
   */
  storage: _ContainerStorage;

  /**
   * @internal
   */
  tokenStorage: TokenStorage;

  /**
   * @internal
   */
  uiImplementation: UIImplementation;

  /**
   * @public
   */
  delegate?: CapacitorContainerDelegate;

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
   * Is SSO enabled
   *
   * @public
   */
  public get isSSOEnabled(): boolean {
    return this.baseContainer.isSSOEnabled;
  }

  public set isSSOEnabled(isSSOEnabled: boolean) {
    this.baseContainer.isSSOEnabled = isSSOEnabled;
  }

  /**
   * Is App Initiated SSO To Web enabled
   *
   * @public
   */
  public get isAppInitiatedSSOToWebEnabled(): boolean {
    return this.baseContainer.isAppInitiatedSSOToWebEnabled;
  }

  public set isAppInitiatedSSOToWebEnabled(
    isAppInitiatedSSOToWebEnabled: boolean
  ) {
    this.baseContainer.isAppInitiatedSSOToWebEnabled =
      isAppInitiatedSSOToWebEnabled;
  }

  /**
   *
   * @public
   */
  public get sessionState(): SessionState {
    return this.baseContainer.sessionState;
  }

  /**
   *
   * @public
   */
  public get accessToken(): string | undefined {
    return this.baseContainer.accessToken;
  }

  constructor(options?: ContainerOptions) {
    const o = {
      ...options,
    } as ContainerOptions;

    const apiClient = new _CapacitorAPIClient();

    this.baseContainer = new _BaseContainer<_CapacitorAPIClient>(
      o,
      apiClient,
      this
    );
    this.baseContainer.apiClient._delegate = this;

    this.storage = new PersistentContainerStorage();
    this.tokenStorage = new PersistentTokenStorage();
    this.uiImplementation = new DeviceBrowserUIImplementation();
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
    this.isSSOEnabled = options.isSSOEnabled ?? false;
    this.isAppInitiatedSSOToWebEnabled =
      options.isAppInitiatedSSOToWebEnabled ?? false;
    if (options.tokenStorage != null) {
      this.tokenStorage = options.tokenStorage;
    } else {
      this.tokenStorage = new PersistentTokenStorage();
    }
    if (options.uiImplementation != null) {
      this.uiImplementation = options.uiImplementation;
    } else {
      this.uiImplementation = new DeviceBrowserUIImplementation();
    }
    // TODO: verify if we need to support configure for second time
    // and guard if initialized
    const refreshToken = await this.tokenStorage.getRefreshToken(this.name);

    this.clientID = options.clientID;
    this.baseContainer.apiClient.endpoint = options.endpoint;
    this.baseContainer.refreshToken = refreshToken ?? undefined;

    if (this.baseContainer.refreshToken != null) {
      // consider user as logged in if refresh token is available
      this.baseContainer._updateSessionState(
        SessionState.Authenticated,
        SessionStateChangeReason.FoundToken
      );
    } else {
      this.baseContainer._updateSessionState(
        SessionState.NoSession,
        SessionStateChangeReason.NoToken
      );
    }
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
   * @public
   */
  async refreshAccessTokenIfNeeded(): Promise<void> {
    return this.baseContainer.refreshAccessTokenIfNeeded();
  }

  /**
   * @public
   * Fetch user info.
   */
  async fetchUserInfo(): Promise<UserInfo> {
    await this.refreshAccessTokenIfNeeded();
    return this.baseContainer._fetchUserInfo(this.accessToken);
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
      (await this.tokenStorage.getRefreshToken(this.name)) ?? "";
    if (refreshToken !== "") {
      try {
        await this.baseContainer.apiClient._oidcRevocationRequest(refreshToken);
      } catch (error: unknown) {
        if (!options.force) {
          throw error;
        }
      }
      await this.baseContainer._clearSession(SessionStateChangeReason.Logout);
    }
  }

  /**
   * Authenticate the end user via the web.
   *
   * @public
   */
  async authenticate(
    options: AuthenticateOptions
  ): Promise<AuthenticateResult> {
    const platform = getPlatform();
    const authorizeURL = await this.authorizeEndpoint({
      ...options,
      platform,
    });
    const redirectURL = await this.uiImplementation.openAuthorizationURL({
      url: authorizeURL,
      redirectURI: options.redirectURI,
      shareCookiesWithDeviceBrowser: this._shareCookiesWithDeviceBrowser(),
    });
    const xDeviceInfo = await getXDeviceInfo();
    const result = await this.baseContainer._finishAuthentication(
      redirectURL,
      true,
      {
        x_device_info: xDeviceInfo,
      }
    );
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

    const platform = getPlatform();

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

    const redirectURL = await this.uiImplementation.openAuthorizationURL({
      url: endpoint,
      redirectURI: options.redirectURI,
      shareCookiesWithDeviceBrowser: this._shareCookiesWithDeviceBrowser(),
    });
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
   *
   * @internal
   */

  // eslint-disable-next-line class-methods-use-this
  async openURL(url: string, options?: SettingOptions): Promise<void> {
    const u = new URL(url);
    const q = u.searchParams;
    if (options?.uiLocales != null) {
      q.set("ui_locales", options.uiLocales.join(" "));
    }
    if (options?.colorScheme != null) {
      q.set("x_color_scheme", options.colorScheme);
    }
    u.search = "?" + q.toString();

    let targetURL = u.toString();

    const refreshToken = await this.tokenStorage.getRefreshToken(this.name);
    if (!refreshToken) {
      throw new AuthgearError("refresh token not found");
    }

    // Use app session token to copy session into webview.
    const appSessionToken = await this.baseContainer._getAppSessionToken(
      refreshToken
    );

    const loginHint = `https://authgear.com/login_hint?type=app_session_token&app_session_token=${encodeURIComponent(
      appSessionToken
    )}`;

    const platform = getPlatform();
    targetURL = await this.authorizeEndpoint({
      redirectURI: targetURL,
      prompt: PromptOption.None,
      responseType: "none",
      loginHint,
      platform,
    });

    await openURL({ url: targetURL });
  }

  /**
   * Open the path in authorization endpoint returned from oidc config,
   * with the user agent authenticated with current user.
   *
   * @internal
   */

  // eslint-disable-next-line class-methods-use-this
  async openAuthgearURL(path: string, options?: SettingOptions): Promise<void> {
    const endpoint = await this.baseContainer.getAuthorizationEndpoint();
    await this.openURL(`${endpoint.origin}${path}`, options);
  }

  /**
   * @public
   */
  async open(page: Page, options?: SettingOptions): Promise<void> {
    await this.openAuthgearURL(page, options);
  }

  /**
   * @internal
   */
  /**
   * Opens the settings page with given action.
   *
   * @internal
   */
  async _openSettingsAction(
    action: SettingsAction,
    options: SettingsActionOptions
  ): Promise<void> {
    const idToken = this.getIDTokenHint();
    if (idToken == null) {
      throw new Error(
        "You can only trigger settings action when authenticated"
      );
    }

    const refreshToken = await this.tokenStorage.getRefreshToken(this.name);
    if (!refreshToken) {
      throw new AuthgearError("refresh token not found");
    }

    // Use app session token to copy session into webview.
    const appSessionToken = await this.baseContainer._getAppSessionToken(
      refreshToken
    );

    const loginHint = `https://authgear.com/login_hint?type=app_session_token&app_session_token=${encodeURIComponent(
      appSessionToken
    )}`;

    const platform = getPlatform();
    const authorizeURL = await this.baseContainer.authorizeEndpoint({
      ...options,
      platform,
      loginHint,
      idTokenHint: idToken,
      responseType: "urn:authgear:params:oauth:response-type:settings-action",
      scope: ["openid", "https://authgear.com/scopes/full-access"],
      xSettingsAction: action,
    });
    const redirectURL = await this.uiImplementation.openAuthorizationURL({
      url: authorizeURL,
      redirectURI: options.redirectURI,
      shareCookiesWithDeviceBrowser: this._shareCookiesWithDeviceBrowser(),
    });
    const xDeviceInfo = await getXDeviceInfo();
    await this.baseContainer._finishSettingsAction(redirectURL, {
      x_device_info: xDeviceInfo,
    });
  }

  /**
   * @public
   */
  async changePassword(options: SettingsActionOptions): Promise<void> {
    return this._openSettingsAction(SettingsAction.ChangePassword, options);
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
   * @internal
   */
  _shareCookiesWithDeviceBrowser(): boolean {
    if (this.isSSOEnabled) {
      return true;
    }
    return false;
  }

  /**
   * @internal
   */
  getScopes(): string[] {
    const scopes = [
      "openid",
      "offline_access",
      "https://authgear.com/scopes/full-access",
    ];
    if (this.isAppInitiatedSSOToWebEnabled) {
      scopes.push(
        "device_sso",
        "https://authgear.com/scopes/app-initiated-sso-to-web"
      );
    }
    return scopes;
  }

  /**
   * @internal
   */
  async authorizeEndpoint(options: AuthenticateOptions): Promise<string> {
    return this.baseContainer.authorizeEndpoint({
      ...options,
      responseType: "code",
      scope: this.getScopes(),
    });
  }

  /**
   * @public
   */
  // eslint-disable-next-line class-methods-use-this
  async checkBiometricSupported(options: BiometricOptions): Promise<void> {
    await checkBiometricSupported(options);
  }

  /**
   * @public
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
  ): Promise<AuthenticateResult> {
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
        SessionStateChangeReason.Authenticated
      );
      return { userInfo };
    } catch (e: unknown) {
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
const defaultContainer: CapacitorContainer = new CapacitorContainer();

export default defaultContainer;
