import AuthgearReactNative from "./NativeAuthgearReactNative";
import {
  EventSubscription,
  NativeModules,
  Platform,
  NativeEventEmitter,
} from "react-native";

let legacyNativeEventEmitter: NativeEventEmitter | undefined;

export function onAuthgearReactNative(
  listener: (args: { invocationID: string; url: string }) => void
): EventSubscription {
  // The New Architecture
  if (typeof AuthgearReactNative.onAuthgearReactNative === "function") {
    return AuthgearReactNative.onAuthgearReactNative(listener);
  }
  // The old Architecture
  if (legacyNativeEventEmitter == null) {
    legacyNativeEventEmitter = new NativeEventEmitter(
      Platform.OS === "ios" ? NativeModules.AuthgearReactNative : undefined
    );
  }
  return legacyNativeEventEmitter.addListener(
    "onAuthgearReactNative",
    listener
  );
}
