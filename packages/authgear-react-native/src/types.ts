import {
  SessionStateChangeReason,
  PromptOption,
  ColorScheme,
  UserInfo,
} from "@authgear/core";
import { ReactNativeContainer } from ".";

/**
 * @public
 */
export interface ReactNativeContainerDelegate {
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
 * Auth UI authorization options
 *
 * @public
 */
export interface AuthenticateOptions {
  /**
   * Redirect uri. Redirection URI to which the response will be sent after authorization.
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
   * OIDC login hint parameter
   */
  loginHint?: string;

  /**
   * UI locale tags
   */
  uiLocales?: string[];

  /**
   * Override the color scheme
   */
  colorScheme?: ColorScheme;

  /**
   * OAuth response type
   */
  responseType?: "code" | "none";
  /**
   * WeChat Redirect URI is needed when integrating WeChat login in react-native
   * The wechatRedirectURI will be called when user click the login with WeChat button
   */
  wechatRedirectURI?: string;
  /**
   * @internal
   * Platform is provided by the sdk
   */
  platform?: string;
  /**
   * Initial page to open. Valid values are 'login' and 'signup'.
   */
  page?: string;
  /**
   * Auto redirect the user to the oauth provider
   */
  oauthProviderAlias?: string;
}

/**
 * Options for reauthentication
 * @public
 */
export interface ReauthenticateOptions {
  /**
   * Redirect uri. Redirection URI to which the response will be sent after authorization.
   */
  redirectURI: string;
  /**
   * UI locale tags
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
   * @internal
   * Platform is provided by the sdk
   */
  platform?: string;
  /**
   * OIDC max_age
   */
  maxAge?: number;
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
   * UI locale tags
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
 * Result of authorization.
 *
 * @public
 */
export interface AuthenticateResult {
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
   * UserInfo.
   */
  userInfo: UserInfo;
}

/**
 * @public
 */
export interface SettingOptions {
  /**
   * UI locale tags
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
 * @public
 */
export enum BiometricLAPolicy {
  deviceOwnerAuthenticationWithBiometrics = "deviceOwnerAuthenticationWithBiometrics",
  deviceOwnerAuthentication = "deviceOwnerAuthentication",
}

/**
 * @public
 */
export enum BiometricAccessConstraintIOS {
  BiometricAny = "biometryAny",
  BiometryCurrentSet = "biometryCurrentSet",
  UserPresence = "userPresence",
}

/**
 * @public
 */
export interface BiometricOptionsIOS {
  localizedReason: string;
  constraint: BiometricAccessConstraintIOS;
  policy: BiometricLAPolicy;
}

/**
 * @public
 */
export enum BiometricAccessConstraintAndroid {
  BiometricStrong = "BIOMETRIC_STRONG",
  DeviceCredential = "DEVICE_CREDENTIAL",
}

/**
 * @public
 */
export interface BiometricOptionsAndroid {
  title: string;
  subtitle: string;
  description: string;
  negativeButtonText: string;
  constraint: BiometricAccessConstraintAndroid[];
  invalidatedByBiometricEnrollment: boolean;
}

/**
 * @public
 */
export interface BiometricOptions {
  ios: BiometricOptionsIOS;
  android: BiometricOptionsAndroid;
}

/**
 * @public
 */
export interface BiometricPrivateKeyOptions extends BiometricOptions {
  kid: string;
  payload: {
    iat: number;
    exp: number;
    challenge: string;
    action: string;
    device_info: unknown;
  };
}
