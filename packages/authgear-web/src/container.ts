/* global window */
import URLSearchParams from "core-js-pure/features/url-search-params";
import {
  UserInfo,
  ContainerOptions,
  GlobalJSONContainerStorage,
  BaseContainer,
  AuthorizeOptions,
  AuthorizeResult,
  ContainerStorage,
} from "@authgear/core";
import { WebAPIClient } from "./client";
import {
  localStorageStorageDriver,
  sessionStorageStorageDriver,
} from "./storage";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";

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
  /**
   * transientSession indicate if the session in SDK is short-lived session.
   * If transientSession is true means the session is short-lived session.
   * In web, the session will be stored in sessionStorage, that means it only persists within the same browser tab.
   */
  transientSession?: boolean;
}

/**
 * Web Container
 *
 * @public
 */
export class WebContainer<T extends WebAPIClient> extends BaseContainer<T> {
  /**
   * @public
   */
  sessionType: "cookie" | "refresh_token";

  refreshTokenStorage: ContainerStorage;

  constructor(options?: ContainerOptions<T>) {
    const o = {
      ...options,
      apiClient: options?.apiClient ?? new WebAPIClient(),
      storage:
        options?.storage ??
        new GlobalJSONContainerStorage(localStorageStorageDriver),
    } as ContainerOptions<T>;

    super(o);

    this.refreshTokenStorage = this.storage;
    this.sessionType = "refresh_token";
    this.apiClient._delegate = this;
  }

  /**
   * configure() configures the container with the client ID and the endpoint.
   * It also does local IO to retrieve the refresh token.
   * It finally does network IO to refresh the access token.
   *
   * Therefore, it is possible that configure() could fail for many reasons.
   * If your application is offline first, be prepared for handling errors.
   *
   * configure() can be called more than once if it failed.
   * Otherwise, it is NOT recommended to call it more than once.
   *
   * @public
   */
  async configure(options: ConfigureOptions): Promise<void> {
    if (options.transientSession) {
      this.refreshTokenStorage = new GlobalJSONContainerStorage(
        sessionStorageStorageDriver
      );
    } else {
      this.refreshTokenStorage = this.storage;
    }
    // TODO: verify if we need to support configure for second time
    // and guard if initialized
    const refreshToken = await this.refreshTokenStorage.getRefreshToken(
      this.name
    );

    this.clientID = options.clientID;
    this.apiClient.endpoint = options.endpoint;
    if (options.sessionType != null) {
      this.sessionType = options.sessionType;
    }

    this.refreshToken = refreshToken ?? undefined;

    switch (this.sessionType) {
      case "cookie":
        this._updateSessionState("UNKNOWN", "NO_TOKEN");
        break;
      case "refresh_token":
        if (this.refreshToken != null) {
          // consider user as logged in if refresh token is available
          this._updateSessionState("AUTHENTICATED", "FOUND_TOKEN");
        } else {
          this._updateSessionState("NO_SESSION", "NO_TOKEN");
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
   * Start authorization by opening authorize page
   *
   * @param options - authorize options
   */
  async startAuthorization(options: AuthorizeOptions): Promise<void> {
    if (this.sessionType === "cookie") {
      // Use shared session cookie by default for first-party web apps.
      options.responseType = options.responseType ?? "none";
    }

    const authorizeEndpoint = await this.authorizeEndpoint(options);
    window.location.href = authorizeEndpoint;
  }

  /**
   * Finish authorization
   *
   * exchangeToken read window.location.
   * It checks if error is present and rejects with OAuthError.
   * Otherwise assume code is present, make a token request.
   */
  async finishAuthorization(): Promise<AuthorizeResult> {
    return this._finishAuthorization(window.location.href);
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

  private async _logoutRefreshToken(options: {
    force?: boolean;
  }): Promise<void> {
    const refreshToken =
      (await this.refreshTokenStorage.getRefreshToken(this.name)) ?? "";
    if (refreshToken !== "") {
      try {
        await this.apiClient._oidcRevocationRequest(refreshToken);
      } catch (error) {
        if (!options.force) {
          throw error;
        }
      }
      await this._clearSession("LOGOUT");
    }
  }

  private async _logoutCookie(options: {
    redirectURI?: string;
  }): Promise<void> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }
    const config = await this.apiClient._fetchOIDCConfiguration();

    const { id_token } = await this.apiClient._oidcTokenRequest({
      grant_type: "urn:authgear:params:oauth:grant-type:id-token",
      client_id: clientID,
    });

    const query = new URLSearchParams();
    query.append("id_token_hint", id_token);
    if (options.redirectURI) {
      query.append("post_logout_redirect_uri", options.redirectURI);
    }
    const endSessionEndpoint = `${
      config.end_session_endpoint
    }?${query.toString()}`;
    window.location.href = endSessionEndpoint;
  }

  /**
   * Fetch user info.
   */
  async fetchUserInfo(): Promise<UserInfo> {
    await this.refreshAccessTokenIfNeeded();
    return this.apiClient._oidcUserInfoRequest(this.accessToken);
  }

  /**
   * @public
   */
  async refreshAccessToken(): Promise<void> {
    await this._refreshAccessToken();
  }
}
