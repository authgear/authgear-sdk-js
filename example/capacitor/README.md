# Ionic Capacitor Example App

Example app of ionic app using capacitor.

## Project config

We need the following redirect uris to work:

```
http://localhost:8100/reauth-redirect
http://localhost:8100/oauth-redirect
com.authgear.exampleapp.capacitor://host/path
https://localhost
capacitor://localhost
```

## Run the app

Before running the app, build the latest sdk at project root.

```sh
npm i
npm run build
```

Then, in this directory, run the exmaple app.

```sh
cd example/capacitor
npm i
# Run it in ios device
npm run run-ios
# OR, run it in android device
npm run run-android
```
