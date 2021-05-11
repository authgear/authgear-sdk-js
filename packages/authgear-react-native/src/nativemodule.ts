import { NativeModules } from "react-native";
import { CancelError } from "@authgear/core";
import { BiometricPrivateKeyOptions, BiometricOptions } from "./types";

const { AuthgearReactNative } = NativeModules;

export async function storageGetItem(key: string): Promise<string | null> {
  return AuthgearReactNative.storageGetItem(key);
}

export async function storageSetItem(
  key: string,
  value: string
): Promise<void> {
  return AuthgearReactNative.storageSetItem(key, value);
}

export async function storageDeleteItem(key: string): Promise<void> {
  return AuthgearReactNative.storageDeleteItem(key);
}

export async function getDeviceInfo(): Promise<unknown> {
  return AuthgearReactNative.getDeviceInfo();
}

export async function randomBytes(length: number): Promise<number[]> {
  return AuthgearReactNative.randomBytes(length);
}

export async function sha256String(input: string): Promise<number[]> {
  return AuthgearReactNative.sha256String(input);
}

export async function generateUUID(): Promise<string> {
  return AuthgearReactNative.generateUUID();
}

export async function openURL(
  url: string,
  wechatRedirectURI?: string
): Promise<void> {
  return AuthgearReactNative.openURL(url, wechatRedirectURI);
}

export async function openAuthorizeURL(
  url: string,
  callbackURL: string,
  wechatRedirectURI?: string
): Promise<string> {
  try {
    const redirectURI = await AuthgearReactNative.openAuthorizeURL(
      url,
      callbackURL,
      wechatRedirectURI
    );
    await dismiss();
    return redirectURI;
  } catch (e) {
    if (e.message === "CANCEL") {
      throw new CancelError();
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

export async function createBiometricPrivateKey(
  options: BiometricPrivateKeyOptions
): Promise<string> {
  return AuthgearReactNative.createBiometricPrivateKey(options);
}

export async function signWithBiometricPrivateKey(
  options: BiometricPrivateKeyOptions
): Promise<string> {
  return AuthgearReactNative.signWithBiometricPrivateKey(options);
}

export async function removeBiometricPrivateKey(kid: string): Promise<void> {
  return AuthgearReactNative.removeBiometricPrivateKey(kid);
}

export async function checkBiometricSupported(
  options: BiometricOptions
): Promise<void> {
  return AuthgearReactNative.checkBiometricSupported(options);
}
