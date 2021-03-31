// On iOS, the arguments passed to RCTPromiseRejectBlock
// will be processed by RCTJSErrorFromCodeMessageAndNSError.
//
// The error shape is
// {
//   "code": "The first argument of RCTPromiseRejectBlock"
//   "domain": "The domain of the third argument",
//   "userInfo": "The userInfo of the third argument"
// }

// iOS LocalAuthentication
export const kLAErrorDomain = "com.apple.LocalAuthentication";
// export const kLAErrorAuthenticationFailed = "-1";
export const kLAErrorUserCancel = "-2";
// export const kLAErrorUserFallback = "-3";
// export const kLAErrorSystemCancel = "-4";
export const kLAErrorPasscodeNotSet = "-5";
// export const kLAErrorAppCancel = "-9";
// export const kLAErrorInvalidContext = "-10";
// export const kLAErrorWatchNotAvailable = "-11";
// export const kLAErrorNotInteractive = "-1004";
export const kLAErrorBiometryNotAvailable = "-6";
export const kLAErrorBiometryNotEnrolled = "-7";
export const kLAErrorBiometryLockout = "-8";

// iOS Keychain
export const NSOSStatusErrorDomain = "NSOSStatusErrorDomain";
export const errSecUserCanceled = "-128";
export const errSecAuthFailed = "-25293";
export const errSecItemNotFound = "-25300";

// Android BiometricManager.canAuthenticate
export const BIOMETRIC_ERROR_HW_UNAVAILABLE = "BIOMETRIC_ERROR_HW_UNAVAILABLE";
export const BIOMETRIC_ERROR_NONE_ENROLLED = "BIOMETRIC_ERROR_NONE_ENROLLED";
export const BIOMETRIC_ERROR_NO_HARDWARE = "BIOMETRIC_ERROR_NO_HARDWARE";
export const BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED =
  "BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED";
export const BIOMETRIC_ERROR_UNSUPPORTED = "BIOMETRIC_ERROR_UNSUPPORTED";
// export const BIOMETRIC_STATUS_UNKNOWN = "BIOMETRIC_STATUS_UNKNOWN";

// Android BiometricPrompt
export const ERROR_CANCELED = "ERROR_CANCELED";
export const ERROR_HW_NOT_PRESENT = "ERROR_HW_NOT_PRESENT";
export const ERROR_HW_UNAVAILABLE = "ERROR_HW_UNAVAILABLE";
export const ERROR_LOCKOUT = "ERROR_LOCKOUT";
export const ERROR_LOCKOUT_PERMANENT = "ERROR_LOCKOUT_PERMANENT";
export const ERROR_NEGATIVE_BUTTON = "ERROR_NEGATIVE_BUTTON";
export const ERROR_NO_BIOMETRICS = "ERROR_NO_BIOMETRICS";
export const ERROR_NO_DEVICE_CREDENTIAL = "ERROR_NO_DEVICE_CREDENTIAL";
// export const ERROR_NO_SPACE = "ERROR_NO_SPACE";
export const ERROR_SECURITY_UPDATE_REQUIRED = "ERROR_SECURITY_UPDATE_REQUIRED";
// export const ERROR_TIMEOUT = "ERROR_TIMEOUT";
// export const ERROR_UNABLE_TO_PROCESS = "ERROR_UNABLE_TO_PROCESS";
export const ERROR_USER_CANCELED = "ERROR_USER_CANCELED";
// export const ERROR_VENDOR = "ERROR_VENDOR";

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

/**
 * If it returns true, then it is likely that the biometric has changed
 * so that the private key has been invalidated.
 *
 * @public
 */
export function isBiometricPrivateKeyNotFoundError(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return e.domain === NSOSStatusErrorDomain && e.code === errSecItemNotFound;
  }
  if (isPlatformErrorAndroid(e)) {
    return (
      e.code === "android.security.keystore.KeyPermanentlyInvalidatedException"
    );
  }
  return false;
}

/**
 * If it returns true, then it is likely that the user has canceled.
 *
 * @public
 */
export function isBiometricCancel(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      (e.domain === kLAErrorDomain && e.code === kLAErrorUserCancel) ||
      (e.domain === NSOSStatusErrorDomain && e.code === errSecUserCanceled)
    );
  }
  if (isPlatformErrorAndroid(e)) {
    return (
      e.code === ERROR_CANCELED ||
      e.code === ERROR_NEGATIVE_BUTTON ||
      e.code === ERROR_USER_CANCELED
    );
  }
  return false;
}

/**
 * If it returns ture, then it is likely that this device does not support biometric,
 * or the user has denied the usage of biometric.
 *
 * @public
 */
export function isBiometricNotSupportedOrPermissionDenied(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.domain === kLAErrorDomain && e.code === kLAErrorBiometryNotAvailable
    );
  }
  if (isPlatformErrorAndroid(e)) {
    return (
      e.code === BIOMETRIC_ERROR_HW_UNAVAILABLE ||
      e.code === BIOMETRIC_ERROR_NO_HARDWARE ||
      e.code === BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ||
      e.code === BIOMETRIC_ERROR_UNSUPPORTED ||
      e.code === ERROR_HW_NOT_PRESENT ||
      e.code === ERROR_HW_UNAVAILABLE ||
      e.code === ERROR_SECURITY_UPDATE_REQUIRED
    );
  }
  return false;
}

/**
 * If it returns true, then the user has not setup biometric.
 * You should prompt the user to do so.
 *
 * @public
 */
export function isBiometricNoEnrollment(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.domain === kLAErrorDomain && e.code === kLAErrorBiometryNotEnrolled
    );
  }
  if (isPlatformErrorAndroid(e)) {
    return (
      e.code === BIOMETRIC_ERROR_NONE_ENROLLED || e.code === ERROR_NO_BIOMETRICS
    );
  }
  return false;
}

/**
 * If it returns true, then the device does not have a passcode.
 * You should prompt the user to setup a passcode for their device.
 *
 * @public
 */
export function isBiometricNoPasscode(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return e.domain === kLAErrorDomain && e.code === kLAErrorPasscodeNotSet;
  }
  if (isPlatformErrorAndroid(e)) {
    return e.code === ERROR_NO_DEVICE_CREDENTIAL;
  }
  return false;
}

/**
 * If it returns true, then biometric is locked due to too many failed attempts.
 *
 * @public
 */
export function isBiometricLockout(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return e.domain === kLAErrorDomain && e.code === kLAErrorBiometryLockout;
  }
  if (isPlatformErrorAndroid(e)) {
    return e.code === ERROR_LOCKOUT || e.code === ERROR_LOCKOUT_PERMANENT;
  }
  return false;
}
