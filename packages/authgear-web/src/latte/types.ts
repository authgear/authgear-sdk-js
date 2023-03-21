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
    | "xState"
    | "prompt"
    | "loginHint"
    | "uiLocales"
    | "responseType"
    | "page"
    | "oauthProviderAlias"
  > {}
