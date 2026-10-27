import {
  SessionStateChangeReason,
  PromptOption,
  UserInfo,
} from "@authgear/core";
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
   * error is non-null when reason is "INVALID", i.e. the session was
   * cleared because a request failed with an error such as invalid_grant
   * or invalid_dpop_proof. It is undefined for all other reasons.
   *
   * @public
   */
  onSessionStateChange: (
    container: WebContainer,
    reason: SessionStateChangeReason,
    error?: unknown
  ) => void;
}

/**
 * Options for reauthentication
 * @public
 */
export interface ReauthenticateOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * Custom state. Use this parameter to provide parameters from the client application to Custom UI. The string in xState can be accessed by the Custom UI.
   *
   * Ignore this parameter if default AuthUI is used.
   */
  xState?: string;
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
   * OIDC max_age
   */
  maxAge?: number;
  /**
   * Authentication flow group
   */
  authenticationFlowGroup?: string;
}

/**
 * Auth UI authorization options
 *
 * @public
 */
export interface AuthenticateOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * Custom state. Use this parameter to provide parameters from the client application to Custom UI. The string in xState can be accessed by the Custom UI.
   *
   * Ignore this parameter if default AuthUI is used.
   */
  xState?: string;
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
   * @internal
   */
  loginHint?: string;
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
   * OAuth response type
   * @internal
   */
  responseType?: "code" | "none";
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
  /**
   * Resource indicator (RFC 8707). The URI of an API Resource registered in Authgear Portal.
   *
   * When it is set, the access tokens of the resulting session have `aud` set to this URI instead of the Authgear endpoint.
   * The binding lasts for the whole session, including tokens obtained by refreshing.
   *
   * If it is not set, `ConfigureOptions.resource` is used.
   * It has effect only when sessionType is "refresh_token", because no access token is issued for cookie-based sessions.
   */
  resource?: string;
  /**
   * Scopes of the API Resource given in `resource` to request.
   * If it is not set, `ConfigureOptions.scopes` is used.
   *
   * They are merged with the scopes required by the SDK. The scopes required by the SDK are always requested.
   */
  scopes?: string[];
}

/**
 * @public
 */
export interface SettingOptions {
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
   * Indicates whether to open the settings page in the same tab
   */
  openInSameTab?: boolean;
}

/**
 * Auth UI settings action options
 *
 * @public
 */
export interface SettingsActionOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * Custom state. Use this parameter to provide parameters from the client application to Custom UI. The string in xState can be accessed by the Custom UI.
   *
   * Ignore this parameter if default AuthUI is used.
   */
  xState?: string;
  /**
   * UI locale tags. You can use this parameter to set the display language for Auth UI.
   *
   * First, enable the language you want to change to in Authgear Portal (Your project \> UI Settings \> click on the settings icon beside Language.)
   *
   * For example, to change the language for Auth UI to Hong Kong,
   * set the value for uiLocales to ["zh-HK"] after enabling "Chinese (Hong Kong)" in Authgear Portal.
   */
  uiLocales?: string[];
}

/**
 * Options for connecting an OAuth provider via settings action.
 * @public
 */
export interface LinkOAuthOptions extends SettingsActionOptions {
  /**
   * The alias of the OAuth provider to link,
   * as configured in Authgear Portal under Social / Enterprise Login.
   */
  oauthProviderAlias: string;
}

/**
 * Options for disconnecting an OAuth provider via settings action.
 * @public
 */
export interface UnlinkOAuthOptions extends SettingsActionOptions {
  /**
   * The alias of the OAuth provider to unlink,
   * as configured in Authgear Portal under Social / Enterprise Login.
   * This field is required.
   */
  oauthProviderAlias: string;
}

/**
 * @internal
 */
export interface _InternalSettingsActionOptions extends SettingsActionOptions {
  qLoginID?: string;
  oauthProviderAlias?: string;
}

/**
 * Auth UI anonymous user promotion options
 *
 * @public
 */

export interface PromoteOptions {
  /**
   * The value should be a valid Redirect URI to which the response will be sent after authentication.
   * You must also add a Redirect URI in Authgear Poral via the Redirect URI section of your Authgear Application.
   */
  redirectURI: string;
  /**
   * OAuth 2.0 state value.
   */
  state?: string;
  /**
   * Custom state. Use this parameter to provide parameters from the client application to Custom UI. The string in xState can be accessed by the Custom UI.
   *
   * Ignore this parameter if default AuthUI is used.
   */
  xState?: string;
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
   * OAuth response type
   * @internal
   */
  responseType?: "code" | "none";
  /**
   * Resource indicator (RFC 8707). The URI of an API Resource registered in Authgear Portal.
   * If it is not set, `ConfigureOptions.resource` is used.
   *
   * It has effect only when sessionType is "refresh_token", because no access token is issued for cookie-based sessions.
   */
  resource?: string;
  /**
   * Scopes of the API Resource given in `resource` to request.
   * If it is not set, `ConfigureOptions.scopes` is used.
   *
   * They are merged with the scopes required by the SDK. The scopes required by the SDK are always requested.
   */
  scopes?: string[];
}

/**
 * Options of authenticateAnonymously().
 *
 * @public
 */
export interface AuthenticateAnonymouslyOptions {
  /**
   * Resource indicator (RFC 8707). The URI of an API Resource registered in Authgear Portal.
   * If it is not set, `ConfigureOptions.resource` is used.
   *
   * It has effect only when sessionType is "refresh_token". It is rejected by the server with sessionType "cookie".
   */
  resource?: string;
  /**
   * Scopes of the API Resource given in `resource` to request.
   * If it is not set, `ConfigureOptions.scopes` is used.
   *
   * They are merged with the scopes required by the SDK. The scopes required by the SDK are always requested.
   */
  scopes?: string[];
}

/**
 * Result of authorization.
 *
 * @public
 */
export interface AuthenticateResult {
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
