/**
 * @internal
 */
export interface _ByteArray {
  [index: number]: number;
  length: number;
}

/**
 * Auth UI anonymous user promotion options
 *
 * @public
 */
export interface PromoteOptions {
  /**
   * Redirect uri. Redirection URI to which the response will be sent after authorization.
   */
  redirectURI: string;
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * UI locale tags
   */
  uiLocales?: string[];
}

/**
 * Auth UI authorization options
 *
 * @public
 */
export interface AuthorizeOptions {
  /**
   * Redirect uri. Redirection URI to which the response will be sent after authorization.
   */
  redirectURI: string;
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * OIDC prompt parameter.
   */
  prompt?: string;
  /**
   * OIDC login hint parameter
   */
  loginHint?: string;
  /**
   * UI locale tags
   */
  uiLocales?: string[];
}

/**
 * @internal
 */
export interface _APIClientDelegate {
  /**
   * Called by the API client to retrieve the access token to construct HTTP request.
   *
   * @internal
   */
  getAccessToken(): string | undefined;

  /**
   * Called by the API Client before sending HTTP request.
   * If true is returned, refreshAccessToken() is then called.
   *
   * @internal
   */
  shouldRefreshAccessToken(): boolean;

  /**
   * Called by the API client to refresh the access token.
   *
   * @internal
   */
  refreshAccessToken(): Promise<void>;
}

/**
 * @public
 */
export interface ContainerDelegate {
  /**
   * Called when the server rejects the refresh token.
   * When this function is called, the session is not cleared yet.
   *
   * @public
   */
  onRefreshTokenExpired(): Promise<void>;
}

/**
 * @public
 */
export interface UserInfo {
  sub: string;
}

/**
 * @public
 */
export interface ChallengeResponse {
  token: string;
  expire_at: string;
}

/**
 * @public
 */
export interface ContainerStorage {
  setRefreshToken(namespace: string, refreshToken: string): Promise<void>;
  setOIDCCodeVerifier(namespace: string, code: string): Promise<void>;
  setAnonymousKeyID(namespace: string, kid: string): Promise<void>;

  getRefreshToken(namespace: string): Promise<string | null>;
  getOIDCCodeVerifier(namespace: string): Promise<string | null>;
  getAnonymousKeyID(namespace: string): Promise<string | null>;

  delRefreshToken(namespace: string): Promise<void>;
  delOIDCCodeVerifier(namespace: string): Promise<void>;
  delAnonymousKeyID(namespace: string): Promise<void>;
}

/**
 * @public
 */
export interface StorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * @public
 */
export interface ContainerOptions<T> {
  name?: string;
  apiClient?: T;
  storage?: ContainerStorage;
}

/**
 * OAuthError represents the oauth error response.
 * https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 *
 * @public
 */
export interface OAuthError {
  state?: string;
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * @internal
 */
export interface _OIDCConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  revocation_endpoint: string;
  end_session_endpoint: string;
}

/**
 * @internal
 */
export interface _OIDCTokenRequest {
  grant_type:
    | "authorization_code"
    | "refresh_token"
    | "urn:skygear-auth:params:oauth:grant-type:anonymous-request";
  client_id: string;
  redirect_uri?: string;
  code?: string;
  code_verifier?: string;
  refresh_token?: string;
  jwt?: string;
}

/**
 * @internal
 */
export interface _OIDCTokenResponse {
  id_token: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}
