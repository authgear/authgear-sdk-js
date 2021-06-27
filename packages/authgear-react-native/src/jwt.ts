import { _encodeUTF8, _base64URLEncode } from "@authgear/core";
import { signAnonymousToken, getAnonymousKey } from "./nativemodule";

function encodeRawBase64URL(input: string): string {
  return _base64URLEncode(_encodeUTF8(input));
}

export async function getAnonymousJWK(
  kid: string | null
): Promise<{ kid: string; alg: string; jwk?: unknown }> {
  const key = await getAnonymousKey(kid);
  return key;
}

export async function signAnonymousJWT(
  kid: string,
  header: Record<string, unknown>,
  payload: Record<string, unknown>
): Promise<string> {
  const dataToSign = [header, payload]
    .map((part) => encodeRawBase64URL(JSON.stringify(part)))
    .join(".");
  const sig = await signAnonymousToken(kid, dataToSign);
  const token = `${dataToSign}.${sig}`;
  return token;
}
