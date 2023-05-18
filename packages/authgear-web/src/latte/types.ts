import { AuthenticateOptions } from "../types";

/**
 * Latte authorization options
 *
 * @public
 */
export interface LatteAuthenticateOptions
  extends Pick<
    AuthenticateOptions,
    | "redirectURI"
    | "state"
    | "prompt"
    | "loginHint"
    | "uiLocales"
    | "responseType"
    | "page"
    | "oauthProviderAlias"
  > {
  xSecrets?: Record<string, string>;
  xState?: Record<string, string>;
}
