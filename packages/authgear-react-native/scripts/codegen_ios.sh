#!/bin/sh

set -eux

# RN >=0.82 crashes in readGeneratedAutolinkingOutput when --outputPath is
# omitted (it resolves path.resolve(undefined, ...) before falling back to
# codegenConfig.outputDir). Pass it explicitly to work around the regression;
# this matches the path codegen would have computed from outputDir anyway.
outputDir="$(jq <./package.json --raw-output '.codegenConfig.outputDir.ios')"
npx @react-native-community/cli codegen --platform ios --source library --outputPath "$outputDir"

# If you read the official guide of iOS native module https://reactnative.dev/docs/turbo-native-modules-introduction
# You will see that it asks you to reference the generated header with `#import <AuthgearReactNativeSpec/AuthgearReactNativeSpec.h>`
# But that does not work if the generated header is pre-generated and distributed with the library.
#
# So we patched the generated code so that the generated code lives at the root of the outputDir,
# and we changed our code to reference the header with `#import "AuthgearReactNativeSpec.h"`.
#
# RN >=0.83 additionally nests everything one level deeper under a `ReactCodegen/`
# directory, and no longer emits a separate AuthgearReactNativeSpecJSI-generated.cpp
# (the JSI glue is now a header-only template in AuthgearReactNativeSpecJSI.h).
mv "$outputDir/ReactCodegen/AuthgearReactNativeSpecJSI.h" "$outputDir/AuthgearReactNativeSpecJSI.h"
mv "$outputDir/ReactCodegen/AuthgearReactNativeSpec/AuthgearReactNativeSpec.h" "$outputDir/AuthgearReactNativeSpec.h"
mv "$outputDir/ReactCodegen/AuthgearReactNativeSpec/AuthgearReactNativeSpec-generated.mm" "$outputDir/AuthgearReactNativeSpec-generated.mm"
rm -f "$outputDir/AuthgearReactNativeSpecJSI-generated.cpp"
rmdir "$outputDir/ReactCodegen/AuthgearReactNativeSpec/"
rmdir "$outputDir/ReactCodegen/"
