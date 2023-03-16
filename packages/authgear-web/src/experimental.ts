import { WebContainer } from "./container";
import { AuthenticateOptions } from "./types";

class AuthgearExperimental {
  private authgear: WebContainer;

  constructor(authgear: WebContainer) {
    this.authgear = authgear;
  }

  async authorizeEndpoint(options: AuthenticateOptions): Promise<string> {
    return this.authgear.authorizeEndpoint(options);
  }
}

export { AuthgearExperimental };
