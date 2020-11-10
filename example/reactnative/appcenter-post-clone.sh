#!/usr/bin/env bash

# install dependencies for React Native SDK
cd ../../packages/authgear-react-native
npm install
popd
# install dependencies for Web SDK
cd ../../packages/authgear-web
npm install
popd
# to SDK project root
cd ../..
# install dependencies
npm install
# build authgear JS SDK
npm run build
