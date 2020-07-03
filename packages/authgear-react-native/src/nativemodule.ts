import { NativeModules } from "react-native";
import { CANCEL } from "@authgear/core";

const { SGSkygearReactNative } = NativeModules;

export async function randomBytes(length: number): Promise<number[]> {
  return SGSkygearReactNative.randomBytes(length);
}

export async function sha256String(input: string): Promise<number[]> {
  return SGSkygearReactNative.sha256String(input);
}

export async function openURL(url: string): Promise<void> {
  return SGSkygearReactNative.openURL(url);
}

export async function openAuthorizeURL(
  url: string,
  callbackURLScheme: string
): Promise<string> {
  try {
    const redirectURI = await SGSkygearReactNative.openAuthorizeURL(
      url,
      callbackURLScheme
    );
    await dismiss();
    return redirectURI;
  } catch (e) {
    if (e.message === "CANCEL") {
      throw CANCEL;
    }
    throw e;
  }
}

export async function dismiss(): Promise<void> {
  return SGSkygearReactNative.dismiss();
}

export async function getAnonymousKey(
  kid: string | null
): Promise<{ kid: string; alg: string; jwk?: any }> {
  return SGSkygearReactNative.getAnonymousKey(kid);
}

export async function signAnonymousToken(
  kid: string,
  tokenData: string
): Promise<string> {
  return SGSkygearReactNative.signAnonymousToken(kid, tokenData);
}
