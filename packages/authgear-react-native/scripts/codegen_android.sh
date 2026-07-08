#!/bin/sh

# Due to this bug https://github.com/facebook/react-native/issues/45079
# we have to patch the generated code.
# Otherwise the generated code does not respect javaPackageName.

# Fail fast when the codegen command has changes in its behavior.
set -eux

# RN >=0.82 crashes in readGeneratedAutolinkingOutput when --outputPath is
# omitted (it resolves path.resolve(undefined, ...) before falling back to
# codegenConfig.outputDir). Pass it explicitly to work around the regression;
# this matches the path codegen would have computed from outputDir anyway.
outputDirAndroid="$(jq <./package.json --raw-output '.codegenConfig.outputDir.android')"
npx @react-native-community/cli codegen --platform android --source library --outputPath "$outputDirAndroid"

codegenConfigName="$(jq <./package.json --raw-output '.codegenConfig.name')"
javaPackageName="$(jq <./package.json --raw-output '.codegenConfig.android.javaPackageName')"
javaPackagePath="$(printf "%s" "$javaPackageName" | tr '.' '/')"

# Fix the package statement, and write to a correct place.
sed "s/^package com.facebook.fbreact.specs;/package $javaPackageName;/" "./android/src/main/java/com/facebook/fbreact/specs/Native${codegenConfigName}.java" > "./android/src/main/java/$javaPackagePath/Native${codegenConfigName}.java"
# Remove the incorrectly generated file.
rm -r "./android/src/main/java/com/facebook"
