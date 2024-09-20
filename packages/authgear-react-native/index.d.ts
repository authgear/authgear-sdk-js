/**
 * AuthgearError is the root class of error produced by the SDK.
 *
 * @public
 */
export declare class AuthgearError extends Error {
  /**
   * underlyingError is the underlying error.
   * The type is unknown because it is possible to throw anything in JavaScript.
   * Use ordinary approaches, such as instanceof operator, to identify what it is.
   *
   * @public
   */
  underlyingError?: unknown;
}

/**
 * CancelError means cancel.
 * If you catch an error and it is instanceof CancelError,
 * then the operation was cancelled.
 *
 * @public
 */
export declare class CancelError extends AuthgearError {}

/**
 * ColorScheme represents the color scheme supported by Authgear.
 * A colorscheme is either light or dark. Authgear supports both by default.
 *
 * @public
 */
export declare enum ColorScheme {
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
 * Options for the constructor of a Container.
 *
 * @public
 */
export declare interface ContainerOptions {
  /**
   * The name of the container. The name is used as the namespace of {@link TokenStorage}.
   * One use case is to use multiple containers with different names to support signing in multiple accounts.
   * @defaultValue "default"
   */
  name?: string;
}

/**
 * ErrorName contains all possible name in {@link ServerError}
 *
 * @public
 */
export declare enum ErrorName {
  /**
   * Indicates that the server does not understand the request (i.e. syntactic error).
   * Status code: 400
   */
  BadRequest = "BadRequest",
  /**
   * Indicates that the server understands the request, but refuse to process it (i.e. semantic error).
   * Status code: 400
   */
  Invalid = "Invalid",
  /**
   * Indicates that the client does not have valid credentials (i.e. authentication error).
   * Status code: 401
   */
  Unauthorized = "Unauthorized",
  /**
   * Indicates that the client's credentials are not allowed for the request (i.e. authorization error).
   * Status code: 403
   */
  Forbidden = "Forbidden",
  /**
   * Indicates that the server cannot find the requested resource.
   * Status code: 404
   */
  NotFound = "NotFound",
  /**
   * Indicates that the resource is already exists on the server.
   * Status code: 409
   */
  AlreadyExists = "AlreadyExists",
  /**
   * Indicates that the client has sent too many requests in a given amount of time.
   * Status code: 429
   */
  TooManyRequest = "TooManyRequest",
  /**
   * Indicates that the server encountered an unexpected condition and unable to process the request.
   * Status code: 500
   */
  InternalError = "InternalError",
  /**
   * Indicates that the server is not ready to handle the request.
   * Status code: 503
   */
  ServiceUnavailable = "ServiceUnavailable",
}

/**
 * OAuthError represents the oauth error response.
 * https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 *
 * @public
 */
export declare class OAuthError extends AuthgearError {
  state?: string;
  error: string;
  error_description?: string;
  error_uri?: string;
  constructor({
    state,
    error,
    error_description,
    error_uri,
  }: {
    state?: string;
    error: string;
    error_description?: string;
    error_uri?: string;
  });
}

/**
 * The path of the page in Authgear.
 *
 * @public
 */
export declare enum Page {
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
 * PreAuthenticatedURLDeviceSecretNotFoundError occured when device secret is not found in the storage.
 *
 * @public
 */
export declare class PreAuthenticatedURLDeviceSecretNotFoundError extends PreAuthenticatedURLNotAllowedError {}

/**
 * PreAuthenticatedURLIDTokenNotFoundError occured when id token is not found in the storage.
 *
 * @public
 */
export declare class PreAuthenticatedURLIDTokenNotFoundError extends PreAuthenticatedURLNotAllowedError {}

/**
 * PreAuthenticatedURLInsufficientScopeError occured when the client does not have enough scopes for pre-authenticated URL.
 *
 * @public
 */
export declare class PreAuthenticatedURLInsufficientScopeError extends PreAuthenticatedURLNotAllowedError {}

/**
 * PreAuthenticatedURLNotAllowedError is the root class of errors related to pre-authenticated URL.
 *
 * @public
 */
export declare class PreAuthenticatedURLNotAllowedError extends AuthgearError {}

/**
 * Prompt parameter options.
 *
 * @public
 */
export declare enum PromptOption {
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
 * ServerError represents error received from the server.
 *
 * @public
 */
export declare class ServerError extends AuthgearError {
  /**
   * Error name.
   *
   * @remarks
   * See {@link ErrorName} for possible values.
   * New error names may be added in future.
   */
  name: string;
  /**
   * Error message.
   *
   * @remarks
   * Error messages are provided for convenience, and not stable APIs;
   * Consumers should use {@link ServerError.name} or
   * {@link ServerError.reason} to distinguish between different errors.
   */
  message: string;
  /**
   * Error reason.
   */
  reason: string;
  /**
   * Additional error information.
   */
  info?: unknown;
  constructor(message: string, name: string, reason: string, info?: unknown);
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
export declare enum SessionState {
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
export declare enum SessionStateChangeReason {
  NoToken = "NO_TOKEN",
  FoundToken = "FOUND_TOKEN",
  Authenticated = "AUTHENTICATED",
  Logout = "LOGOUT",
  Invalid = "INVALID",
  Clear = "CLEAR",
}

/**
 * The actions that can be performed in Authgear settings page.
 *
 * @public
 */
export declare enum SettingsAction {
  /**
   * Change password in Authgear settings page.
   */
  ChangePassword = "change_password",
  /**
   * Delete account in Authgear settings page.
   */
  DeleteAccount = "delete_account",
}

/**
 * TokenStorage is an interface controlling when refresh tokens are stored.
 * Normally you do not need to implement this interface.
 * You can use one of those implementations provided by the SDK.
 *
 * @public
 */
export declare interface TokenStorage {
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
 * TransientTokenStorage stores the refresh token in memory.
 * The refresh token is forgotten as soon as the user quits the app, or
 * the app was killed by the system.
 * When the app launches again next time, no refresh token is found.
 * The user is considered unauthenticated.
 * This implies the user needs to authenticate over again on every app launch.
 *
 * @public
 */
export declare class TransientTokenStorage implements TokenStorage {
  private keyMaker;
  private storageDriver;
  constructor();
  setRefreshToken(namespace: string, refreshToken: string): Promise<void>;
  getRefreshToken(namespace: string): Promise<string | null>;
  delRefreshToken(namespace: string): Promise<void>;
}

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
export declare interface UserInfo {
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
 * @public
 */
export declare const VERSION: string;

export {};

/**
 * Auth UI authorization options
 *
 * @public
 */
export declare interface AuthenticateOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * OIDC prompt parameter.
   *
   * Prompt parameter will be used for Authgear authorization, it will also be forwarded to the underlying SSO providers.
   *
   * For Authgear, currently, only login is supported. Other unsupported values will be ignored.
   *
   * For the underlying SSO providers, some providers only support a single value rather than a list.
   * The first supported value will be used for that case.
   * e.g. Azure Active Directory
   *
   */
  prompt?: PromptOption[] | PromptOption;
  /**
   * UI locale tags. You can use this parameter to set the display language for Auth UI.
   *
   * First, enable the language you want to change to in Authgear Portal (Your project \> UI Settings \> click on the settings icon beside Language.)
   *
   * For example, to change the language for Auth UI to Hong Kong,
   * set the value for uiLocales to ["zh-HK"] after enabling "Chinese (Hong Kong)" in Authgear Portal.
   */
  uiLocales?: string[];
  /**
   * Override the color scheme
   */
  colorScheme?: ColorScheme;
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The wechatRedirectURI will be called when user click the login with WeChat button
   */
  wechatRedirectURI?: string;
  /**
   * Initial page to open. Valid values are 'login' and 'signup'.
   */
  page?: string;
  /**
   * Auto-redirect the user to the OAuth provider. You can set the value for each OAuth provider in Authgear portal via
   * Authentication \> Social / Enterprise Login.
   *
   * For example, to auto-redirect your users to sign in with Google, first, set the alias for Sign in with Google to "google" in Authgear portal,
   * then set oauthProviderAlias to "google".
   */
  oauthProviderAlias?: string;
  /**
   * Authentication flow group
   */
  authenticationFlowGroup?: string;
}

/**
 * Result of authorization.
 *
 * @public
 */
export declare interface AuthenticateResult {
  /**
   * The updated user info after authentication.
   */
  userInfo: UserInfo;
}

/**
 * See https://developer.android.com/reference/androidx/biometric/BiometricManager.Authenticators
 *
 * @public
 */
export declare enum BiometricAccessConstraintAndroid {
  /**
   * The user can use Class 3 biometric to authenticate.
   *
   * See https://developer.android.com/reference/androidx/biometric/BiometricManager.Authenticators#BIOMETRIC_STRONG()
   *
   * @public
   */
  BiometricStrong = "BIOMETRIC_STRONG",
  /**
   * The user can either use biometric or device code to authenticate.
   *
   * See https://developer.android.com/reference/androidx/biometric/BiometricManager.Authenticators#DEVICE_CREDENTIAL()
   *
   * @public
   */
  DeviceCredential = "DEVICE_CREDENTIAL",
}

/**
 * BiometricAccessConstraintIOS configures iOS specific behavior.
 * It must be consistent with BiometricLAPolicy.
 *
 * @public
 */
export declare enum BiometricAccessConstraintIOS {
  /**
   * The user does not need to set up biometric again when a new finger or face is added or removed.
   *
   * See https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/2937191-biometryany
   *
   * @public
   */
  BiometricAny = "biometryAny",
  /**
   * The user needs to set up biometric again when a new finger or face is added or removed.
   *
   * See https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/2937192-biometrycurrentset
   *
   * @public
   */
  BiometryCurrentSet = "biometryCurrentSet",
  /**
   * The user can either use biometric or device code to authenticate.
   *
   * See https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/1392879-userpresence
   *
   * @public
   */
  UserPresence = "userPresence",
}

/**
 * BiometricLAPolicy configures iOS specific behavior.
 * It must be consistent with BiometricAccessConstraintIOS.
 *
 * @public
 */
export declare enum BiometricLAPolicy {
  /**
   * The biometric prompt only prompts for biometric. No fallback to device passcode.
   *
   * See https://developer.apple.com/documentation/localauthentication/lapolicy/deviceownerauthenticationwithbiometrics
   *
   * @public
   */
  deviceOwnerAuthenticationWithBiometrics = "deviceOwnerAuthenticationWithBiometrics",
  /**
   * The biometric prompt prompts for biometric first, and then fallback to device passcode.
   *
   * See https://developer.apple.com/documentation/localauthentication/lapolicy/deviceownerauthentication
   *
   * @public
   */
  deviceOwnerAuthentication = "deviceOwnerAuthentication",
}

/**
 * BiometricLockoutError means the biometric is locked due to too many failed attempts.
 *
 * @public
 */
export declare class BiometricLockoutError extends AuthgearError {}

/**
 * BiometricNoEnrollmentError means the user has not setup biometric.
 * You should prompt the user to do so.
 *
 * @public
 */
export declare class BiometricNoEnrollmentError extends AuthgearError {}

/**
 * BiometricNoPasscodeError means the device does not have a passcode.
 * You should prompt the user to setup a password for their device.
 *
 * @public
 */
export declare class BiometricNoPasscodeError extends AuthgearError {}

/**
 * BiometricNotSupportedOrPermissionDeniedError means this device does not support biometric,
 * or the user has denied the usage of biometric.
 *
 * @public
 */
export declare class BiometricNotSupportedOrPermissionDeniedError extends AuthgearError {}

/**
 * BiometricOptions is options for biometric authentication.
 * It allows platform-specific customization for iOS and Android.
 *
 * @public
 */
export declare interface BiometricOptions {
  ios: BiometricOptionsIOS;
  android: BiometricOptionsAndroid;
}

/**
 * Android specific options for biometric authentication.
 *
 * @public
 */
export declare interface BiometricOptionsAndroid {
  /**
   * See https://developer.android.com/reference/androidx/biometric/BiometricPrompt.PromptInfo#getTitle()
   *
   * @public
   */
  title: string;
  /**
   * See https://developer.android.com/reference/androidx/biometric/BiometricPrompt.PromptInfo#getSubtitle()
   *
   * @public
   */
  subtitle: string;
  /**
   * See https://developer.android.com/reference/androidx/biometric/BiometricPrompt.PromptInfo#getDescription()
   *
   * @public
   */
  description: string;
  /**
   * https://developer.android.com/reference/androidx/biometric/BiometricPrompt.PromptInfo#getNegativeButtonText()
   *
   * @public
   */
  negativeButtonText: string;
  /**
   * Set the contraint for the authenticator to be used for biometric authentication.
   *
   * See {@link BiometricAccessConstraintAndroid}
   *
   * @public
   */
  constraint: BiometricAccessConstraintAndroid[];
  /**
   * The user needs to set up biometric again when a new biometric is enrolled or all enrolled biometrics are removed.
   *
   * See https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec#isInvalidatedByBiometricEnrollment()
   *
   * @public
   */
  invalidatedByBiometricEnrollment: boolean;
}

/**
 * iOS specific options for biometric authentication.
 *
 * @public
 */
export declare interface BiometricOptionsIOS {
  /**
   * See https://developer.apple.com/documentation/localauthentication/lacontext/1514176-evaluatepolicy#parameters
   *
   * @public
   */
  localizedReason: string;
  /**
   * Set the contraint for the authenticator to be used for biometric authentication.
   *
   * See {@link BiometricAccessConstraintIOS}
   *
   * @public
   */
  constraint: BiometricAccessConstraintIOS;
  /**
   * Set the local authentication policy for biometric authentication.
   *
   * See {@link BiometricLAPolicy}
   *
   * @public
   */
  policy: BiometricLAPolicy;
}

/**
 * BiometricPrivateKeyNotFoundError means the biometric has changed so that
 * the private key has been invalidated.
 *
 * @public
 */
export declare class BiometricPrivateKeyNotFoundError extends AuthgearError {}

/**
 * ConfigureOptions is options for configuring the Authgear SDK container.
 *
 * @public
 */
export declare interface ConfigureOptions {
  /**
   * The OAuth client ID. You may find this value in Authgear Portal (Your project \> Applications).
   */
  clientID: string;
  /**
   * The endpoint. You may find this value in Authgear Portal (Your project \> Applications).
   */
  endpoint: string;
  /**
   * An implementation of TokenStorage.
   */
  tokenStorage?: TokenStorage;
  /**
   * Single-sign-on (SSO) is defined as login once, logged in all apps.
   * When isSSOEnabled is true, users only need to enter their authentication credentials once.
   * When the user login the second app, they will see the continue screen so that they can log in with just a click.
   * Logout from one app will also logout from all the apps.
   * @defaultValue false
   */
  isSSOEnabled?: boolean;
  /**
   * When preAuthenticatedURLEnabled is true, native apps can share session with a web browser.
   * @defaultValue false
   */
  preAuthenticatedURLEnabled?: boolean;
  /**
   * The implementation of UIImplementation.
   */
  uiImplementation?: UIImplementation;
}

/**
 * Default container.
 *
 * @remarks
 * This is a global shared container, provided for convenience.
 *
 * @public
 */
declare const defaultContainer: ReactNativeContainer;
export default defaultContainer;

/**
 * DeviceBrowserUIImplementation is the default {@link UIImplementation}.
 *
 * For iOS, it is using ASWebAuthenticationSession (see https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession).
 * For Android, it is using Custom Tabs (see https://developer.chrome.com/docs/android/custom-tabs).
 *
 * @public
 */
export declare class DeviceBrowserUIImplementation implements UIImplementation {
  openAuthorizationURL(options: OpenAuthorizationURLOptions): Promise<string>;
}

/**
 * OpenAuthorizationURLOptions is options for {@link UIImplementation.openAuthorizationURL}.
 *
 * @public
 */
export declare interface OpenAuthorizationURLOptions {
  /**
   * The target authorization URL.
   */
  url: string;
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * A flag to some implementations that can share cookies with the device browser.
   * When it is set to true, cookies will be shared with the device browser.
   */
  shareCookiesWithDeviceBrowser: boolean;
}

/**
 * PersistentTokenStorage stores the refresh token in a persistent storage.
 * When the app launches again next time, the refresh token is loaded from the persistent storage.
 * The user is considered authenticated as long as the refresh token is found.
 * However, the validity of the refresh token is not guaranteed.
 * You must call fetchUserInfo to ensure the refresh token is still valid.
 *
 * @public
 */
export declare class PersistentTokenStorage implements TokenStorage {
  private keyMaker;
  private storageDriver;
  constructor();
  setRefreshToken(namespace: string, refreshToken: string): Promise<void>;
  getRefreshToken(namespace: string): Promise<string | null>;
  delRefreshToken(namespace: string): Promise<void>;
}

/**
 * PreAuthenticatedURLOptions is options for pre-authenticated-url.
 *
 * @public
 */
export declare interface PreAuthenticatedURLOptions {
  /**
   * The client ID of the web application.
   */
  webApplicationClientID: string;
  /**
   * The URI the browser should go to after successfully obtained a authenticated session.
   */
  webApplicationURI: string;
  /**
   * Any string that will be passed to webApplicationURI by the `state` query parameter.
   */
  state?: string;
}

/**
 * Auth UI anonymous user promotion options
 *
 * @public
 */
export declare interface PromoteOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * UI locale tags. You can use this parameter to set the display language for Auth UI.
   *
   * First, enable the language you want to change to in Authgear Portal (Your project \> UI Settings \> click on the settings icon beside Language.)
   *
   * For example, to change the language for Auth UI to Hong Kong,
   * set the value for uiLocales to ["zh-HK"] after enabling "Chinese (Hong Kong)" in Authgear Portal.
   */
  uiLocales?: string[];
  /**
   * Override the color scheme
   */
  colorScheme?: ColorScheme;
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The wechatRedirectURI will be called when user click the login with WeChat button
   */
  wechatRedirectURI?: string;
}

/**
 * ReactNativeContainer is the entrypoint of the SDK.
 * An instance of a container allows the user to authenticate, reauthenticate, etc.
 *
 * Every container has a name.
 * The default name of a container is `default`.
 * If your app supports multi login sessions, you can use multiple containers with different names.
 * You are responsible for managing the list of names in this case.
 *
 * @public
 */
export declare class ReactNativeContainer {
  private dpopProvider;
  /**
   * Delegation for customizing the behavior of your application.
   * You can implement your own delegation and the container will evaluate them if needed.
   *
   * @public
   */
  delegate?: ReactNativeContainerDelegate;
  /**
   * The name of the container. The name is used as the namespace of {@link TokenStorage}.
   * One use case is to use multiple containers with different names to support signing in multiple accounts.
   * @defaultValue "default"
   *
   * @public
   */
  get name(): string;
  set name(name: string);
  /**
   * OIDC client ID
   *
   * @public
   */
  get clientID(): string | undefined;
  set clientID(clientID: string | undefined);
  /**
   * Is SSO enabled
   *
   * @public
   */
  get isSSOEnabled(): boolean;
  set isSSOEnabled(isSSOEnabled: boolean);
  /**
   * Is Pre Authenticated URL enabled
   *
   * @public
   */
  get preAuthenticatedURLEnabled(): boolean;
  set preAuthenticatedURLEnabled(preAuthenticatedURLEnabled: boolean);
  /**
   * The current SessionState of this container.
   *
   * @public
   */
  get sessionState(): SessionState;
  set sessionState(sessionState: SessionState);
  /**
   * The access token of this container.
   *
   * @public
   */
  get accessToken(): string | undefined;
  set accessToken(accessToken: string | undefined);
  constructor(options?: ContainerOptions);
  /**
   * getIDTokenHint() returns the ID token for the OIDC id_token_hint parameter.
   *
   * @public
   */
  getIDTokenHint(): string | undefined;
  /**
   * canReauthenticate() reports whether the current user can reauthenticate.
   * The information comes from the ID token and the ID token is NOT verified.
   *
   * @public
   */
  canReauthenticate(): boolean;
  /**
   * getAuthTime() reports the last time the user was authenticated.
   * The information comes from the ID token and the ID token is NOT verified.
   *
   * @public
   */
  getAuthTime(): Date | undefined;
  /**
   * refreshIDToken() asks the server to issue an ID token with latest claims.
   * After refreshing, getIDTokenHint() and canReauthenticate() may return up-to-date value.
   *
   * @public
   */
  refreshIDToken(): Promise<void>;
  /**
   * configure() configures the container with the client ID and the endpoint.
   * It also does local IO to retrieve the refresh token.
   * It only obtains the refresh token locally and no network call will
   * be triggered. So the session state maybe outdated for some reason, e.g.
   * user session is revoked. fetchUserInfo should be called to obtain the
   * latest user session state.
   *
   * configure() can be called more than once if it failed.
   * Otherwise, it is NOT recommended to call it more than once.
   *
   * @public
   */
  configure(options: ConfigureOptions): Promise<void>;
  /**
   * authenticate() starts the authentication process in a {@link UIImplementation}.
   * After authentication, the {@link UIImplementation} will be closed and the user is logged in.
   *
   * You can refer to {@link AuthenticateOptions} for more customization.
   *
   * @public
   */
  authenticate(options: AuthenticateOptions): Promise<AuthenticateResult>;
  /**
   * changePassword() opens the settings page in a {@link UIImplementation} for the user to change their password.
   * After changing the password, the {@link UIImplementation} will be closed.
   *
   * You can refer to {@link SettingsActionOptions} for more customization.
   *
   * @public
   */
  changePassword(options: SettingsActionOptions): Promise<void>;
  /**
   * deleteAccount() opens the settings page in a {@link UIImplementation} for the user to delete their account.
   * After deletion, the {@link UIImplementation} will be closed and the user is logged out.
   *
   * You can refer to {@link SettingsActionOptions} for more customization.
   *
   * @public
   */
  deleteAccount(options: SettingsActionOptions): Promise<void>;
  /**
   * reauthenticate() starts the reauthentication process via biometric or in the {@link UIImplementation}.
   *
   * If biometricOptions is given, biometric is used when possible.
   *
   * You can refer to {@link ReauthenticateOptions} and {@link BiometricOptions} for more customization.
   *
   * @public
   */
  reauthenticate(
    options: ReauthenticateOptions,
    biometricOptions?: BiometricOptions
  ): Promise<ReauthenticateResult>;
  /**
   * Open Authgear pages. Currently only settings pages are available.
   *
   * You can refer to {@link SettingOptions} for more customization.
   *
   * @public
   */
  open(page: Page, options?: SettingOptions): Promise<void>;
  /**
   * logout() signs out the user without showing any UI. The refresh token will be cleared.
   * The biometric authentication is kept, so the user can authenticateBiometric again.
   *
   * @remarks
   * If `force` parameter is set to `true`, all potential errors (e.g. network
   * error) would be ignored.
   *
   * @param options - Logout options
   *
   * @public
   */
  logout(options?: { force?: boolean }): Promise<void>;
  /**
   * authenticateAnonymously() starts the authentication process as an anonymous user.
   * You may first enable Anonymous Users in Authgear Portal (Your project \> Authentication \> Anonymous Users \> Enable anonymous users).
   *
   * @public
   */
  authenticateAnonymously(): Promise<AuthenticateResult>;
  /**
   * promoteAnonymousUser() opens the anonymous user promotion page in the {@link UIImplementation} and the user has to authenticate.
   * The flow is similar to authenticate(), the {@link UIImplementation} will be closed and the user is logged in after authentication.
   * After promotion from anonymous user, biometric authentication will be disabled for the new user
   * and the may need to enable it manually again.
   *
   * You can refer to {@link PromoteOptions} for more customization.
   *
   * @public
   */
  promoteAnonymousUser(options: PromoteOptions): Promise<AuthenticateResult>;
  /**
   * fetchUserInfo() fetches the up-to-date user info from Authgear.
   *
   * @public
   */
  fetchUserInfo(): Promise<UserInfo>;
  /**
   * refreshAccessTokenIfNeeded() refreshes the access token if needed.
   * After the task has completed, the updated access token will be stored in this.accessToken.
   *
   * @public
   */
  refreshAccessTokenIfNeeded(): Promise<void>;
  /**
   * Fetch function for you to call your application server.
   * The fetch function will include Authorization header in your application
   * request, and handle refresh access token automatically.
   *
   * @public
   */
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  /**
   * WeChat auth callback function. In WeChat login flow, after returning from the WeChat SDK,
   * this function should be called to complete the authorization.
   *
   * @param code - WeChat Authorization code.
   * @param state - WeChat Authorization state.
   *
   * @public
   */
  wechatAuthCallback(code: string, state: string): Promise<void>;
  /**
   * Check whether biometric is supported on the current device.
   * If biometric is not supported, then a platform specific error is thrown.
   *
   * @public
   */
  checkBiometricSupported(options: BiometricOptions): Promise<void>;
  /**
   * Check whether biometric was enabled for the last logged in user.
   *
   * @public
   */
  isBiometricEnabled(): Promise<boolean>;
  /**
   * Disable biometric authentication for the last logged in user.
   * After disabling, the user may not be able to authenticate with biometric until it is enabled again.
   *
   * @public
   */
  disableBiometric(): Promise<void>;
  /**
   * Enable biometric authentication for the last logged in user.
   * Platform specific biometric authenticator will be prompted and it is enabled only if the verification is successful.
   * You may first enable biometric authentication in Authgear Portal (Your Project \> Authentication \> Biometric \> Enable biometric authentication).
   *
   * You can refer to {@link BiometricOptions} for more customization.
   *
   * @public
   */
  enableBiometric(options: BiometricOptions): Promise<void>;
  /**
   * Authenticate with biometric authenticator.
   * Platform specific biometric authenticator will be prompted and user will be logged in after successful verification.
   * You may first enable biometric authentication in Authgear Portal (Your Project \> Authentication \> Biometric \> Enable biometric authentication).
   *
   * You can refer to {@link BiometricOptions} for more customization.
   *
   * @public
   */
  authenticateBiometric(options: BiometricOptions): Promise<AuthenticateResult>;
  /**
   * Share the current authenticated session to a web browser.
   *
   * `{@link ConfigureOptions.preAuthenticatedURLEnabled}` must be set to true to use this method.
   *
   * You can refer to {@link PreAuthenticatedURLOptions} for more customization.
   *
   * @public
   */
  makePreAuthenticatedURL(options: PreAuthenticatedURLOptions): Promise<string>;
}

/**
 * ReactNativeContainerDelegate defines a set of functions that the SDK container will use.
 *
 * You can implement these functions to customize the behavior of your application.
 *
 * @public
 */
export declare interface ReactNativeContainerDelegate {
  /**
   * This callback will be called when the session state is changed.
   *
   * For example, when the user logs out, the new state is "NO_SESSION"
   * and the reason is "LOGOUT".
   *
   * @public
   */
  onSessionStateChange: (
    container: ReactNativeContainer,
    reason: SessionStateChangeReason
  ) => void;
  /**
   * This callback will be called when user click login with WeChat in
   * react-native.
   *
   * Developer should implement this function to use WeChat SDK to
   * obtain WeChat authentication code. After obtaining the code, developer
   * should call wechatAuthCallback with code and state to complete the
   * WeChat login.
   *
   * @public
   */
  sendWechatAuthRequest(state: string): void;
}

/**
 * Options for reauthentication
 * @public
 */
export declare interface ReauthenticateOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * UI locale tags. You can use this parameter to set the display language for Auth UI.
   *
   * First, enable the language you want to change to in Authgear Portal (Your project \> UI Settings \> click on the settings icon beside Language.)
   *
   * For example, to change the language for Auth UI to Hong Kong,
   * set the value for uiLocales to ["zh-HK"] after enabling "Chinese (Hong Kong)" in Authgear Portal.
   */
  uiLocales?: string[];
  /**
   * Override the color scheme
   */
  colorScheme?: ColorScheme;
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The wechatRedirectURI will be called when user click the login with WeChat button
   */
  wechatRedirectURI?: string;
  /**
   * OIDC max_age
   */
  maxAge?: number;
  /**
   * Authentication flow group
   */
  authenticationFlowGroup?: string;
}

/**
 * Result of reauthentication
 *
 * @public
 */
export declare interface ReauthenticateResult {
  /**
   * The updated user info after reauthentication.
   */
  userInfo: UserInfo;
}

/**
 * Options that used by {@link ReactNativeContainer.open}.
 * It allows you to configure the UI of the opened settings page.
 *
 * @public
 */
export declare interface SettingOptions {
  /**
   * UI locale tags. You can use this parameter to set the display language for Auth UI.
   *
   * First, enable the language you want to change to in Authgear Portal (Your project \> UI Settings \> click on the settings icon beside Language.)
   *
   * For example, to change the language for Auth UI to Hong Kong,
   * set the value for uiLocales to ["zh-HK"] after enabling "Chinese (Hong Kong)" in Authgear Portal.
   */
  uiLocales?: string[];
  /**
   * Override the color scheme
   */
  colorScheme?: ColorScheme;
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The wechatRedirectURI will be called when user click the login with WeChat button
   */
  wechatRedirectURI?: string;
}

/**
 * It is similar to {@link SettingOptions}, but it is used for configuring
 * the UI of the opened settings page for specific action like {@link SettingsAction.ChangePassword}.
 *
 * @public
 */
export declare interface SettingsActionOptions {
  /**
   * UI locale tags. You can use this parameter to set the display language for Auth UI.
   *
   * First, enable the language you want to change to in Authgear Portal (Your project \> UI Settings \> click on the settings icon beside Language.)
   *
   * For example, to change the language for Auth UI to Hong Kong,
   * set the value for uiLocales to ["zh-HK"] after enabling "Chinese (Hong Kong)" in Authgear Portal.
   */
  uiLocales?: string[];
  /**
   * Override the color scheme
   */
  colorScheme?: ColorScheme;
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The wechatRedirectURI will be called when user click the login with WeChat button
   */
  wechatRedirectURI?: string;
  /**
   * Redirect URI after the settings action is completed.
   */
  redirectURI: string;
}

/**
 * UIImplementation can open an URL and close itself when a redirect URI is detected.
 *
 * @public
 */
export declare interface UIImplementation {
  /**
   * openAuthorizationURL must open options.url. When redirectURI is detected,
   * the implementation must close itself and return the redirectURI with query.
   * If the end-user closes it, then openAuthorizationURL must reject the promise with
   * CancelError.
   *
   * @public
   */
  openAuthorizationURL(options: OpenAuthorizationURLOptions): Promise<string>;
}

/**
 * WebKitWebViewUIImplementation provides more customization options other than {@link DeviceBrowserUIImplementation}.
 *
 * For iOS, it is using WKWebView (see https://developer.apple.com/documentation/webkit/wkwebview).
 * For Android, it is using android.webkit.WebView (see https://developer.android.com/reference/android/webkit/WebView).
 *
 * @public
 */
export declare class WebKitWebViewUIImplementation implements UIImplementation {
  private options?;
  constructor(options?: WebKitWebViewUIImplementationOptions);
  openAuthorizationURL(options: OpenAuthorizationURLOptions): Promise<string>;
}

/**
 * WebKitWebViewUIImplementationOptions specifies options for configuring the user interface of a WebKit WebView.
 * It allows platform-specific customization for iOS and Android.
 *
 * @public
 */
export declare interface WebKitWebViewUIImplementationOptions {
  ios?: WebKitWebViewUIImplementationOptionsIOS;
  android?: WebKitWebViewUIImplementationOptionsAndroid;
}

/**
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding.
 *
 * @public
 */
export declare interface WebKitWebViewUIImplementationOptionsAndroid {
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  actionBarBackgroundColor?: number;
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  actionBarButtonTintColor?: number;
}

/**
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding.
 * Yes, it is still from Android such that the color encoding method in iOS is the same that used in Android.
 *
 * @public
 */
export declare interface WebKitWebViewUIImplementationOptionsIOS {
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  navigationBarBackgroundColor?: number;
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  navigationBarButtonTintColor?: number;
  /**
   * Styles for the modal.
   * See https://developer.apple.com/documentation/uikit/uimodalpresentationstyle.
   */
  modalPresentationStyle?: "automatic" | "fullScreen" | "pageSheet";
  /**
   * Indicates whether you can inspect the view with Safari Web Inspector.
   * See https://developer.apple.com/documentation/webkit/wkwebview/4111163-isinspectable.
   */
  isInspectable?: boolean;
}

export {};
