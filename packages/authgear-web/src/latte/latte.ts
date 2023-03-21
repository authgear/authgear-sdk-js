import { WebContainer } from "../container";
import { LatteFlows } from "./flows";
import { LatteAuthenticateOptions } from "./types";

/**
 * @public
 */
class Latte {
  public authgear: WebContainer;
  public customUIEndpoint: string;

  private flows: LatteFlows;

  constructor(authgear: WebContainer, customUIEndpoint: string) {
    this.authgear = authgear;
    this.customUIEndpoint = customUIEndpoint;

    this.flows = new LatteFlows(this);
  }

  public async startAuthentication(
    options: LatteAuthenticateOptions
  ): Promise<void> {
    return this.flows.startAuthentication(options);
  }
}

export { Latte };
