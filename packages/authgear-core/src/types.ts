import { BaseContainer } from "./container";
import { BaseAPIClient } from "./client";

/**
 * @internal
 */
export interface _ByteArray {
  [index: number]: number;
  length: number;
}

/**
 * @public
 */
export interface UserInfo {
  sub: string;
  isVerified: boolean;
  isAnonymous: boolean;
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
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The weChatRedirectURI will be called when user click the login with WeChat button
   */
  weChatRedirectURI?: string;
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
  /**
   * OAuth response type
   */
  responseType?: string;
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The weChatRedirectURI will be called when user click the login with WeChat button
   */
  weChatRedirectURI?: string;
  /**
   * @internal
   * Platform is provided by the sdk
   */
  platform?: string;
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
export function decodeUserInfo(r: any): UserInfo {
  return {
    sub: r["sub"],
    isVerified: r["https://authgear.com/claims/user/is_verified"] ?? false,
    isAnonymous: r["https://authgear.com/claims/user/is_anonymous"] ?? false,
  };
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
export interface AppSessionTokenResponse {
  app_session_token: string;
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
    | "urn:authgear:params:oauth:grant-type:anonymous-request";
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
  | "INVALID";

/**
 * @public
 */
export interface ContainerDelegate {
  /**
   * This callback will be called when the session state is changed.
   *
   * For example, when the user logs out, the new state is "NO_SESSION"
   * and the reason is "LOGOUT".
   *
   * @public
   */
  onSessionStateChange: <T extends BaseAPIClient>(
    container: BaseContainer<T>,
    reason: SessionStateChangeReason
  ) => void;

  /**
   * This callback will be called when user click login with WeChat in
   * react-native.
   *
   * Developer should implement this function to use WeChat SDK to
   * obtain WeChat authentication code. After obtaining the code, developer
   * should call weChatAuthCallback with code and state to complete the
   * WeChat login.
   *
   * @public
   */
  sendWeChatAuthRequest(state: string): void;
}
