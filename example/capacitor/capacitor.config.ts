import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.authgear.sdk.exampleapp.capacitor",
  appName: "AuthgearCapacitor",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    // Allow loading from http: during development.
    // See https://capacitorjs.com/docs/config
    allowMixedContent: true,
  },
};

export default config;
