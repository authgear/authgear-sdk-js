/* global window */
import { AuthenticateOptions } from "../types";
import { Latte } from "./latte";

class LatteFlows {
  private latte: Latte;

  constructor(latte: Latte) {
    this.latte = latte;
  }

  public async startAuthentication(
    options: AuthenticateOptions
  ): Promise<void> {
    const authorizeEndpoint =
      await this.latte.authgear.experimental.authorizeEndpoint(options);
    window.location.href = authorizeEndpoint;
  }
}

export { LatteFlows };
