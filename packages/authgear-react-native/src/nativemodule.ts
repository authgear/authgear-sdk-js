import { NativeModules } from "react-native";
import { BiometricPrivateKeyOptions, BiometricOptions } from "./types";
import { _wrapError } from "./error";

// In ios objc code, reading a BOOL from a NSDictionary always got true
// So encode the boolean as string before passing to native
type BooleanString = "false" | "true";

const { AuthgearReactNative } = NativeModules;

async function _wrapPromise<T>(p: Promise<T>): Promise<T> {
  try {
    const val = await p;
    return val;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

// Objective-C cannot return a correct boolean. Use string to represent a boolean.
function parseBooleanString(str: unknown): boolean {
  return str === "true";
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

export async function openAuthorizeURLWithWebView(options: {
  invocationID: string;
  url: string;
  redirectURI: string;

  navigationBarBackgroundColor?: string;
  navigationBarButtonTintColor?: string;
  modalPresentationStyle?: string;
  iosIsInspectable?: BooleanString;

  actionBarBackgroundColor?: string;
  actionBarButtonTintColor?: string;

  iosWechatRedirectURI?: string;
  androidWechatRedirectURI?: string;
}): Promise<string> {
  const redirectURIWithQuery: string = await _wrapPromise(
    AuthgearReactNative.openAuthorizeURLWithWebView(options)
  );
  await dismiss();
  return redirectURIWithQuery;
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

export async function checkDPoPSupported(): Promise<boolean> {
  // Call with empty object,
  // because it seems there is some problem in objc if we call a method without arguments.
  const result = await _wrapPromise(AuthgearReactNative.checkDPoPSupported({}));
  return parseBooleanString(result);
}

export async function createDPoPPrivateKey(kid: string): Promise<void> {
  return _wrapPromise(AuthgearReactNative.createDPoPPrivateKey({ kid }));
}

export async function signWithDPoPPrivateKey(
  kid: string,
  payload: Record<string, unknown>
): Promise<string> {
  return _wrapPromise(
    AuthgearReactNative.signWithDPoPPrivateKey({ kid, payload })
  );
}

export async function checkDPoPPrivateKey(kid: string): Promise<boolean> {
  const result = await _wrapPromise(
    AuthgearReactNative.checkDPoPPrivateKey({ kid })
  );
  return parseBooleanString(result);
}

export async function computeDPoPJKT(kid: string): Promise<string> {
  return _wrapPromise(AuthgearReactNative.computeDPoPJKT({ kid }));
}
