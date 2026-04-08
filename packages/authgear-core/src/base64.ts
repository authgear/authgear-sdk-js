import { encode, decode } from "base64-arraybuffer";

type Base64Input = ArrayBuffer | ArrayBufferView;

/**
 * @internal
 */
export function _base64URLEncode(input: Base64Input): string {
  return encode(input as ArrayBuffer)
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/, "");
}

/**
 * @internal
 */
export function _base64URLDecode(s: string): ArrayBuffer {
  // base64-arraybuffer ignores padding actually.
  // https://github.com/niklasvh/base64-arraybuffer/blob/master/lib/base64-arraybuffer.js#L44
  // so we need not bother with adding padding to the encoded string.
  return decode(s.replace(/-/g, "+").replace(/_/g, "/"));
}
