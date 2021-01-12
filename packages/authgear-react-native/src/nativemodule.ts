import { NativeModules } from "react-native";
import { CANCEL } from "@authgear/core";

const { AuthgearReactNative } = NativeModules;

export async function randomBytes(length: number): Promise<number[]> {
  return AuthgearReactNative.randomBytes(length);
}

export async function sha256String(input: string): Promise<number[]> {
  return AuthgearReactNative.sha256String(input);
}

export async function openURL(url: string): Promise<void> {
  return AuthgearReactNative.openURL(url);
}

export async function openAuthorizeURL(
  url: string,
  callbackURL: string
): Promise<string> {
  try {
    const redirectURI = await AuthgearReactNative.openAuthorizeURL(
      url,
      callbackURL
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
  return AuthgearReactNative.dismiss();
}

export async function getAnonymousKey(
  kid: string | null
): Promise<{ kid: string; alg: string; jwk?: any }> {
  return AuthgearReactNative.getAnonymousKey(kid);
}

export async function signAnonymousToken(
  kid: string,
  tokenData: string
): Promise<string> {
  return AuthgearReactNative.signAnonymousToken(kid, tokenData);
}
