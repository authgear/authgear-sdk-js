import { SessionStateChangeReason, PromptOption } from "@authgear/core";
import { WebContainer } from ".";

/**
 * @public
 */
export interface WebContainerDelegate {
  /**
   * This callback will be called when the session state is changed.
   *
   * For example, when the user logs out, the new state is "NO_SESSION"
   * and the reason is "LOGOUT".
   *
   * @public
   */
  onSessionStateChange: (
    container: WebContainer,
    reason: SessionStateChangeReason
  ) => void;
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
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * UI locale tags
   */
  uiLocales?: string[];
  /**
   * OIDC max_age
   */
  maxAge?: number;
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
   * OAuth 2.0 state value.
   */
  state?: string;
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
   * OAuth response type
   */
  responseType?: "code" | "none";
  /**
   * Initial page to open. Valid values are 'login' and 'signup'.
   */
  page?: string;
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
   * OAuth response type
   */
  responseType?: "code" | "none";
}
