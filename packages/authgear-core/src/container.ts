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
  UserInfo,
  _PreAuthenticatedURLOptions,
  PromptOption,
  type InterAppSharedStorage,
} from "./types";
import { _base64URLDecode } from "./base64";
import { _decodeUTF8 } from "./utf8";
import {
  AuthgearError,
  PreAuthenticatedURLIDTokenNotFoundError,
  PreAuthenticatedURLDeviceSecretNotFoundError,
  PreAuthenticatedURLInsufficientScopeError,
  OAuthError,
} from "./error";
import { _BaseAPIClient } from "./client";

/**
 * To prevent user from using expired access token, we have to check in advance
 * whether it had expired in `shouldRefreshAccessToken`. If we
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
  sharedStorage: InterAppSharedStorage;
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

  isSSOEnabled: boolean;

  preAuthenticatedURLEnabled: boolean;

  sessionState: SessionState;

  idToken?: string;

  accessToken?: string;

  refreshToken?: string;

  expireAt?: Date;

  _delegate: _BaseContainerDelegate;

  private refreshAccessTokenTask: Promise<void> | null = null;

  constructor(
    options: ContainerOptions,
    apiClient: T,
    _delegate: _BaseContainerDelegate
  ) {
    this.name = options.name ?? "default";
    this.apiClient = apiClient;
    this.isSSOEnabled = false;
    this.preAuthenticatedURLEnabled = false;
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

  getAuthenticateScopes(options: { requestOfflineAccess: boolean }): string[] {
    const { requestOfflineAccess } = options;
    const scopes = ["openid", "https://authgear.com/scopes/full-access"];
    if (requestOfflineAccess) {
      scopes.push("offline_access");
    }
    if (this.preAuthenticatedURLEnabled) {
      scopes.push(
        "device_sso",
        "https://authgear.com/scopes/pre-authenticated-url"
      );
    }
    return scopes;
  }

  // eslint-disable-next-line class-methods-use-this
  getReauthenticateScopes(): string[] {
    // offline_access is not needed because we don't want a new refresh token to be generated
    // device_sso and pre-authenticated-url is also not needed,
    // because no new session should be generated so the scopes are not important.
    return ["openid", "https://authgear.com/scopes/full-access"];
  }

  // eslint-disable-next-line class-methods-use-this
  getSettingsActionScopes(): string[] {
    // offline_access is not needed because we don't want a new refresh token to be generated
    // device_sso and pre-authenticated-url is also not needed,
    // because session for settings should not be used to perform SSO.
    return ["openid", "https://authgear.com/scopes/full-access"];
  }

  async _persistTokenResponse(
    response: _OIDCTokenResponse,
    reason: SessionStateChangeReason
  ): Promise<void> {
    const { id_token, access_token, refresh_token, expires_in, device_secret } =
      response;

    if (access_token == null || expires_in == null) {
      throw new AuthgearError(
        "access_token or expires_in missing in Token Response"
      );
    }

    if (id_token != null) {
      this.idToken = id_token;
      await this._delegate.sharedStorage.setIDToken(this.name, id_token);
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

    if (device_secret != null) {
      await this._delegate.sharedStorage.setDeviceSecret(
        this.name,
        device_secret
      );
    }
  }

  async _clearSession(reason: SessionStateChangeReason): Promise<void> {
    await this._delegate.tokenStorage.delRefreshToken(this.name);
    await this._delegate.sharedStorage.onLogout(this.name);
    this.idToken = undefined;
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.expireAt = undefined;
    this._updateSessionState(SessionState.NoSession, reason);
  }

  async _handleInvalidGrantError(error: any): Promise<void> {
    // When the error is `invalid_grant`, the refresh token is no longer valid.
    // Clear the session in this case.
    // https://tools.ietf.org/html/rfc6749#section-5.2
    if (error != null) {
      if (error.error === "invalid_grant") {
        await this._clearSession(SessionStateChangeReason.Invalid);
      } else if (error.reason === "InvalidGrant") {
        await this._clearSession(SessionStateChangeReason.Invalid);
      }
    }
  }

  async refreshAccessTokenIfNeeded(): Promise<void> {
    if (this.refreshAccessTokenTask !== null) {
      return this.refreshAccessTokenTask;
    }
    const task = (async () => {
      if (this.shouldRefreshAccessToken()) {
        await this._delegate.refreshAccessToken();
      }
    })().finally(() => {
      if (task === this.refreshAccessTokenTask) {
        this.refreshAccessTokenTask = null;
      }
    });
    this.refreshAccessTokenTask = task;
    return task;
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

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
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

    const deviceSecret = await this._delegate.sharedStorage.getDeviceSecret(
      this.name
    );

    const request: _OIDCTokenRequest = {
      ...tokenRequest,
      grant_type: "refresh_token",
      client_id: clientID,
      refresh_token: refreshToken,
    };
    if (deviceSecret) {
      request.device_secret = deviceSecret;
    }

    let tokenResponse;
    try {
      tokenResponse = await this.apiClient._oidcTokenRequest(request);
    } catch (error: unknown) {
      await this._handleInvalidGrantError(error);
      if (error != null && (error as any).error === "invalid_grant") {
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
    const deviceSecret = await this._delegate.sharedStorage.getDeviceSecret(
      this.name
    );
    await this.refreshAccessTokenIfNeeded();
    const accessToken = this.accessToken;
    const tokenRequest: _OIDCTokenRequest = {
      grant_type: "urn:authgear:params:oauth:grant-type:id-token",
      client_id: clientID,
      access_token: accessToken,
    };
    if (deviceSecret) {
      tokenRequest.device_secret = deviceSecret;
    }
    try {
      const { id_token, device_secret } =
        await this.apiClient._oidcTokenRequest(tokenRequest);
      if (id_token != null) {
        this.idToken = id_token;
        await this._delegate.sharedStorage.setIDToken(this.name, id_token);
      }
      if (device_secret != null) {
        await this._delegate.sharedStorage.setDeviceSecret(
          this.name,
          device_secret
        );
      }
    } catch (error: unknown) {
      await this._handleInvalidGrantError(error);
      throw error;
    }
  }

  async getAuthorizationEndpoint(): Promise<URL> {
    const config = await this.apiClient._fetchOIDCConfiguration();
    return new URL(config.authorization_endpoint);
  }

  // eslint-disable-next-line complexity
  async authorizeEndpoint(
    options: _OIDCAuthenticationRequest
  ): Promise<string> {
    const clientID = options.clientID ?? this.clientID;
    if (clientID == null) {
      throw new AuthgearError("missing client ID");
    }

    const config = await this.apiClient._fetchOIDCConfiguration();
    const query = new URLSearchParams();

    const responseType = options.responseType;
    query.append("response_type", responseType);
    if (
      responseType === "code" ||
      responseType === "urn:authgear:params:oauth:response-type:settings-action"
    ) {
      // Authorization code need PKCE.
      const codeVerifier = await this._delegate._setupCodeVerifier();
      await this._delegate.storage.setOIDCCodeVerifier(
        this.name,
        codeVerifier.verifier
      );

      query.append("code_challenge_method", "S256");
      query.append("code_challenge", codeVerifier.challenge);
    }

    if (options.responseMode != null) {
      query.append("response_mode", options.responseMode);
    }

    if (options.scope != null) {
      query.append("scope", options.scope.join(" "));
    }

    query.append("client_id", clientID);
    query.append("redirect_uri", options.redirectURI);
    if (options.state != null) {
      query.append("state", options.state);
    }
    if (options.xState != null) {
      query.append("x_state", options.xState);
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
    if (options.xSettingsAction != null) {
      query.append("x_settings_action", options.xSettingsAction);
    }
    if (options.xSettingsActionQuery != null) {
      query.append(
        "x_settings_action_query",
        new URLSearchParams(
          Object.entries(options.xSettingsActionQuery)
        ).toString()
      );
    }
    if (options.xPreAuthenticatedURLToken != null) {
      query.append(
        "x_pre_authenticated_url_token",
        options.xPreAuthenticatedURLToken
      );
    }
    if (options.dpopJKT != null) {
      query.append("dpop_jkt", options.dpopJKT);
    }

    if (!this.isSSOEnabled) {
      // For backward compatibility
      // If the developer updates the SDK but not the server
      query.append("x_suppress_idp_session_cookie", "true");
    }
    query.append("x_sso_enabled", this.isSSOEnabled ? "true" : "false");
    if (options.authenticationFlowGroup != null) {
      query.append(
        "x_authentication_flow_group",
        options.authenticationFlowGroup
      );
    }

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

  async _finishSettingsAction(
    url: string,
    tokenRequest?: Partial<_OIDCTokenRequest>
  ): Promise<void> {
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
    await this.apiClient._oidcTokenRequest({
      ...tokenRequest,
      grant_type: "urn:authgear:params:oauth:grant-type:settings-action",
      code: code,
      redirect_uri: redirectURI,
      client_id: clientID,
      code_verifier: codeVerifier ?? "",
    });
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

  async _fetchUserInfo(accessToken?: string): Promise<UserInfo> {
    try {
      return await this.apiClient._oidcUserInfoRequest(accessToken);
    } catch (error: unknown) {
      await this._handleInvalidGrantError(error);
      throw error;
    }
  }

  async _getAppSessionToken(refreshToken: string): Promise<string> {
    try {
      const { app_session_token } = await this.apiClient.appSessionToken(
        refreshToken
      );
      return app_session_token;
    } catch (error: unknown) {
      await this._handleInvalidGrantError(error);
      throw error;
    }
  }

  async _exchangeForPreAuthenticatedURLToken(options: {
    clientID: string;
    idToken: string;
    deviceSecret: string;
  }): Promise<_OIDCTokenResponse> {
    const { clientID, idToken, deviceSecret } = options;
    try {
      const audience = await this.apiClient.getEndpointOrigin();
      const tokenExchangeResult = await this.apiClient._oidcTokenRequest({
        client_id: clientID,
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type:
          "urn:authgear:params:oauth:token-type:pre-authenticated-url-token",
        audience: audience,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        subject_token: idToken,
        actor_token_type: "urn:x-oath:params:oauth:token-type:device-secret",
        actor_token: deviceSecret,
      });
      return tokenExchangeResult;
    } catch (e: unknown) {
      if (e instanceof OAuthError && e.error === "insufficient_scope") {
        throw new PreAuthenticatedURLInsufficientScopeError();
      }
      throw e;
    }
  }

  async _makePreAuthenticatedURL(
    options: _PreAuthenticatedURLOptions
  ): Promise<string> {
    const clientID = options.webApplicationClientID;
    if (!this.preAuthenticatedURLEnabled) {
      throw new AuthgearError(
        "makePreAuthenticatedURL requires preAuthenticatedURLEnabled to be true"
      );
    }
    if (this.sessionState !== SessionState.Authenticated) {
      throw new AuthgearError(
        "makePreAuthenticatedURL requires authenticated user"
      );
    }
    let idToken = await this._delegate.sharedStorage.getIDToken(this.name);
    if (!idToken) {
      throw new PreAuthenticatedURLIDTokenNotFoundError();
    }
    const deviceSecret = await this._delegate.sharedStorage.getDeviceSecret(
      this.name
    );
    if (!deviceSecret) {
      throw new PreAuthenticatedURLDeviceSecretNotFoundError();
    }
    const tokenExchangeResult = await this._exchangeForPreAuthenticatedURLToken(
      {
        deviceSecret,
        idToken,
        clientID,
      }
    );
    // Here access_token is pre-authenticated-url-token
    const preAuthenticatedURLToken = tokenExchangeResult.access_token;
    const newDeviceSecret = tokenExchangeResult.device_secret;
    const newIDToken = tokenExchangeResult.id_token;
    if (preAuthenticatedURLToken == null) {
      throw new AuthgearError("unexpected: access_token is not returned");
    }
    if (newDeviceSecret != null) {
      await this._delegate.sharedStorage.setDeviceSecret(
        this.name,
        newDeviceSecret
      );
    }
    if (newIDToken != null) {
      idToken = newIDToken;
      this.idToken = newIDToken;
      await this._delegate.sharedStorage.setIDToken(this.name, newIDToken);
    }
    const url = await this.authorizeEndpoint({
      responseType:
        "urn:authgear:params:oauth:response-type:pre-authenticated-url token",
      responseMode: "cookie",
      redirectURI: options.webApplicationURI,
      clientID: options.webApplicationClientID,
      xPreAuthenticatedURLToken: preAuthenticatedURLToken,
      idTokenHint: idToken,
      prompt: PromptOption.None,
      state: options.state,
    });
    return url;
  }
}
