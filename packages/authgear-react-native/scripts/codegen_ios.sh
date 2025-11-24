#!/bin/sh

set -eux

npx @react-native-community/cli codegen --platform ios --source library

# If you read the official guide of iOS native module https://reactnative.dev/docs/turbo-native-modules-introduction
# You will see that it asks you to reference the generated header with `#import <AuthgearReactNativeSpec/AuthgearReactNativeSpec.h>`
# But that does not work if the generated header is pre-generated and distributed with the library.
#
# So we patched the generated code so that the generated code lives at the root of the outputDir,
# and we changed our code to reference the header with `#import "AuthgearReactNativeSpec.h"`.
outputDir="$(jq <./package.json --raw-output '.codegenConfig.outputDir.ios')"
mv "$outputDir/AuthgearReactNativeSpec/AuthgearReactNativeSpec.h" "$outputDir/AuthgearReactNativeSpec.h"
mv "$outputDir/AuthgearReactNativeSpec/AuthgearReactNativeSpec-generated.mm" "$outputDir/AuthgearReactNativeSpec-generated.mm"
rmdir "$outputDir/AuthgearReactNativeSpec/"
