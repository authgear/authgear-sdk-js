/**
 * UserInfo is the result of fetchUserInfo.
 * It contains `sub` which is the User ID,
 * as well OIDC standard claims like `email`.
 *
 * @public
 */
export interface UserInfo {
  sub: string;
  isVerified: boolean;
  isAnonymous: boolean;
  canReauthenticate: boolean;
  roles?: string[];

  raw: Record<string, unknown>;
  customAttributes: Record<string, unknown>;

  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  preferredUsername?: string;
  familyName?: string;
  givenName?: string;
  middleName?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  profile?: string;
  website?: string;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  address?: {
    formatted?: string;
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * ColorScheme represents the color scheme supported by Authgear.
 * A colorscheme is either light or dark. Authgear supports both by default.
 *
 * @public
 */
export enum ColorScheme {
  Light = "light",
  Dark = "dark",
}

/**
 * Prompt parameter options.
 *
 * @public
 */
export enum PromptOption {
  None = "none",
  Login = "login",
  Consent = "consent",
  SelectAccount = "select_account",
}

/**
 * @internal
 */
export interface _OIDCAuthenticationRequest {
  redirectURI: string;
  responseType:
    | "code"
    | "none"
    | "urn:authgear:params:oauth:response-type:settings-action"
    | "urn:authgear:params:oauth:response-type:pre-authenticated-url token";
  responseMode?: "cookie" | "query";
  scope?: string[];
  state?: string;
  xState?: string;
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
  oauthProviderAlias?: string;
  xSettingsAction?: "change_password" | "delete_account";
  authenticationFlowGroup?: string;
  clientID?: string;
  xPreAuthenticatedURLToken?: string;
  dpopJKT?: string;
}

/**
 * @internal
 */
export interface _AuthenticateResult {
  state?: string;
  userInfo: UserInfo;
}

/**
 * @internal
 */
export interface _ReauthenticateResult {
  state?: string;
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
  const raw = r;
  const customAttributes = r["custom_attributes"] ?? {};

  return {
    sub: r["sub"],
    isVerified: r["https://authgear.com/claims/user/is_verified"] ?? false,
    isAnonymous: r["https://authgear.com/claims/user/is_anonymous"] ?? false,
    canReauthenticate:
      r["https://authgear.com/claims/user/can_reauthenticate"] ?? false,
    roles: r["https://authgear.com/claims/user/roles"],

    raw,
    customAttributes,

    email: r["email"],
    emailVerified: r["email_verified"],
    phoneNumber: r["phone_number"],
    phoneNumberVerified: r["phone_number_verified"],
    preferredUsername: r["preferred_username"],
    familyName: r["family_name"],
    givenName: r["given_name"],
    middleName: r["middle_name"],
    name: r["name"],
    nickname: r["nickname"],
    picture: r["picture"],
    profile: r["profile"],
    website: r["website"],
    gender: r["gender"],
    birthdate: r["birthdate"],
    zoneinfo: r["zoneinfo"],
    locale: r["locale"],
    address: {
      formatted: r["address"]?.["formatted"],
      streetAddress: r["address"]?.["street_address"],
      locality: r["address"]?.["locality"],
      region: r["address"]?.["region"],
      postalCode: r["address"]?.["postal_code"],
      country: r["address"]?.["country"],
    },
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
 * TokenStorage is an interface controlling when refresh tokens are stored.
 * Normally you do not need to implement this interface.
 * You can use one of those implementations provided by the SDK.
 *
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
export interface InterAppSharedStorage {
  setIDToken(namespace: string, idToken: string): Promise<void>;
  getIDToken(namespace: string): Promise<string | null>;
  delIDToken(namespace: string): Promise<void>;

  setDeviceSecret(namespace: string, deviceSecret: string): Promise<void>;
  getDeviceSecret(namespace: string): Promise<string | null>;
  delDeviceSecret(namespace: string): Promise<void>;

  setDPoPKeyID(namespace: string, kid: string): Promise<void>;
  getDPoPKeyID(namespace: string): Promise<string | null>;
  delDPoPKeyID(namespace: string): Promise<void>;

  onLogout(namespace: string): Promise<void>;
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
 * Options for the constructor of a Container.
 *
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
    | "urn:authgear:params:oauth:grant-type:id-token"
    | "urn:authgear:params:oauth:grant-type:settings-action"
    | "urn:ietf:params:oauth:grant-type:token-exchange";
  client_id: string;
  redirect_uri?: string;
  code?: string;
  code_verifier?: string;
  refresh_token?: string;
  jwt?: string;
  x_device_info?: string;
  access_token?: string;
  scope?: string[];
  requested_token_type?: "urn:authgear:params:oauth:token-type:pre-authenticated-url-token";
  subject_token_type?: "urn:ietf:params:oauth:token-type:id_token";
  subject_token?: string;
  actor_token_type?: "urn:x-oath:params:oauth:token-type:device-secret";
  actor_token?: string;
  audience?: string;
  device_secret?: string;
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
  device_secret?: string;
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
export enum SessionState {
  Unknown = "UNKNOWN",
  NoSession = "NO_SESSION",
  Authenticated = "AUTHENTICATED",
}

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
export enum SessionStateChangeReason {
  NoToken = "NO_TOKEN",
  FoundToken = "FOUND_TOKEN",
  Authenticated = "AUTHENTICATED",
  Logout = "LOGOUT",
  Invalid = "INVALID",
  Clear = "CLEAR",
}

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
export enum SettingsAction {
  ChangePassword = "change_password",
  DeleteAccount = "delete_account",
}

/**
 * @internal
 */
export interface _PreAuthenticatedURLOptions {
  webApplicationClientID: string;
  webApplicationURI: string;
  state?: string;
}
