/**
 * @public
 */
export interface UserInfo {
  sub: string;
  isVerified: boolean;
  isAnonymous: boolean;
}

/**
 * @public
 */
export type ColorScheme = "light" | "dark";

/**
 * Prompt parameter options.
 *
 * @public
 */
export type PromptOption = "none" | "login" | "consent" | "select_account";

/**
 * @internal
 */
export interface _OIDCAuthenticationRequest {
  redirectURI: string;
  responseType: "code" | "none";
  scope: string[];
  state?: string;
  prompt?: PromptOption[] | PromptOption;
  maxAge?: number;
  loginHint?: string;
  uiLocales?: string[];
  colorScheme?: ColorScheme;
  idTokenHint?: string;
  wechatRedirectURI?: string;
  platform?: string;
  page?: string;
  suppressIDPSessionCookie?: boolean;
}

/**
 * Result of authorization.
 *
 * @public
 */
export interface AuthorizeResult {
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * UserInfo.
   */
  userInfo: UserInfo;
}

/**
 * Result of reauthentication
 *
 * @public
 */
export interface ReauthenticateResult {
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * UserInfo.
   */
  userInfo: UserInfo;
}

/**
 * @internal
 */
export interface _APIClientDelegate {
  /**
   * Called by the API client to retrieve the access token to construct HTTP request.
   */
  getAccessToken(): string | undefined;

  /**
   * Called by the API Client before sending HTTP request.
   * If true is returned, refreshAccessToken() is then called.
   */
  shouldRefreshAccessToken(): boolean;

  /**
   * Called by the API client to refresh the access token.
   */
  refreshAccessToken(): Promise<void>;
}

/**
 * @internal
 */
export function _decodeUserInfo(r: any): UserInfo {
  return {
    sub: r["sub"],
    isVerified: r["https://authgear.com/claims/user/is_verified"] ?? false,
    isAnonymous: r["https://authgear.com/claims/user/is_anonymous"] ?? false,
  };
}

/**
 * @internal
 */
export interface _ChallengeResponse {
  token: string;
  expire_at: string;
}

/**
 * @internal
 */
export interface _AppSessionTokenResponse {
  app_session_token: string;
  expire_at: string;
}

/**
 * @internal
 */
export interface _AnonymousUserPromotionCodeResponse {
  promotion_code: string;
  expire_at: string;
}

/**
 * @public
 */
export interface TokenStorage {
  setRefreshToken(namespace: string, refreshToken: string): Promise<void>;
  getRefreshToken(namespace: string): Promise<string | null>;
  delRefreshToken(namespace: string): Promise<void>;
}

/**
 * @internal
 */
export interface _ContainerStorage {
  setOIDCCodeVerifier(namespace: string, code: string): Promise<void>;
  setAnonymousKeyID(namespace: string, kid: string): Promise<void>;
  setBiometricKeyID(namespace: string, kid: string): Promise<void>;

  getOIDCCodeVerifier(namespace: string): Promise<string | null>;
  getAnonymousKeyID(namespace: string): Promise<string | null>;
  getBiometricKeyID(namespace: string): Promise<string | null>;

  delOIDCCodeVerifier(namespace: string): Promise<void>;
  delAnonymousKeyID(namespace: string): Promise<void>;
  delBiometricKeyID(namespace: string): Promise<void>;
}

/**
 * @internal
 */
export interface _StorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * @public
 */
export interface ContainerOptions {
  name?: string;
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
    | "urn:authgear:params:oauth:grant-type:anonymous-request"
    | "urn:authgear:params:oauth:grant-type:biometric-request"
    | "urn:authgear:params:oauth:grant-type:id-token";
  client_id: string;
  redirect_uri?: string;
  code?: string;
  code_verifier?: string;
  refresh_token?: string;
  jwt?: string;
  x_device_info?: string;
  access_token?: string;
}

/**
 * @internal
 */
export interface _SetupBiometricRequest {
  access_token: string;
  client_id: string;
  jwt: string;
}

/**
 * @internal
 */
export interface _OIDCTokenResponse {
  id_token?: string;
  token_type?: string;
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
}

/**
 * The session state.
 *
 * An freshly constructed instance has the session state "UNKNOWN";
 *
 * After a call to configure, the session state would become "AUTHENTICATED" if a previous session was found,
 * or "NO_SESSION" if such session was not found.
 *
 * @public
 */
export type SessionState = "UNKNOWN" | "NO_SESSION" | "AUTHENTICATED";

/**
 * The reason why SessionState is changed.
 *
 * These reasons can be thought of as the transition of a SessionState, which is described as follows:
 *
 * ```
 *                                                          LOGOUT / INVALID
 *                                           +----------------------------------------------+
 *                                           v                                              |
 *    State: UNKNOWN ----- NO_TOKEN ----> State: NO_SESSION ---- AUTHENTICATED -----> State: AUTHENTICATED
 *      |                                                                                ^
 *      +--------------------------------------------------------------------------------+
 *                                         FOUND_TOKEN
 * ```
 * @public
 */
export type SessionStateChangeReason =
  | "NO_TOKEN"
  | "FOUND_TOKEN"
  | "AUTHENTICATED"
  | "LOGOUT"
  | "INVALID"
  | "CLEAR";
