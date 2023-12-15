import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.authgear.sdk.exampleapp.capacitor",
  appName: "AuthgearCapacitor",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
