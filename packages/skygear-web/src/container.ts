/* global window */
import {
  UserInfo,
  ContainerOptions,
  GlobalJSONContainerStorage,
  BaseContainer,
  AuthorizeOptions,
} from "@skygear/core";
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
   * isThirdPartyApp indicate if the application a third party app.
   * A third party app means the app doesn't share common-domain with Skygear Auth thus the session cookie cannot be shared.
   * If not specified, default to false. So by default the application is considered first party.
   */
  isThirdPartyApp?: boolean;
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
    this.apiClient.delegate = this;
  }

  /**
   * Configure this container with connection information.
   *
   * @public
   */
  async configure(options: ConfigureOptions): Promise<void> {
    this.clientID = options.clientID;
    this.isThirdParty = !!options.isThirdPartyApp;
    this.apiClient.endpoint = options.endpoint;

    // TODO: load refresh token
    // Refresh access token when app launches.
    this.apiClient._accessTokenExpireAt = undefined;
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
  async finishAuthorization(): Promise<{ userInfo: UserInfo; state?: string }> {
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
}
