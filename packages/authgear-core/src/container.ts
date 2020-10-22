import URL from "core-js-pure/features/url";
import URLSearchParams from "core-js-pure/features/url-search-params";
import {
  AuthorizeOptions,
  AuthorizeResult,
  ContainerOptions,
  ContainerStorage,
  OAuthError,
  _APIClientDelegate,
  ContainerDelegate,
  _OIDCTokenResponse,
  OnSessionStateChangedListener,
  SessionStateChangeReason,
  SessionState,
} from "./types";
import { BaseAPIClient } from "./client";

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
 * Base Container
 *
 * @public
 */
export abstract class BaseContainer<T extends BaseAPIClient> {
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
   * Whether the application shares cookies with Authgear.
   *
   * Only web application can shares cookies so all native applications
   * are considered third party.
   *
   * @public
   */
  isThirdParty?: boolean;

  /**
   * @public
   */
  apiClient: T;

  /**
   * @public
   */
  delegate?: ContainerDelegate;

  /**
   * @internal
   */
  storage: ContainerStorage;

  /**
   * @internal
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
  sessionState: SessionState;

  /**
   * @internal
   */
  onSessionStateChangedListeners: OnSessionStateChangedListener[];

  /**
   * @internal
   */
  abstract async _setupCodeVerifier(): Promise<{
    verifier: string;
    challenge: string;
  }>;

  constructor(options: ContainerOptions<T>) {
    if (!options.apiClient) {
      throw Error("missing apiClient");
    }

    if (!options.storage) {
      throw Error("missing storage");
    }

    this.name = options.name ?? "default";
    this.apiClient = options.apiClient;
    this.storage = options.storage;
    this.sessionState = "Unknown";
    this.onSessionStateChangedListeners = [];
  }

  /**
   * @internal
   */
  async _persistTokenResponse(
    response: _OIDCTokenResponse,
    reason: SessionStateChangeReason
  ): Promise<void> {
    const { access_token, refresh_token, expires_in } = response;

    this.accessToken = access_token;
    this.refreshToken = refresh_token;
    this.expireAt = new Date(
      new Date(Date.now()).getTime() + expires_in * EXPIRE_IN_PERCENTAGE * 1000
    );
    this._updateSessionState("LoggedIn", reason);

    if (refresh_token) {
      await this.storage.setRefreshToken(this.name, refresh_token);
    }
  }

  /**
   * @internal
   */
  async _clearSession(reason: SessionStateChangeReason): Promise<void> {
    await this.storage.delRefreshToken(this.name);
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.expireAt = undefined;
    this._updateSessionState("NoSession", reason);
  }

  /**
   * @internal
   */
  getAccessToken(): string | undefined {
    return this.accessToken;
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
   * @internal
   */
  async refreshAccessToken(): Promise<void> {
    // If token request fails due to other reasons, session will be kept and
    // the whole process can be retried.
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const refreshToken = await this.storage.getRefreshToken(this.name);
    if (refreshToken == null) {
      // The API client has access token but we do not have the refresh token.
      await this._clearSession("NoToken");
      return;
    }

    let tokenResponse;
    try {
      tokenResponse = await this.apiClient._oidcTokenRequest({
        grant_type: "refresh_token",
        client_id: clientID,
        refresh_token: refreshToken,
      });
    } catch (error) {
      // When the error is `invalid_grant`, the refresh token is no longer valid.
      // Clear the session in this case.
      // https://tools.ietf.org/html/rfc6749#section-5.2
      if (error.error === "invalid_grant") {
        if (this.delegate != null) {
          await this.delegate.onRefreshTokenExpired();
        }

        await this._clearSession("Expired");
        return;
      }

      throw error;
    }

    await this._persistTokenResponse(tokenResponse, "FoundToken");
  }

  /**
   * @internal
   */
  async authorizeEndpoint(options: AuthorizeOptions): Promise<string> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const config = await this.apiClient._fetchOIDCConfiguration();
    const query = new URLSearchParams();

    if (this.isThirdParty) {
      const codeVerifier = await this._setupCodeVerifier();
      await this.storage.setOIDCCodeVerifier(this.name, codeVerifier.verifier);

      query.append("response_type", "code");
      query.append(
        "scope",
        "openid offline_access https://authgear.com/scopes/full-access"
      );
      query.append("code_challenge_method", "S256");
      query.append("code_challenge", codeVerifier.challenge);
    } else {
      // for first party app
      query.append("response_type", "none");
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

    return `${config.authorization_endpoint}?${query.toString()}`;
  }

  /**
   * @internal
   */
  async _finishAuthorization(url: string): Promise<AuthorizeResult> {
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
      const err = {
        error: params.get("error"),
        error_description: params.get("error_description"),
      } as OAuthError;
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw err;
    }

    let userInfo;
    let tokenResponse;
    if (!this.isThirdParty) {
      // if the app is first party app, use session cookie for authorization
      // no code exchange is needed.
      userInfo = await this.apiClient._oidcUserInfoRequest();
    } else {
      const code = params.get("code");
      if (!code) {
        const missingCodeError = {
          error: "invalid_request",
          error_description: "Missing parameter: code",
        } as OAuthError;
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw missingCodeError;
      }
      const codeVerifier = await this.storage.getOIDCCodeVerifier(this.name);
      tokenResponse = await this.apiClient._oidcTokenRequest({
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
      await this._persistTokenResponse(tokenResponse, "Authorized");
    }

    return {
      userInfo,
      state: params.get("state") ?? undefined,
    };
  }

  /**
   * Add listener on session state change.
   * Listeners are distinguished by reference.
   *
   * @internal
   */
  _addOnSessionStateChangedListener(
    listener: OnSessionStateChangedListener
  ): void {
    this.onSessionStateChangedListeners.push(listener);
  }

  /**
   * Remove listener on session state change.
   * Listeners are distinguished by reference.
   *
   * @internal
   */
  _removeOnSessionStateChangedListener(
    listener: OnSessionStateChangedListener
  ): void {
    const targetIndex = this.onSessionStateChangedListeners.findIndex(
      (listListener) => listListener === listener
    );
    if (targetIndex > -1) {
      this.onSessionStateChangedListeners.splice(targetIndex, 1);
    }
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
    for (const listener of this.onSessionStateChangedListeners) {
      listener.onSessionStateChanged(this, reason);
    }
  }

  /**
   * Logout current session.
   *
   * @internal
   *
   * @remarks
   * If `force` parameter is set to `true`, all potential errors (e.g. network
   * error) would be ignored.
   *
   * `redirectURI` will be used only for the first party app
   *
   * @param options - Logout options
   */
  async _logout(
    options: { force?: boolean; redirectURI?: string } = {}
  ): Promise<void> {
    if (this.isThirdParty) {
      try {
        const refreshToken =
          (await this.storage.getRefreshToken(this.name)) ?? "";
        await this.apiClient._oidcRevocationRequest(refreshToken);
      } catch (error) {
        if (!options.force) {
          throw error;
        }
      }
      await this._clearSession("Logout");
    } else {
      const config = await this.apiClient._fetchOIDCConfiguration();
      const query = new URLSearchParams();
      if (options.redirectURI) {
        query.append("post_logout_redirect_uri", options.redirectURI);
      }
      const endSessionEndpoint = `${
        config.end_session_endpoint
      }?${query.toString()}`;
      await this._clearSession("Logout");
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-undef
        window.location.href = endSessionEndpoint;
      }
    }
  }
}
