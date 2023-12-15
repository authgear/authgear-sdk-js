import { WebPlugin } from "@capacitor/core";

import type { AuthgearPlugin } from "./definitions";

export class AuthgearWeb extends WebPlugin implements AuthgearPlugin {
  // eslint-disable-next-line class-methods-use-this
  async echo(options: { value: string }): Promise<{ value: string }> {
    return options;
  }
}
