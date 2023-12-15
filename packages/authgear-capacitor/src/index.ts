import { registerPlugin } from "@capacitor/core";

import type { AuthgearPlugin } from "./definitions";

/**
 * @public
 */
const Authgear = registerPlugin<AuthgearPlugin>("Authgear", {
  // This file is generated, thus the following dynamic import statement.
  // @ts-expect-error
  web: async () => import("./web").then((m) => new m.AuthgearWeb()),
});

export type { AuthgearPlugin };
export { Authgear };
