/* global window */
import {
  Container,
  User,
  ContainerOptions,
  GlobalJSONContainerStorage,
  OIDCContainer,
  AuthorizeOptions,
} from "@skygear/core";
import { WebAPIClient } from "./client";
import { localStorageStorageDriver } from "./storage";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";

/**
 * Skygear OIDC APIs (for web platforms).
 *
 * @public
 */
export class WebOIDCContainer<T extends WebAPIClient> extends OIDCContainer<T> {
  clientID?: string;
  isThirdParty: boolean;

  constructor(parent: WebContainer<T>) {
    super(parent);
    this.isThirdParty = false;
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
  async finishAuthorization(): Promise<{ user: User; state?: string }> {
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
 * Skygear APIs container (for web platforms).
 *
 * @public
 */
export class WebContainer<T extends WebAPIClient> extends Container<T> {
  auth: WebOIDCContainer<T>;

  constructor(options?: ContainerOptions<T>) {
    const o = {
      ...options,
      apiClient: options?.apiClient ?? new WebAPIClient(),
      storage:
        options?.storage ??
        new GlobalJSONContainerStorage(localStorageStorageDriver),
    } as ContainerOptions<T>;

    super(o);
    this.auth = new WebOIDCContainer(this);
  }

  /**
   * Configure this container with connection information.
   *
   * @param options - Skygear connection information
   */
  async configure(options: ConfigureOptions): Promise<void> {
    const accessToken = await this.storage.getAccessToken(this.name);
    const user = await this.storage.getUser(this.name);
    const sessionID = await this.storage.getSessionID(this.name);

    this.apiClient.endpoint = options.endpoint;
    this.apiClient._refreshTokenFunction = this.auth._refreshAccessToken.bind(
      this.auth
    );
    this.apiClient._accessToken = accessToken ?? undefined;

    this.auth.currentUser = user ?? undefined;
    this.auth.currentSessionID = sessionID ?? undefined;
    this.auth.clientID = options.clientID;
    this.auth.isThirdParty = !!options.isThirdPartyApp;

    // should refresh token when app start
    this.apiClient._setShouldRefreshTokenNow();
  }
}
