/* global window */
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
   * Skip refreshing access token. Default is false.
   */
  skipRefreshAccessToken?: boolean;
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

    const { skipRefreshAccessToken = false } = options;
    if (this.shouldRefreshAccessToken()) {
      if (skipRefreshAccessToken) {
        // shouldRefreshAccessToken is true => refresh token exist
        // consider user as logged in if refresh token is available
        this._updateSessionState("AUTHENTICATED", "FOUND_TOKEN");
      } else {
        // update session state will be handled in refreshAccessToken
        await this.refreshAccessToken();
      }
    } else {
      if (this.accessToken != null) {
        this._updateSessionState("AUTHENTICATED", "FOUND_TOKEN");
      } else {
        this._updateSessionState("NO_SESSION", "NO_TOKEN");
      }
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
    return this._logout(options);
  }

  /**
   * Fetch user info.
   */
  async fetchUserInfo(): Promise<UserInfo> {
    return this.apiClient._oidcUserInfoRequest(this.accessToken);
  }

  /**
   * @public
   */
  async refreshAccessToken(): Promise<void> {
    await this._refreshAccessToken();
  }
}
