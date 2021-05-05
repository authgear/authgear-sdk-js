import URL from "core-js-pure/features/url";
import URLSearchParams from "core-js-pure/features/url-search-params";
import {
  AuthorizeOptions,
  AuthorizeResult,
  ContainerOptions,
  ContainerStorage,
  _APIClientDelegate,
  _OIDCTokenRequest,
  _OIDCTokenResponse,
  SessionStateChangeReason,
  SessionState,
} from "./types";
import { OAuthError } from "./error";
import { _BaseAPIClient } from "./client";

/**
 * To prevent user from using expired access token, we have to check in advance
 * whether it had expired in `shouldRefreshAccessToke`. If we
 * use the expiry time in {@link _OIDCTokenResponse} directly to check for expiry, it is possible
 * that the access token had passed the check but ends up being expired when it arrives at
 * the server due to slow traffic or unfair scheduler.
 *
 * To compat this, we should consider the access token expired earlier than the expiry time
 * calculated using {@link _OIDCTokenResponse.expires_in}. Current implementation uses
 * {@link EXPIRE_IN_PERCENTAGE} of {@link _OIDCTokenResponse.expires_in} to calculate the expiry time.
 *
 * @internal
 */
const EXPIRE_IN_PERCENTAGE = 0.9;

/**
 * @internal
 */
export interface _BaseContainerDelegate {
  storage: ContainerStorage;
  refreshTokenStorage: ContainerStorage;
  _setupCodeVerifier(): Promise<{
    verifier: string;
    challenge: string;
  }>;
  refreshAccessToken(): Promise<void>;
  onSessionStateChange: (reason: SessionStateChangeReason) => void;
}

/**
 * Base Container
 *
 * @internal
 */
export class _BaseContainer<T extends _BaseAPIClient> {
  /**
   *
   * Unique ID for this container.
   * @defaultValue "default"
   *
   * @public
   */
  name: string;

  /**
   * OIDC client ID
   *
   * @public
   */
  clientID?: string;

  /**
   * @internal
   */
  apiClient: T;

  /**
   * @public
   */
  sessionState: SessionState;

  /**
   * @public
   */
  accessToken?: string;

  /**
   * @internal
   */
  refreshToken?: string;

  /**
   * @internal
   */
  expireAt?: Date;

  /**
   * @internal
   */
  _delegate: _BaseContainerDelegate;

  constructor(
    options: ContainerOptions,
    apiClient: T,
    _delegate: _BaseContainerDelegate
  ) {
    this.name = options.name ?? "default";
    this.apiClient = apiClient;
    this.sessionState = "UNKNOWN";
    this._delegate = _delegate;
  }

  /**
   * @internal
   */
  async _persistTokenResponse(
    response: _OIDCTokenResponse,
    reason: SessionStateChangeReason
  ): Promise<void> {
    const { access_token, refresh_token, expires_in } = response;

    if (access_token == null || expires_in == null) {
      throw new Error("access_token or expires_in missing in Token Response");
    }

    this.accessToken = access_token;
    if (refresh_token) {
      this.refreshToken = refresh_token;
    }
    this.expireAt = new Date(
      new Date(Date.now()).getTime() + expires_in * EXPIRE_IN_PERCENTAGE * 1000
    );
    this._updateSessionState("AUTHENTICATED", reason);

    if (refresh_token) {
      await this._delegate.refreshTokenStorage.setRefreshToken(
        this.name,
        refresh_token
      );
    }
  }

  /**
   * @internal
   */
  async _clearSession(reason: SessionStateChangeReason): Promise<void> {
    await this._delegate.refreshTokenStorage.delRefreshToken(this.name);
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.expireAt = undefined;
    this._updateSessionState("NO_SESSION", reason);
  }

  /**
   * @public
   */
  async refreshAccessTokenIfNeeded(): Promise<void> {
    if (this.shouldRefreshAccessToken()) {
      await this._delegate.refreshAccessToken();
    }
  }

  /**
   * @public
   */
  async clearSessionState(): Promise<void> {
    await this._clearSession("CLEAR");
  }

  /**
   * @internal
   */
  shouldRefreshAccessToken(): boolean {
    // No need to refresh if we do not even have a refresh token.
    if (this.refreshToken == null) {
      return false;
    }

    // When we have a refresh token but not an access token
    if (this.accessToken == null) {
      return true;
    }

    // When we have a refresh token and an access token but its expiration is unknown.
    if (this.expireAt == null) {
      return true;
    }

    // When we have a refresh token and an access token but it is indeed expired.
    const now = new Date(Date.now());
    if (this.expireAt.getTime() < now.getTime()) {
      return true;
    }

    // Otherwise no need to refresh.
    return false;
  }

  /**
   * @public
   */
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.apiClient.fetch(input, init);
  }

  /**
   * @internal
   */
  async _refreshAccessToken(
    tokenRequest?: Partial<_OIDCTokenRequest>
  ): Promise<void> {
    // If token request fails due to other reasons, session will be kept and
    // the whole process can be retried.
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const refreshToken = await this._delegate.refreshTokenStorage.getRefreshToken(
      this.name
    );
    if (refreshToken == null) {
      // The API client has access token but we do not have the refresh token.
      await this._clearSession("NO_TOKEN");
      return;
    }

    let tokenResponse;
    try {
      tokenResponse = await this.apiClient._oidcTokenRequest({
        ...tokenRequest,
        grant_type: "refresh_token",
        client_id: clientID,
        refresh_token: refreshToken,
      });
    } catch (error) {
      // When the error is `invalid_grant`, the refresh token is no longer valid.
      // Clear the session in this case.
      // https://tools.ietf.org/html/rfc6749#section-5.2
      if (error.error === "invalid_grant") {
        await this._clearSession("INVALID");
        return;
      }

      throw error;
    }

    await this._persistTokenResponse(tokenResponse, "FOUND_TOKEN");
  }

  /**
   * @internal
   */
  // eslint-disable-next-line complexity
  async authorizeEndpoint(options: AuthorizeOptions): Promise<string> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const config = await this.apiClient._fetchOIDCConfiguration();
    const query = new URLSearchParams();

    const responseType = options.responseType ?? "code";
    query.append("response_type", responseType);
    if (responseType === "code") {
      // Authorization code need PKCE.
      const codeVerifier = await this._delegate._setupCodeVerifier();
      await this._delegate.storage.setOIDCCodeVerifier(
        this.name,
        codeVerifier.verifier
      );

      query.append("code_challenge_method", "S256");
      query.append("code_challenge", codeVerifier.challenge);
    }

    if (responseType === "code") {
      query.append(
        "scope",
        "openid offline_access https://authgear.com/scopes/full-access"
      );
    } else {
      query.append("scope", "openid https://authgear.com/scopes/full-access");
    }

    query.append("client_id", clientID);
    query.append("redirect_uri", options.redirectURI);
    if (options.state) {
      query.append("state", options.state);
    }
    if (options.prompt) {
      query.append("prompt", options.prompt);
    }
    if (options.loginHint) {
      query.append("login_hint", options.loginHint);
    }
    if (options.uiLocales) {
      query.append("ui_locales", options.uiLocales.join(" "));
    }
    if (options.weChatRedirectURI) {
      query.append("x_wechat_redirect_uri", options.weChatRedirectURI);
    }
    if (options.platform) {
      query.append("x_platform", options.platform);
    }
    if (options.page) {
      query.append("x_page", options.page);
    }

    return `${config.authorization_endpoint}?${query.toString()}`;
  }

  /**
   * @internal
   */
  async _finishAuthorization(
    url: string,
    tokenRequest?: Partial<_OIDCTokenRequest>
  ): Promise<AuthorizeResult> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const u = new URL(url);
    const params = u.searchParams;
    const uu = new URL(url);
    uu.hash = "";
    uu.search = "";
    const redirectURI: string = uu.toString();
    if (params.get("error")) {
      throw new OAuthError({
        error: params.get("error")!,
        error_description: params.get("error_description") ?? undefined,
      });
    }

    let userInfo;
    let tokenResponse;
    if (!params.has("code")) {
      // if authorization code is not provided (i.e. first-party web app), use
      // session cookie for authorization; no code exchange is needed.
      userInfo = await this.apiClient._oidcUserInfoRequest();
    } else {
      const code = params.get("code");
      if (!code) {
        throw new OAuthError({
          error: "invalid_request",
          error_description: "Missing parameter: code",
        });
      }
      const codeVerifier = await this._delegate.storage.getOIDCCodeVerifier(
        this.name
      );
      tokenResponse = await this.apiClient._oidcTokenRequest({
        ...tokenRequest,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectURI,
        client_id: clientID,
        code_verifier: codeVerifier ?? "",
      });
      userInfo = await this.apiClient._oidcUserInfoRequest(
        tokenResponse.access_token
      );
    }

    if (tokenResponse) {
      await this._persistTokenResponse(tokenResponse, "AUTHENTICATED");
    }

    return {
      userInfo,
      state: params.get("state") ?? undefined,
    };
  }

  /**
   * Update session state.
   *
   * @internal
   */
  _updateSessionState(
    state: SessionState,
    reason: SessionStateChangeReason
  ): void {
    this.sessionState = state;
    this._delegate.onSessionStateChange(reason);
  }
}
