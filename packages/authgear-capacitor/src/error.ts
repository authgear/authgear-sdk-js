import { AuthgearError, CancelError } from "@authgear/core";

// iOS LocalAuthentication
const kLAErrorDomain = "com.apple.LocalAuthentication";
// const kLAErrorAuthenticationFailed = -1;
const kLAErrorUserCancel = -2;
// const kLAErrorUserFallback = -3;
// const kLAErrorSystemCancel = -4;
const kLAErrorPasscodeNotSet = -5;
// const kLAErrorAppCancel = -9;
// const kLAErrorInvalidContext = -10;
// const kLAErrorWatchNotAvailable = -11;
// const kLAErrorNotInteractive = -1004;
const kLAErrorBiometryNotAvailable = -6;
const kLAErrorBiometryNotEnrolled = -7;
const kLAErrorBiometryLockout = -8;

// iOS Keychain
const NSOSStatusErrorDomain = "NSOSStatusErrorDomain";
const errSecUserCanceled = -128;
//const errSecAuthFailed = -25293;
const errSecItemNotFound = -25300;

// Android BiometricManager.canAuthenticate
const BIOMETRIC_ERROR_HW_UNAVAILABLE = "BIOMETRIC_ERROR_HW_UNAVAILABLE";
const BIOMETRIC_ERROR_NONE_ENROLLED = "BIOMETRIC_ERROR_NONE_ENROLLED";
const BIOMETRIC_ERROR_NO_HARDWARE = "BIOMETRIC_ERROR_NO_HARDWARE";
const BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED =
  "BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED";
const BIOMETRIC_ERROR_UNSUPPORTED = "BIOMETRIC_ERROR_UNSUPPORTED";
// const BIOMETRIC_STATUS_UNKNOWN = "BIOMETRIC_STATUS_UNKNOWN";

// Android BiometricPrompt
const ERROR_CANCELED = "ERROR_CANCELED";
const ERROR_HW_NOT_PRESENT = "ERROR_HW_NOT_PRESENT";
const ERROR_HW_UNAVAILABLE = "ERROR_HW_UNAVAILABLE";
const ERROR_LOCKOUT = "ERROR_LOCKOUT";
const ERROR_LOCKOUT_PERMANENT = "ERROR_LOCKOUT_PERMANENT";
const ERROR_NEGATIVE_BUTTON = "ERROR_NEGATIVE_BUTTON";
const ERROR_NO_BIOMETRICS = "ERROR_NO_BIOMETRICS";
const ERROR_NO_DEVICE_CREDENTIAL = "ERROR_NO_DEVICE_CREDENTIAL";
// const ERROR_NO_SPACE = "ERROR_NO_SPACE";
const ERROR_SECURITY_UPDATE_REQUIRED = "ERROR_SECURITY_UPDATE_REQUIRED";
// const ERROR_TIMEOUT = "ERROR_TIMEOUT";
// const ERROR_UNABLE_TO_PROCESS = "ERROR_UNABLE_TO_PROCESS";
const ERROR_USER_CANCELED = "ERROR_USER_CANCELED";
// const ERROR_VENDOR = "ERROR_VENDOR";

// on iOS
// {
//     "errorMessage": "CANCEL",
//     "message": "CANCEL",
//     "data": {
//         "cause": {
//             "code": 1,
//             "userInfo": {},
//             "domain": "com.apple.AuthenticationServices.WebAuthenticationSession"
//         }
//     },
//     "code": "CANCEL"
// }
//
// on Android
// {
//     "message": "CANCEL",
//     "code": "CANCEL",
//     "data": undefined
// }

/**
 * @internal
 */
export interface PlatformError {
  message: string;
  code: string;
}

/**
 * @internal
 */
export interface PlatformErrorIOSWithCause extends PlatformError {
  data: {
    cause: {
      domain: string;
      code: number;
      userInfo?: unknown;
    };
  };
}

/**
 * @internal
 */
export function isPlatformError(e: unknown): e is PlatformError {
  return typeof e === "object" && e != null && "message" in e && "code" in e;
}

/**
 * @internal
 */
export function isPlatformErrorIOS(e: unknown): e is PlatformErrorIOSWithCause {
  return (
    isPlatformError(e) &&
    "data" in e &&
    typeof (e as any).data === "object" &&
    (e as any).data != null &&
    "cause" in (e as any).data
  );
}

/**
 * BiometricPrivateKeyNotFoundError means the biometric has changed so that
 * the private key has been invalidated.
 *
 * @public
 */
export class BiometricPrivateKeyNotFoundError extends AuthgearError {}

/**
 * BiometricNotSupportedOrPermissionDeniedError means this device does not support biometric,
 * or the user has denied the usage of biometric.
 *
 * @public
 */
export class BiometricNotSupportedOrPermissionDeniedError extends AuthgearError {}

/**
 * BiometricNoPasscodeError means the device does not have a passcode.
 * You should prompt the user to setup a password for their device.
 *
 * @public
 */
export class BiometricNoPasscodeError extends AuthgearError {}

/**
 * BiometricNoEnrollmentError means the user has not setup biometric.
 * You should prompt the user to do so.
 *
 * @public
 */
export class BiometricNoEnrollmentError extends AuthgearError {}

/**
 * BiometricLockoutError means the biometric is locked due to too many failed attempts.
 *
 * @public
 */
export class BiometricLockoutError extends AuthgearError {}

type _ErrorIdentificationFunction = (e: unknown) => boolean;

const _errorMappings: [_ErrorIdentificationFunction, typeof AuthgearError][] = [
  [_isBiometricPrivateKeyNotFoundError, BiometricPrivateKeyNotFoundError],
  [_isBiometricCancel, CancelError],
  [
    _isBiometricNotSupportedOrPermissionDeniedError,
    BiometricNotSupportedOrPermissionDeniedError,
  ],
  [_isBiometricNoEnrollmentError, BiometricNoEnrollmentError],
  [_isBiometricNoPasscodeError, BiometricNoPasscodeError],
  [_isBiometricLockoutError, BiometricLockoutError],
  [_isCancel, CancelError],
];

/**
 * @internal
 */
export function _wrapError(e: unknown): unknown {
  for (const [f, cls] of _errorMappings) {
    if (f(e)) {
      const err = new cls();
      err.underlyingError = e;
      return err;
    }
  }
  const message = typeof e === "object" ? (e as any).message : "";
  const err = new AuthgearError(message);
  err.underlyingError = e;
  return err;
}

export function _isCancel(e: unknown): boolean {
  if (isPlatformError(e)) {
    return e.code === "CANCEL";
  }
  return false;
}

/**
 * @internal
 */
export function _isBiometricPrivateKeyNotFoundError(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.data.cause.domain === NSOSStatusErrorDomain &&
      e.data.cause.code === errSecItemNotFound
    );
  }
  if (isPlatformError(e)) {
    return (
      e.code === "android.security.keystore.KeyPermanentlyInvalidatedException"
    );
  }
  return false;
}

/**
 * @internal
 */
export function _isBiometricCancel(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      (e.data.cause.domain === kLAErrorDomain &&
        e.data.cause.code === kLAErrorUserCancel) ||
      (e.data.cause.domain === NSOSStatusErrorDomain &&
        e.data.cause.code === errSecUserCanceled)
    );
  }
  if (isPlatformError(e)) {
    return (
      e.code === ERROR_CANCELED ||
      e.code === ERROR_NEGATIVE_BUTTON ||
      e.code === ERROR_USER_CANCELED
    );
  }
  return false;
}

/**
 * @internal
 */
export function _isBiometricNotSupportedOrPermissionDeniedError(
  e: unknown
): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.data.cause.domain === kLAErrorDomain &&
      e.data.cause.code === kLAErrorBiometryNotAvailable
    );
  }
  if (isPlatformError(e)) {
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
 * @internal
 */
export function _isBiometricNoEnrollmentError(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.data.cause.domain === kLAErrorDomain &&
      e.data.cause.code === kLAErrorBiometryNotEnrolled
    );
  }
  if (isPlatformError(e)) {
    return (
      e.code === BIOMETRIC_ERROR_NONE_ENROLLED || e.code === ERROR_NO_BIOMETRICS
    );
  }
  return false;
}

/**
 * @internal
 */
export function _isBiometricNoPasscodeError(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.data.cause.domain === kLAErrorDomain &&
      e.data.cause.code === kLAErrorPasscodeNotSet
    );
  }
  if (isPlatformError(e)) {
    return e.code === ERROR_NO_DEVICE_CREDENTIAL;
  }
  return false;
}

/**
 * @internal
 */
export function _isBiometricLockoutError(e: unknown): boolean {
  if (isPlatformErrorIOS(e)) {
    return (
      e.data.cause.domain === kLAErrorDomain &&
      e.data.cause.code === kLAErrorBiometryLockout
    );
  }
  if (isPlatformError(e)) {
    return e.code === ERROR_LOCKOUT || e.code === ERROR_LOCKOUT_PERMANENT;
  }
  return false;
}
