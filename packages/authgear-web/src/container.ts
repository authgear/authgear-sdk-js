/* global window */
import URLSearchParams from "core-js-pure/features/url-search-params";
import {
  UserInfo,
  ContainerOptions,
  _BaseContainer,
  AuthorizeResult,
  ReauthenticateResult,
  _ContainerStorage,
  TokenStorage,
  SessionState,
  SessionStateChangeReason,
  AuthgearError,
} from "@authgear/core";
import { _WebAPIClient } from "./client";
import { PersistentTokenStorage, PersistentContainerStorage } from "./storage";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";
import {
  WebContainerDelegate,
  AuthorizeOptions,
  ReauthenticateOptions,
} from "./types";

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
   * sessionType indicates how session is supposed to be stored.
   * This must match the server side configuration.
   *
   * If your backend is a server-side rendering website or webapp,
   * then you should use cookie.
   *
   * Normally, you need to set up a custom domain so that
   * your backend and Authgear can both read and write cookie in the same root domain.
   * You also need to tell the SDK cookie is being used, by specifying "cookie" here.
   *
   * If not specified, default to "refresh_token".
   */
  sessionType?: "cookie" | "refresh_token";
}

/**
 * Web Container
 *
 * @public
 */
export class WebContainer {
  /**
   * @internal
   */
  baseContainer: _BaseContainer<_WebAPIClient>;

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
  sessionType: "cookie" | "refresh_token";

  /**
   * @public
   */
  delegate?: WebContainerDelegate;

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
    const o = {
      ...options,
    } as ContainerOptions;

    const apiClient = new _WebAPIClient();

    this.baseContainer = new _BaseContainer<_WebAPIClient>(o, apiClient, this);
    this.baseContainer.apiClient._delegate = this;

    this.storage = new PersistentContainerStorage();
    this.tokenStorage = new PersistentTokenStorage();

    this.sessionType = "refresh_token";
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
    // TODO: verify if we need to support configure for second time
    // and guard if initialized
    const refreshToken = await this.tokenStorage.getRefreshToken(this.name);

    this.clientID = options.clientID;
    this.baseContainer.apiClient.endpoint = options.endpoint;
    if (options.sessionType != null) {
      this.sessionType = options.sessionType;
    }

    this.baseContainer.refreshToken = refreshToken ?? undefined;

    switch (this.sessionType) {
      case "cookie":
        this.baseContainer._updateSessionState("UNKNOWN", "NO_TOKEN");
        break;
      case "refresh_token":
        if (this.baseContainer.refreshToken != null) {
          // consider user as logged in if refresh token is available
          this.baseContainer._updateSessionState(
            "AUTHENTICATED",
            "FOUND_TOKEN"
          );
        } else {
          this.baseContainer._updateSessionState("NO_SESSION", "NO_TOKEN");
        }
        break;
    }
  }

  /**
   * @internal
   */
  // eslint-disable-next-line class-methods-use-this
  async _setupCodeVerifier(): Promise<{ verifier: string; challenge: string }> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);
    return {
      verifier: codeVerifier,
      challenge: codeChallenge,
    };
  }

  /**
   * Start authorization by redirecting to the authorization endpoint.
   */
  async startAuthorization(options: AuthorizeOptions): Promise<void> {
    const authorizeEndpoint = await this.authorizeEndpoint(options);
    window.location.href = authorizeEndpoint;
  }

  /**
   * Start reauthentication by redirecting to the authorization endpoint.
   */
  async startReauthentication(options: ReauthenticateOptions): Promise<void> {
    const idToken = this.getIDTokenHint();
    if (idToken == null || !this.canReauthenticate()) {
      throw new Error(
        "You can only trigger reauthentication when canReauthenticate() returns true"
      );
    }

    const maxAge = options.maxAge ?? 0;
    const endpoint = await this.baseContainer.authorizeEndpoint({
      ...options,
      maxAge,
      idTokenHint: idToken,
      responseType: "code",
      scope: ["openid", "https://authgear.com/scopes/full-access"],
    });
    window.location.href = endpoint;
  }

  /**
   * Finish authorization.
   *
   * It may reject with OAuthError.
   */
  async finishAuthorization(): Promise<AuthorizeResult> {
    return this.baseContainer._finishAuthorization(window.location.href);
  }

  /**
   * Finish reauthentication.
   *
   * It may reject with OAuthError.
   */
  async finishReauthentication(): Promise<ReauthenticateResult> {
    return this.baseContainer._finishReauthentication(window.location.href);
  }

  /**
   * Logout.
   *
   * @remarks
   * If `force` parameter is set to `true`, all potential errors (e.g. network
   * error) would be ignored.
   *
   * `redirectURI` will be used only for the first party app
   *
   * @param options - Logout options
   */
  async logout(
    options: {
      force?: boolean;
      redirectURI?: string;
    } = {}
  ): Promise<void> {
    switch (this.sessionType) {
      case "cookie":
        await this._logoutCookie(options);
        break;
      case "refresh_token":
        await this._logoutRefreshToken(options);
        break;
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

    const sessionType = this.sessionType;
    switch (this.sessionType) {
      case "cookie": {
        // cookie
        await this.baseContainer.apiClient.signupAnonymousUserWithoutKey(
          clientID,
          sessionType,
          undefined
        );

        const userInfo =
          await this.baseContainer.apiClient._oidcUserInfoRequest();

        return { userInfo };
      }
      case "refresh_token": {
        // refresh token
        const refreshToken = await this.tokenStorage.getRefreshToken(this.name);

        const tokenResponse =
          await this.baseContainer.apiClient.signupAnonymousUserWithoutKey(
            clientID,
            sessionType,
            refreshToken ?? undefined
          );

        if (!tokenResponse) {
          throw new AuthgearError("unexpected empty token response");
        }

        const userInfo =
          await this.baseContainer.apiClient._oidcUserInfoRequest(
            tokenResponse.access_token
          );

        await this.baseContainer._persistTokenResponse(
          tokenResponse,
          "AUTHENTICATED"
        );
        return { userInfo };
      }
      default:
        throw new AuthgearError("unknown session type");
    }
  }

  private async _logoutRefreshToken(options: {
    force?: boolean;
  }): Promise<void> {
    const refreshToken =
      (await this.tokenStorage.getRefreshToken(this.name)) ?? "";
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

  private async _logoutCookie(options: {
    redirectURI?: string;
  }): Promise<void> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
    }
    const config = await this.baseContainer.apiClient._fetchOIDCConfiguration();
    const query = new URLSearchParams();
    if (options.redirectURI) {
      query.append("post_logout_redirect_uri", options.redirectURI);
    }
    const endSessionEndpoint = `${
      config.end_session_endpoint
    }?${query.toString()}`;
    window.location.href = endSessionEndpoint;
  }

  /**
   * @internal
   */
  async authorizeEndpoint(options: AuthorizeOptions): Promise<string> {
    // Use shared session cookie by default for first-party web apps.
    const responseType =
      options.responseType ?? this.sessionType === "cookie" ? "none" : "code";
    const scope =
      this.sessionType === "cookie"
        ? ["openid", "https://authgear.com/scopes/full-access"]
        : [
            "openid",
            "offline_access",
            "https://authgear.com/scopes/full-access",
          ];

    return this.baseContainer.authorizeEndpoint({
      ...options,
      responseType,
      scope,
    });
  }

  /**
   * Make authorize URL makes authorize URL based on options.
   *
   * This function will be used if developer wants to redirection in their own
   * code.
   */
  async makeAuthorizeURL(options: AuthorizeOptions): Promise<string> {
    return this.authorizeEndpoint(options);
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
    await this.baseContainer._refreshAccessToken();
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
}
