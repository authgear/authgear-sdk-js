import { TextEncoder, TextDecoder } from "text-encoding-shim";

/**
 * @internal
 */
export function _encodeUTF8(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

/**
 * @internal
 */
export function _decodeUTF8(input: Uint8Array): string {
  return new TextDecoder().decode(input);
}
