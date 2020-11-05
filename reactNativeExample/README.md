# Authgear React Native Demo App

This app is for demonstrating the usage of functions supportted by @authgear/react-native SDK.

# Initial setup

## Prerequisite

Please make sure the sdk is built by running

```bash
npm run build
```

in project root in **authgear-sdk-js** repo

## Install dependencies

```bash
# In root of React Native demo app
yarn
```

## Start Metro server

```bash
# In root of React Native demo app
yarn start
```

NOTE: the server is started on port 8082 instead of the default 8081 as it is taken by Authgear server

## Build Android app

As we need to configure the port for metro server, we can

1. Run command `npx react-native run-android --port 8082`

or

2. Change the default port number in corresponding node module, then build in Android Studio
   i. go to file `node_modules/@react-native-community/cli-platform-android/build/commands/runAndroid/index.js`
   ii. replace `default: process.env.RCT_METRO_PORT || 8081` with `default: process.env.RCT_METRO_PORT || 8082`
   iii. click `Run` in Android Studio (play button)

## Build iOS App

1. Install CocoaPods dependencies

```bash
cd ios
pod install
```

NOTE: make sure you enabled XCode command line tools (XCode Preference -> Location -> Command Line Tools)

2. Configure `Signing and Capabilities` in XCode for signing the app

3. Click `Build` button in XCode (play button)

# Key points for setting up your React Native app with Authgear

## Deep-link / custom scheme (for redirection back to app after authorization)

For iOS:
Refers to Info.plist (in XCode -> Project -> Info -> URL Types) in demo app

For Android:
Refers to AndroidManifest.xml in demo app
