/* global window */
import { WebContainer } from "../container";
import { AuthenticateOptions } from "../types";
import { LatteError } from "./error";
import { LatteFlows } from "./flows";
import { LatteAuthenticateOptions } from "./types";

/**
 * @public
 */
class Latte {
  public authgear: WebContainer;
  public customUIEndpoint: string;
  public tokenizeEndpoint: string;

  private flows: LatteFlows;

  private fetch = window.fetch.bind(window);

  constructor(
    authgear: WebContainer,
    customUIEndpoint: string,
    tokenizeEndpoint: string
  ) {
    this.authgear = authgear;
    this.customUIEndpoint = customUIEndpoint;
    this.tokenizeEndpoint = tokenizeEndpoint;

    this.flows = new LatteFlows(this);
  }

  public async startAuthentication(
    options: LatteAuthenticateOptions
  ): Promise<void> {
    const { xSecrets = {}, xState = {}, ...restOptions } = options;
    const authOptions: AuthenticateOptions = { ...restOptions };

    const finalXState = { ...xState };

    if (Object.entries(xSecrets).length > 0) {
      const secretsJson = JSON.stringify(xSecrets);
      const token = await this.tokenize(secretsJson);
      finalXState["x_secrets_token"] = token;
    }

    if (Object.entries(finalXState).length > 0) {
      const xStateEncoded = new URLSearchParams(finalXState).toString();
      authOptions.xState = xStateEncoded;
    }

    return this.flows.startAuthentication(authOptions);
  }

  private async tokenize(data: string): Promise<string> {
    const resp = await this.fetch(this.tokenizeEndpoint, {
      method: "POST",
      body: data,
      credentials: "omit",
    });
    if (!resp.ok) {
      throw new LatteError("unexpected response from tokenuze endpoint", resp);
    }
    return resp.text();
  }
}

export { Latte };
