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
    | "xState"
    | "prompt"
    | "loginHint"
    | "uiLocales"
    | "responseType"
    | "page"
    | "oauthProviderAlias"
  > {}
