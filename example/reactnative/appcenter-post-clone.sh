#!/usr/bin/env bash

cd ../..
npm ci
npm run lerna bootstrap
npm run build

# The node_modules folder is not needed after build
# When installing dependencies of react-native app, all files of
# authgear-react-native folder are copied including its node_modules folder.
# The node_modules folder consist of some symbolic links files which are created
# by lerna.
# The symbolic links paths become incorrect after copying to react-native node_modules.
# In App Center distribute stage, app center scan all files in react-native app
# node_modules directory and cause no such file error when scan those symbolic
# links files.
# So we have to remove it
rm -r ./packages/authgear-react-native/node_modules/
