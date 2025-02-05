import { NativeModules, Platform, NativeEventEmitter } from "react-native";

export default new NativeEventEmitter(
  Platform.OS === "ios" ? NativeModules.AuthgearReactNative : undefined
);
