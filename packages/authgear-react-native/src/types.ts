import { SessionStateChangeReason } from "@authgear/core";
import { ReactNativeContainer } from ".";

/**
 * @public
 */
export interface ReactNativeContainerDelegate {
  /**
   * This callback will be called when the session state is changed.
   *
   * For example, when the user logs out, the new state is "NO_SESSION"
   * and the reason is "LOGOUT".
   *
   * @public
   */
  onSessionStateChange: (
    container: ReactNativeContainer,
    reason: SessionStateChangeReason
  ) => void;

  /**
   * This callback will be called when user click login with WeChat in
   * react-native.
   *
   * Developer should implement this function to use WeChat SDK to
   * obtain WeChat authentication code. After obtaining the code, developer
   * should call weChatAuthCallback with code and state to complete the
   * WeChat login.
   *
   * @public
   */
  sendWeChatAuthRequest(state: string): void;
}

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
