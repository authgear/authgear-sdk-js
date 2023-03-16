import { WebContainer } from "../container";

class Latte {
  public authgear: WebContainer;
  public customUIEndpoint: string;

  constructor(authgear: WebContainer, customUIEndpoint: string) {
    this.authgear = authgear;
    this.customUIEndpoint = customUIEndpoint;
  }
}

export { Latte };
