import { NativeModules } from "react-native";
import { BiometricPrivateKeyOptions, BiometricOptions } from "./types";
import { _wrapError } from "./error";

const { AuthgearReactNative } = NativeModules;

async function _wrapPromise<T>(p: Promise<T>): Promise<T> {
  try {
    const val = await p;
    return val;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function storageGetItem(key: string): Promise<string | null> {
  return _wrapPromise(AuthgearReactNative.storageGetItem(key));
}

export async function storageSetItem(
  key: string,
  value: string
): Promise<void> {
  return _wrapPromise(AuthgearReactNative.storageSetItem(key, value));
}

export async function storageDeleteItem(key: string): Promise<void> {
  return _wrapPromise(AuthgearReactNative.storageDeleteItem(key));
}

export async function getDeviceInfo(): Promise<unknown> {
  return _wrapPromise(AuthgearReactNative.getDeviceInfo());
}

export async function randomBytes(length: number): Promise<number[]> {
  return _wrapPromise(AuthgearReactNative.randomBytes(length));
}

export async function sha256String(input: string): Promise<number[]> {
  return _wrapPromise(AuthgearReactNative.sha256String(input));
}

export async function generateUUID(): Promise<string> {
  return _wrapPromise(AuthgearReactNative.generateUUID());
}

export async function registerWechatRedirectURI(
  wechatRedirectURI: string
): Promise<void> {
  return _wrapPromise(
    AuthgearReactNative.registerWechatRedirectURI(wechatRedirectURI)
  );
}

export async function openURL(url: string): Promise<void> {
  return _wrapPromise(AuthgearReactNative.openURL(url));
}

export async function openAuthorizeURL(
  url: string,
  callbackURL: string,
  prefersEphemeralWebBrowserSession: boolean
): Promise<string> {
  const redirectURI: string = await _wrapPromise(
    AuthgearReactNative.openAuthorizeURL(
      url,
      callbackURL,
      prefersEphemeralWebBrowserSession
    )
  );
  await dismiss();
  return redirectURI;
}

export async function dismiss(): Promise<void> {
  return _wrapPromise(AuthgearReactNative.dismiss());
}

export async function getAnonymousKey(
  kid: string | null
): Promise<{ kid: string; alg: string; jwk?: any }> {
  return _wrapPromise(AuthgearReactNative.getAnonymousKey(kid));
}

export async function signAnonymousToken(
  kid: string,
  tokenData: string
): Promise<string> {
  return _wrapPromise(AuthgearReactNative.signAnonymousToken(kid, tokenData));
}

export async function createBiometricPrivateKey(
  options: BiometricPrivateKeyOptions
): Promise<string> {
  return _wrapPromise(AuthgearReactNative.createBiometricPrivateKey(options));
}

export async function signWithBiometricPrivateKey(
  options: BiometricPrivateKeyOptions
): Promise<string> {
  return _wrapPromise(AuthgearReactNative.signWithBiometricPrivateKey(options));
}

export async function removeBiometricPrivateKey(kid: string): Promise<void> {
  return _wrapPromise(AuthgearReactNative.removeBiometricPrivateKey(kid));
}

export async function checkBiometricSupported(
  options: BiometricOptions
): Promise<void> {
  return _wrapPromise(AuthgearReactNative.checkBiometricSupported(options));
}
