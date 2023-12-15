import { registerPlugin } from "@capacitor/core";
import { _base64URLEncode, _base64URLDecode } from "@authgear/core";
import type { AuthgearPlugin } from "./definitions";

/**
 * @public
 */
const Authgear = registerPlugin<AuthgearPlugin>("Authgear", {
  // This file is generated, thus the following dynamic import statement.
  // @ts-expect-error
  web: async () => import("./web").then((m) => new m.AuthgearWeb()),
});

/**
 * @public
 */
export function base64URLEncode(value: ArrayBuffer): string {
  return _base64URLEncode(value);
}

/**
 * @public
 */
export function base64URLDecode(value: string): ArrayBuffer {
  return _base64URLDecode(value);
}

export * from "@authgear/core";
export type { AuthgearPlugin };
export { Authgear };
