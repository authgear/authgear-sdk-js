import { encode, decode } from "base64-arraybuffer";

/**
 * @internal
 */
export function _base64URLEncode(arrayBuffer: ArrayBuffer): string {
  return encode(arrayBuffer)
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/, "");
}

/**
 * @internal
 */
export function _base64URLDecode(s: string): ArrayBuffer {
  return decode(s.replace(/-/g, "+").replace(/_/g, "/"));
}
