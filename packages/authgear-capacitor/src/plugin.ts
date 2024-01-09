import { registerPlugin } from "@capacitor/core";
import { _wrapError } from "./error";

export interface AuthgearPlugin {
  storageGetItem(options: { key: string }): Promise<{ value: string | null }>;
  storageSetItem(options: { key: string; value: string }): Promise<void>;
  storageDeleteItem(options: { key: string }): Promise<void>;
  randomBytes(options: { length: number }): Promise<{ bytes: number[] }>;
  sha256String(options: { input: string }): Promise<{ bytes: number[] }>;
  getDeviceInfo(): Promise<{ deviceInfo: unknown }>;
  openAuthorizeURL(options: {
    url: string;
    callbackURL: string;
    prefersEphemeralWebBrowserSession: boolean;
  }): Promise<{ redirectURI: string }>;
  openURL(options: { url: string }): Promise<void>;
}

const Authgear = registerPlugin<AuthgearPlugin>("Authgear", {});

export async function storageGetItem(key: string): Promise<string | null> {
  try {
    const { value } = await Authgear.storageGetItem({ key });
    return value;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function storageSetItem(
  key: string,
  value: string
): Promise<void> {
  try {
    await Authgear.storageSetItem({ key, value });
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function storageDeleteItem(key: string): Promise<void> {
  try {
    await Authgear.storageDeleteItem({ key });
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function randomBytes(length: number): Promise<number[]> {
  try {
    const { bytes } = await Authgear.randomBytes({ length });
    return bytes;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function sha256String(input: string): Promise<number[]> {
  try {
    const { bytes } = await Authgear.sha256String({ input });
    return bytes;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function getDeviceInfo(): Promise<unknown> {
  try {
    const { deviceInfo } = await Authgear.getDeviceInfo();
    return deviceInfo;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function openAuthorizeURL(options: {
  url: string;
  callbackURL: string;
  prefersEphemeralWebBrowserSession: boolean;
}): Promise<string> {
  try {
    const { redirectURI } = await Authgear.openAuthorizeURL(options);
    return redirectURI;
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}

export async function openURL(options: { url: string }): Promise<void> {
  try {
    await Authgear.openURL(options);
  } catch (e: unknown) {
    throw _wrapError(e);
  }
}
