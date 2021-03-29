// On iOS, the arguments passed to RCTPromiseRejectBlock
// will be processed by RCTJSErrorFromCodeMessageAndNSError.
//
// The error shape is
// {
//   "code": "The first argument of RCTPromiseRejectBlock"
//   "domain": "The domain of the third argument",
//   "userInfo": "The userInfo of the third argument"
// }

export interface PlatformErrorIOS {
  code: string;
  domain: string;
  userInfo?: unknown;
}

export interface PlatformErrorAndroid {
  code: string;
  userInfo?: unknown;
}

export function isPlatformErrorIOS(e: unknown): e is PlatformErrorIOS {
  return typeof e === "object" && e != null && "domain" in e && "code" in e;
}

export function isPlatformErrorAndroid(e: unknown): e is PlatformErrorAndroid {
  return typeof e === "object" && e != null && "code" in e;
}

export function isBiometricPrivateKeyNotFoundError(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return e.domain === "NSOSStatusErrorDomain" && e.code === "-25300";
  }
  if (isPlatformErrorAndroid(e)) {
    return (
      e.code === "android.security.keystore.KeyPermanentlyInvalidatedException"
    );
  }
  return false;
}
