import {
  SessionStateChangeReason,
  ColorScheme,
  PromptOption,
  type UserInfo,
} from "@authgear/core";
import { CapacitorContainer } from ".";

/**
 * @public
 */
export interface CapacitorContainerDelegate {
  /**
   * This callback will be called when the session state is changed.
   *
   * For example, when the user logs out, the new state is "NO_SESSION"
   * and the reason is "LOGOUT".
   *
   * @public
   */
  onSessionStateChange: (
    container: CapacitorContainer,
    reason: SessionStateChangeReason
  ) => void;
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
}
