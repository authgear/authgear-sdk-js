import { WebContainer } from "../container";
import { AuthenticateOptions } from "../types";
import { LatteFlows } from "./flows";

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
    options: AuthenticateOptions
  ): Promise<void> {
    return this.flows.startAuthentication(options);
  }
}

export { Latte };
