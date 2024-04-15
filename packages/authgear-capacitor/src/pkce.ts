/* global Uint8Array */
import { _base64URLEncode } from "@authgear/core";

import { randomBytes, sha256String } from "./plugin";

export async function generateCodeVerifier(): Promise<string> {
  const arr = await randomBytes(32);
  const base64 = _base64URLEncode(new Uint8Array(arr));
  return base64;
}

export async function computeCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const hash = await sha256String(codeVerifier);
  const base64 = _base64URLEncode(new Uint8Array(hash));
  return base64;
}
