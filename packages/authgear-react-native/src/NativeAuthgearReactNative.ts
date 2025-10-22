import {
  TurboModuleRegistry,
  type TurboModule,
  type CodegenTypes,
} from "react-native";

export interface Spec extends TurboModule {
  // Events
  readonly onAuthgearReactNative: CodegenTypes.EventEmitter<{
    invocationID: string;
    url: string;
  }>;

  // Methods
  storageGetItem(key: string): Promise<string | null>;
  storageSetItem(key: string, value: string): Promise<void>;
  storageDeleteItem(key: string): Promise<void>;
  getDeviceInfo(): Promise<unknown>;
  randomBytes(length: number): Promise<number[]>;
  sha256String(input: string): Promise<number[]>;
  generateUUID(): Promise<string>;
  openAuthorizeURL(
    url: string,
    callbackURL: string,
    prefersEphemeralWebBrowserSession: boolean
  ): Promise<string>;
  openAuthorizeURLWithWebView(options: unknown): Promise<string>;
  dismiss(): Promise<void>;
  getAnonymousKey(
    kid: string | null
  ): Promise<{ kid: string; alg: string; jwk?: unknown }>;
  signAnonymousToken(kid: string, tokenData: string): Promise<string>;
  createBiometricPrivateKey(options: unknown): Promise<string>;
  signWithBiometricPrivateKey(options: unknown): Promise<string>;
  removeBiometricPrivateKey(kid: string): Promise<void>;
  checkBiometricSupported(options: unknown): Promise<void>;
  // stub is really stub, result is either "true" or "false".
  checkDPoPSupported(stub: unknown): Promise<string>;
  createDPoPPrivateKey(options: unknown): Promise<void>;
  signWithDPoPPrivateKey(options: unknown): Promise<string>;
  // result is either "true" or "false".
  checkDPoPPrivateKey(options: unknown): Promise<string>;
  computeDPoPJKT(options: unknown): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("AuthgearReactNative");
