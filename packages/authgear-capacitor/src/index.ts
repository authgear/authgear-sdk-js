/* global window, Request */
import {
  type ContainerOptions,
  type TokenStorage,
  type UserInfo,
  AuthgearError,
  SessionState,
  SessionStateChangeReason,
  Page,
  PromptOption,
  _BaseAPIClient,
  _BaseContainer,
  _ContainerStorage,
  _base64URLEncode,
  _encodeUTF8,
} from "@authgear/core";
import { PersistentContainerStorage, PersistentTokenStorage } from "./storage";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";
import { getDeviceInfo, openAuthorizeURL, openURL } from "./plugin";
import {
  type CapacitorContainerDelegate,
  type AuthenticateOptions,
  type AuthenticateResult,
  type ReauthenticateOptions,
  type ReauthenticateResult,
  type SettingOptions,
} from "./types";
import { Capacitor } from "@capacitor/core";

export * from "@authgear/core";
export * from "./types";
export * from "./storage";

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
    if (options.tokenStorage != null) {
      this.tokenStorage = options.tokenStorage;
    } else {
      this.tokenStorage = new PersistentTokenStorage();
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
    const redirectURL = await openAuthorizeURL({
      url: authorizeURL,
      callbackURL: options.redirectURI,
      prefersEphemeralWebBrowserSession:
        this._shouldPrefersEphemeralWebBrowserSession(),
    });
    const xDeviceInfo = await getXDeviceInfo();
    const result = await this.baseContainer._finishAuthentication(
      redirectURL,
      true,
      {
        x_device_info: xDeviceInfo,
      }
    );
    // await this.disableBiometric();
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
    options: ReauthenticateOptions
  ): Promise<ReauthenticateResult> {
    // Use biometric to reauthenticate if the developer instructs us to do so.
    // const biometricEnabled = await this.isBiometricEnabled();
    // if (biometricEnabled && biometricOptions != null) {
    //   return this.authenticateBiometric(biometricOptions);
    // }

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

    const redirectURL = await openAuthorizeURL({
      url: endpoint,
      callbackURL: options.redirectURI,
      prefersEphemeralWebBrowserSession:
        this._shouldPrefersEphemeralWebBrowserSession(),
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
  _shouldPrefersEphemeralWebBrowserSession(): boolean {
    if (this.isSSOEnabled) {
      return false;
    }
    return true;
  }

  /**
   * @internal
   */
  async authorizeEndpoint(options: AuthenticateOptions): Promise<string> {
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
