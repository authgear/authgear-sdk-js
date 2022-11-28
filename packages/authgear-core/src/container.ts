/* global Uint8Array */
import URL from "core-js-pure/features/url";
import URLSearchParams from "core-js-pure/features/url-search-params";
import {
  _OIDCAuthenticationRequest,
  _AuthenticateResult,
  _ReauthenticateResult,
  ContainerOptions,
  _ContainerStorage,
  TokenStorage,
  _APIClientDelegate,
  _OIDCTokenRequest,
  _OIDCTokenResponse,
  SessionStateChangeReason,
  SessionState,
} from "./types";
import { _base64URLDecode } from "./base64";
import { _decodeUTF8 } from "./utf8";
import { AuthgearError, OAuthError } from "./error";
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
  storage: _ContainerStorage;
  tokenStorage: TokenStorage;
  _setupCodeVerifier(): Promise<{
    verifier: string;
    challenge: string;
  }>;
  refreshAccessToken(): Promise<void>;
  onSessionStateChange: (reason: SessionStateChangeReason) => void;
}

/**
 * @internal
 */
export function _decodeIDToken(
  idToken: string | undefined
): Record<string, unknown> | undefined {
  // idToken is the format
  // base64URLEncode(header) "." base64URLEncode(payload) "." signature
  if (idToken == null) {
    return undefined;
  }
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    return undefined;
  }
  const payload = parts[1];
  const utf8Bytes = _base64URLDecode(payload);
  const utf8Str = _decodeUTF8(new Uint8Array(utf8Bytes));
  const idTokenPayload = JSON.parse(utf8Str);
  return idTokenPayload;
}

/**
 * @internal
 */
export function _canReauthenticate(
  idTokenPayload: Record<string, unknown>
): boolean {
  const can =
    idTokenPayload["https://authgear.com/claims/user/can_reauthenticate"];
  if (typeof can === "boolean") {
    return can;
  }
  return false;
}

/**
 * @internal
 */
export function _getAuthTime(
  idTokenPayload: Record<string, unknown>
): Date | undefined {
  const authTimeValue = idTokenPayload["auth_time"];
  if (typeof authTimeValue === "number") {
    // authTimeValue is Unix epoch while JavaScript Date constructor accepts milliseconds.
    return new Date(authTimeValue * 1000);
  }
  return undefined;
}

/**
 * Base Container
 *
 * @internal
 */
export class _BaseContainer<T extends _BaseAPIClient> {
  name: string;

  clientID?: string;

  apiClient: T;

  ssoEnabled: boolean;

  sessionState: SessionState;

  idToken?: string;

  accessToken?: string;

  refreshToken?: string;

  expireAt?: Date;

  _delegate: _BaseContainerDelegate;

  constructor(
    options: ContainerOptions,
    apiClient: T,
    _delegate: _BaseContainerDelegate
  ) {
    this.name = options.name ?? "default";
    this.apiClient = apiClient;
    this.ssoEnabled = false;
    this.sessionState = SessionState.Unknown;
    this._delegate = _delegate;
  }

  getIDTokenHint(): string | undefined {
    return this.idToken;
  }

  canReauthenticate(): boolean {
    const payload = _decodeIDToken(this.idToken);
    if (payload == null) {
      return false;
    }
    return _canReauthenticate(payload);
  }

  getAuthTime(): Date | undefined {
    const payload = _decodeIDToken(this.idToken);
    if (payload == null) {
      return undefined;
    }
    return _getAuthTime(payload);
  }

  async _persistTokenResponse(
    response: _OIDCTokenResponse,
    reason: SessionStateChangeReason
  ): Promise<void> {
    const { id_token, access_token, refresh_token, expires_in } = response;

    if (access_token == null || expires_in == null) {
      throw new AuthgearError(
        "access_token or expires_in missing in Token Response"
      );
    }

    if (id_token != null) {
      this.idToken = id_token;
    }
    this.accessToken = access_token;
    if (refresh_token) {
      this.refreshToken = refresh_token;
    }
    this.expireAt = new Date(
      new Date(Date.now()).getTime() + expires_in * EXPIRE_IN_PERCENTAGE * 1000
    );
    this._updateSessionState(SessionState.Authenticated, reason);

    if (refresh_token) {
      await this._delegate.tokenStorage.setRefreshToken(
        this.name,
        refresh_token
      );
    }
  }

  async _clearSession(reason: SessionStateChangeReason): Promise<void> {
    await this._delegate.tokenStorage.delRefreshToken(this.name);
    this.idToken = undefined;
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.expireAt = undefined;
    this._updateSessionState(SessionState.NoSession, reason);
  }

  async refreshAccessTokenIfNeeded(): Promise<void> {
    if (this.shouldRefreshAccessToken()) {
      await this._delegate.refreshAccessToken();
    }
  }

  async clearSessionState(): Promise<void> {
    await this._clearSession(SessionStateChangeReason.Clear);
  }

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

  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.apiClient.fetch(input, init);
  }

  async _refreshAccessToken(
    tokenRequest?: Partial<_OIDCTokenRequest>
  ): Promise<void> {
    // If token request fails due to other reasons, session will be kept and
    // the whole process can be retried.
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
    }

    const refreshToken = await this._delegate.tokenStorage.getRefreshToken(
      this.name
    );
    if (refreshToken == null) {
      // The API client has access token but we do not have the refresh token.
      await this._clearSession(SessionStateChangeReason.NoToken);
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
    } catch (error: unknown) {
      // When the error is `invalid_grant`, the refresh token is no longer valid.
      // Clear the session in this case.
      // https://tools.ietf.org/html/rfc6749#section-5.2
      if (error != null && (error as any).error === "invalid_grant") {
        await this._clearSession(SessionStateChangeReason.Invalid);
        return;
      }

      throw error;
    }

    await this._persistTokenResponse(
      tokenResponse,
      SessionStateChangeReason.FoundToken
    );
  }

  async refreshIDToken(): Promise<void> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
    }
    await this.refreshAccessTokenIfNeeded();
    const accessToken = this.accessToken;
    const tokenRequest: _OIDCTokenRequest = {
      grant_type: "urn:authgear:params:oauth:grant-type:id-token",
      client_id: clientID,
      access_token: accessToken,
    };
    const { id_token } = await this.apiClient._oidcTokenRequest(tokenRequest);
    if (id_token != null) {
      this.idToken = id_token;
    }
  }

  // eslint-disable-next-line complexity
  async authorizeEndpoint(
    options: _OIDCAuthenticationRequest
  ): Promise<string> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
    }

    const config = await this.apiClient._fetchOIDCConfiguration();
    const query = new URLSearchParams();

    const responseType = options.responseType;
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

    query.append("scope", options.scope.join(" "));

    query.append("client_id", clientID);
    query.append("redirect_uri", options.redirectURI);
    if (options.state != null) {
      query.append("state", options.state);
    }
    if (options.prompt != null) {
      if (typeof options.prompt === "string") {
        query.append("prompt", options.prompt);
      } else if (options.prompt.length > 0) {
        query.append("prompt", options.prompt.join(" "));
      }
    }
    if (options.loginHint != null) {
      query.append("login_hint", options.loginHint);
    }
    if (options.uiLocales != null) {
      query.append("ui_locales", options.uiLocales.join(" "));
    }
    if (options.colorScheme != null) {
      query.append("x_color_scheme", options.colorScheme);
    }
    if (options.idTokenHint != null) {
      query.append("id_token_hint", options.idTokenHint);
    }
    if (options.maxAge != null) {
      query.append("max_age", String(options.maxAge));
    }
    if (options.wechatRedirectURI != null) {
      query.append("x_wechat_redirect_uri", options.wechatRedirectURI);
    }
    if (options.platform != null) {
      query.append("x_platform", options.platform);
    }
    if (options.page != null) {
      query.append("x_page", options.page);
    }
    if (options.oauthProviderAlias != null) {
      query.append("x_oauth_provider_alias", options.oauthProviderAlias);
    }
    if (!this.ssoEnabled) {
      // For backward compatibility
      // If the developer updates the SDK but not the server
      query.append("x_suppress_idp_session_cookie", "true");
    }
    query.append("x_sso_enabled", this.ssoEnabled ? "true" : "false");

    return `${config.authorization_endpoint}?${query.toString()}`;
  }

  async _finishAuthentication(
    url: string,
    codeRequired: boolean,
    tokenRequest?: Partial<_OIDCTokenRequest>
  ): Promise<_AuthenticateResult> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
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
    if (!codeRequired) {
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
      await this._persistTokenResponse(
        tokenResponse,
        SessionStateChangeReason.Authenticated
      );
    }

    return {
      userInfo,
      state: params.get("state") ?? undefined,
    };
  }

  async _finishReauthentication(
    url: string,
    tokenRequest?: Partial<_OIDCTokenRequest>
  ): Promise<_ReauthenticateResult> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
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

    const { id_token, access_token } = await this.apiClient._oidcTokenRequest({
      ...tokenRequest,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectURI,
      client_id: clientID,
      code_verifier: codeVerifier ?? "",
    });

    const userInfo = await this.apiClient._oidcUserInfoRequest(access_token);

    if (id_token != null) {
      this.idToken = id_token;
    }

    return {
      userInfo,
      state: params.get("state") ?? undefined,
    };
  }

  /**
   * Update session state.
   */
  _updateSessionState(
    state: SessionState,
    reason: SessionStateChangeReason
  ): void {
    this.sessionState = state;
    this._delegate.onSessionStateChange(reason);
  }
}
