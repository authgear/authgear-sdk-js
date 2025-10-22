#!/bin/sh

# Due to this bug https://github.com/facebook/react-native/issues/45079
# we have to patch the generated code.
# Otherwise the generated code does not respect javaPackageName.

# Fail fast when the codegen command has changes in its behavior.
set -eux

npx @react-native-community/cli codegen --platform android --source library

codegenConfigName="$(jq <./package.json --raw-output '.codegenConfig.name')"
javaPackageName="$(jq <./package.json --raw-output '.codegenConfig.android.javaPackageName')"
javaPackagePath="$(printf "%s" "$javaPackageName" | tr '.' '/')"

# Fix the package statement, and write to a correct place.
sed "s/^package com.facebook.fbreact.specs;/package $javaPackageName;/" "./android/src/main/java/com/facebook/fbreact/specs/Native${codegenConfigName}.java" > "./android/src/main/java/$javaPackagePath/Native${codegenConfigName}.java"
# Remove the incorrectly generated file.
rm -r "./android/src/main/java/com/facebook"
