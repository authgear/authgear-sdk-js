/* global fetch, Request */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BaseAPIClient,
  ContainerOptions,
  GlobalJSONContainerStorage,
  StorageDriver,
  BaseContainer,
  AuthorizeOptions,
  AuthorizeResult,
  PromoteOptions,
  UserInfo,
} from "@authgear/core";
import { generateCodeVerifier, computeCodeChallenge } from "./pkce";
import { openURL, openAuthorizeURL } from "./nativemodule";
import { getCallbackURLScheme } from "./url";
import { getAnonymousJWK, signAnonymousJWT } from "./jwt";
import { Platform } from "react-native";
export * from "@authgear/core";

/**
 * @public
 */
export enum Page {
  Settings = "/settings",
  Identities = "/settings/identities",
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
   * Skip refreshing access token. Default is false.
   */
  skipRefreshAccessToken?: boolean;
  /**
   * isThirdParty indicate if the application a third party app.
   * A third party app means the app doesn't share common-domain with Authgear thus the session cookie cannot be shared.
   * If not specified, default to true. So by default the application is considered third party.
   */
  isThirdParty?: boolean;
}

/**
 * @public
 */
export class ReactNativeAPIClient extends BaseAPIClient {
  _fetchFunction = fetch;
  _requestClass = Request;
}

/**
 * @public
 */
export class ReactNativeAsyncStorageStorageDriver implements StorageDriver {
  // eslint-disable-next-line class-methods-use-this
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  // eslint-disable-next-line class-methods-use-this
  async set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
  // eslint-disable-next-line class-methods-use-this
  async del(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}

/**
 * React Native Container.
 *
 * @public
 */
export class ReactNativeContainer<
  T extends ReactNativeAPIClient
> extends BaseContainer<T> {
  constructor(options?: ContainerOptions<T>) {
    const o = {
      ...options,
      apiClient: options?.apiClient ?? new ReactNativeAPIClient(),
      storage:
        options?.storage ??
        new GlobalJSONContainerStorage(
          new ReactNativeAsyncStorageStorageDriver()
        ),
    } as ContainerOptions<T>;

    super(o);

    this.isThirdParty = true;
    this.apiClient._delegate = this;
  }

  /**
   * Configure this container with connection information.
   *
   * @public
   */
  async configure(options: ConfigureOptions): Promise<void> {
    // TODO: verify if we need to support configure for second time
    // and guard if initialized
    const refreshToken = await this.storage.getRefreshToken(this.name);

    this.clientID = options.clientID;
    this.apiClient.endpoint = options.endpoint;
    this.isThirdParty = options.isThirdParty ?? true;
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
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);
    return {
      verifier: codeVerifier,
      challenge: codeChallenge,
    };
  }

  /**
   * Open authorize page.
   *
   * To allow re-authentication of different user smoothly, default value for `options.prompt` is `login`.
   *
   * @param options - authorize options
   */
  async authorize(options: AuthorizeOptions): Promise<AuthorizeResult> {
    const redirectURIScheme = getCallbackURLScheme(options.redirectURI);
    if (options.prompt === undefined) {
      options.prompt = "login";
    }
    const platform = Platform.OS;
    const authorizeURL = await this.authorizeEndpoint({
      ...options,
      platform,
    });
    const redirectURL = await openAuthorizeURL(authorizeURL, redirectURIScheme);
    return this._finishAuthorization(redirectURL);
  }

  /**
   * Open the URL with the user agent authenticated with current user.
   */

  // eslint-disable-next-line class-methods-use-this
  async openURL(url: string): Promise<void> {
    let targetURL = url;

    const refreshToken = await this.storage.getRefreshToken(this.name);
    if (!refreshToken) {
      throw new Error("refresh token not found");
    }

    // Use app session token to copy session into webview.
    const { app_session_token } = await this.apiClient.appSessionToken(
      refreshToken
    );

    const loginHint = `https://authgear.com/login_hint?type=app_session_token&app_session_token=${encodeURIComponent(
      app_session_token
    )}`;

    targetURL = await this.authorizeEndpoint({
      redirectURI: url,
      prompt: "none",
      responseType: "none",
      loginHint,
    });

    await openURL(targetURL);
  }

  async open(page: Page): Promise<void> {
    const { endpoint } = this.apiClient;
    if (endpoint == null) {
      throw new Error(
        "Endpoint cannot be undefined, please double check whether you have run configure()"
      );
    }
    const endpointWithoutTrailingSlash = endpoint.replace(/\/$/, "");
    await this.openURL(`${endpointWithoutTrailingSlash}${page}`);
  }

  /**
   * Logout.
   *
   * @remarks
   * If `force` parameter is set to `true`, all potential errors (e.g. network
   * error) would be ignored.
   *
   * @param options - Logout options
   */
  async logout(
    options: {
      force?: boolean;
    } = {}
  ): Promise<void> {
    return this._logout(options);
  }

  /**
   * Authenticate as an anonymous user.
   */
  async authenticateAnonymously(): Promise<AuthorizeResult> {
    const clientID = this.clientID;
    if (clientID == null) {
      throw new Error("missing client ID");
    }

    const { token } = await this.apiClient.oauthChallenge("anonymous_request");

    const keyID = await this.storage.getAnonymousKeyID(this.name);
    const key = await getAnonymousJWK(keyID);

    const now = Math.floor(+new Date() / 1000);
    const header = { typ: "vnd.authgear.anonymous-request", ...key };
    const payload = {
      iat: +now,
      exp: +now + 60,
      challenge: token,
      action: "auth",
    };
    const jwt = await signAnonymousJWT(key.kid, header, payload);

    const tokenResponse = await this.apiClient._oidcTokenRequest({
      grant_type: "urn:authgear:params:oauth:grant-type:anonymous-request",
      client_id: clientID,
      jwt,
    });

    const userInfo = await this.apiClient._oidcUserInfoRequest(
      tokenResponse.access_token
    );

    await this._persistTokenResponse(tokenResponse, "AUTHENTICATED");
    await this.storage.setAnonymousKeyID(this.name, key.kid);
    return { userInfo };
  }

  /**
   * Open promote anonymous user page
   *
   * @param options - promote options
   */
  async promoteAnonymousUser(
    options: PromoteOptions
  ): Promise<AuthorizeResult> {
    const keyID = await this.storage.getAnonymousKeyID(this.name);
    if (!keyID) {
      throw new Error("anonymous user credentials not found");
    }
    const key = await getAnonymousJWK(keyID);

    const { token } = await this.apiClient.oauthChallenge("anonymous_request");

    const now = Math.floor(+new Date() / 1000);
    const header = { typ: "vnd.authgear.anonymous-request", ...key };
    const payload = {
      iat: +now,
      exp: +now + 60,
      challenge: token,
      action: "promote",
    };
    const jwt = await signAnonymousJWT(key.kid, header, payload);
    const loginHint = `https://authgear.com/login_hint?type=anonymous&jwt=${encodeURIComponent(
      jwt
    )}`;

    const redirectURIScheme = getCallbackURLScheme(options.redirectURI);
    const platform = Platform.OS;
    const authorizeURL = await this.authorizeEndpoint({
      ...options,
      prompt: "login",
      loginHint,
      platform,
    });
    const redirectURL = await openAuthorizeURL(authorizeURL, redirectURIScheme);
    const result = await this._finishAuthorization(redirectURL);

    await this.storage.delAnonymousKeyID(this.name);
    return result;
  }

  /**
   * Fetch user info.
   */
  async fetchUserInfo(): Promise<UserInfo> {
    return this.apiClient._oidcUserInfoRequest(this.accessToken);
  }
}

/**
 * Default container.
 *
 * @remarks
 * This is a global shared container, provided for convenience.
 *
 * @public
 */
const defaultContainer: ReactNativeContainer<ReactNativeAPIClient> = new ReactNativeContainer();

export default defaultContainer;
