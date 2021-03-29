/**
 * @public
 */
export type BiometricAccessConstraintIOS =
  | "biometryAny"
  | "biometryCurrentSet"
  | "userPresence";

/**
 * @public
 */
export interface BiometricPrivateKeyOptionsIOS {
  localizedReason: string;
  constraint: BiometricAccessConstraintIOS;
}

/**
 * @public
 */
export type BiometricAccessConstraintAndroid =
  | "BIOMETRIC_STRONG"
  | "DEVICE_CREDENTIAL";

/**
 * @public
 */
export interface BiometricPrivateKeyOptionsAndroid {
  title: string;
  subtitle: string;
  description: string;
  negativeButtonText: string;
  constraint: BiometricAccessConstraintAndroid[];
  invalidatedByBiometricEnrollment: boolean;
}

/**
 * @public
 */
export interface BiometricOptions {
  ios: BiometricPrivateKeyOptionsIOS;
  android: BiometricPrivateKeyOptionsAndroid;
}

/**
 * @public
 */
export interface BiometricPrivateKeyOptions extends BiometricOptions {
  kid: string;
  payload: {
    iat: number;
    exp: number;
    challenge: string;
    action: string;
    device_info: unknown;
  };
}
