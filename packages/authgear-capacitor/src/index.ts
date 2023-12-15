import { registerPlugin } from "@capacitor/core";

import type { AuthgearPlugin } from "./definitions";

const Authgear = registerPlugin<AuthgearPlugin>("Authgear", {
  // This file is generated, thus the following dynamic import statement.
  // @ts-expect-error
  web: () => import("./web").then((m) => new m.AuthgearWeb()),
});

export * from "./definitions";
export { Authgear };
