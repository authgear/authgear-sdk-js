/* global window */
import {
  UserInfo,
  ContainerOptions,
  GlobalJSONContainerStorage,
  BaseContainer,
  AuthorizeOptions,
  AuthorizeResult,
} from "@authgear/core";
import { WebAPIClient } from "./client";
import { localStorageStorageDriver } from "./storage";
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
   * isThirdParty indicate if the application a third party app.
   * A third party app means the app doesn't share common-domain with Authgear thus the session cookie cannot be shared.
   * If not specified, default to false. So by default the application is considered first party.
   */
  isThirdParty?: boolean;
  /**
   * Skip refreshing access token. Default is false.
   */
  skipRefreshAccessToken?: boolean;
}

/**
 * Web Container
 *
 * @public
 */
export class WebContainer<T extends WebAPIClient> extends BaseContainer<T> {
  constructor(options?: ContainerOptions<T>) {
    const o = {
      ...options,
      apiClient: options?.apiClient ?? new WebAPIClient(),
      storage:
        options?.storage ??
        new GlobalJSONContainerStorage(localStorageStorageDriver),
    } as ContainerOptions<T>;

    super(o);

    this.isThirdParty = false;
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
    // TODO: verify if we need to support configure for second time
    // and guard if initialized
    const refreshToken = await this.storage.getRefreshToken(this.name);

    this.clientID = options.clientID;
    this.isThirdParty = !!options.isThirdParty;
    this.apiClient.endpoint = options.endpoint;

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
   * To allow re-authentication of different user smoothly for third-party app, default value for `options.prompt` is `login`.
   *
   * @param options - authorize options
   */
  async startAuthorization(options: AuthorizeOptions): Promise<void> {
    const isThirdParty = this.isThirdParty ?? false;
    if (!isThirdParty) {
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
}
