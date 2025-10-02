/**
 * UserInfo is the result of fetchUserInfo.
 * It contains `sub` which is the User ID,
 * as well as OIDC standard claims like `email`,
 * see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims.
 *
 * In addition to these standard claims, it may include custom claims
 * defined by Authgear to support additional functionality like `isVerified`.
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
  /**
   * Force to use the light color scheme in the AuthUI when the project config is "Auto".
   */
  Light = "light",
  /**
   * Force to use the dark color scheme in the AuthUI when the project config is "Auto".
   */
  Dark = "dark",
}

/**
 * Prompt parameter options.
 *
 * @public
 */
export enum PromptOption {
  /**
   * The `none` prompt is used to sliently authenticate the user without prompting for any action.
   * This prompt bypasses the need for `login` and `consent` prompts
   * only when the user has previously given consent to the application and has an active session.
   */
  None = "none",
  /**
   * The `login` prompt requires the user to log in to the authentication provider which forces the user to re-authenticate.
   */
  Login = "login",
  /**
   * The `consent` prompt asks the user to consent to the scopes.
   *
   * @internal
   */
  Consent = "consent",
  /**
   * The select_account prompt present a "Continue" screen to for the user to choose
   * to continue with the session in the cookies or login to another account.
   *
   * @internal
   */
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
  xSettingsAction?:
    | "change_password"
    | "delete_account"
    | "add_email"
    | "add_phone"
    | "add_username"
    | "change_email"
    | "change_phone"
    | "change_username";
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
   * Called by the API client to refresh the access token.
   */
  refreshAccessTokenIfNeeded(): Promise<void>;
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
  /**
   * Stores a refresh token for a give namespace to the storage.
   */
  setRefreshToken(namespace: string, refreshToken: string): Promise<void>;
  /**
   * Retrieves the refresh token associated with a specific namespace in the storage.
   */
  getRefreshToken(namespace: string): Promise<string | null>;
  /**
   * Deletes the refresh token for the specified namespace in the storage.
   */
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
  /**
   * The name of the container. The name is used as the namespace of `TokenStorage`.
   * One use case is to use multiple containers with different names to support signing in multiple accounts.
   * @defaultValue "default"
   */
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
 * Please refer to {@link SessionStateChangeReason} for more information.
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
 *                                                      LOGOUT / INVALID / CLEAR
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
 * The path of the page in Authgear.
 *
 * @public
 */
export enum Page {
  /**
   * The path of the settings page in Authgear.
   */
  Settings = "/settings",
  /**
   * The path of the indenties page in Authgear.
   */
  Identities = "/settings/identities",
}

/**
 * The actions that can be performed in Authgear settings page.
 *
 * @public
 */
export enum SettingsAction {
  /**
   * Change password in Authgear settings page.
   */
  ChangePassword = "change_password",
  /**
   * Delete account in Authgear settings page.
   */
  DeleteAccount = "delete_account",
  /**
   * Add email in Authgear settings page.
   */
  AddEmail = "add_email",
  /**
   * Add phone in Authgear settings page.
   */
  AddPhone = "add_phone",
  /**
   * Add username in Authgear settings page.
   */
  AddUsername = "add_username",
  /**
   * Change email in Authgear settings page.
   */
  ChangeEmail = "change_email",
  /**
   * Change phone in Authgear settings page.
   */
  ChangePhone = "change_phone",
  /**
   * Change username in Authgear settings page.
   */
  ChangeUsername = "change_username",
}

/**
 * @internal
 */
export interface _PreAuthenticatedURLOptions {
  webApplicationClientID: string;
  webApplicationURI: string;
  state?: string;
}
