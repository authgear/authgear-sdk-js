import {
  NativeModules,
  Platform,
  NativeEventEmitter,
  DeviceEventEmitter,
  EventEmitter,
} from "react-native";

export default Platform.select<EventEmitter>({
  ios: new NativeEventEmitter(NativeModules.AuthgearManager),
  android: DeviceEventEmitter,
});
