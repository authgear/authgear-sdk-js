#!/bin/sh

set -eux

npx @react-native-community/cli codegen --platform ios --source library
