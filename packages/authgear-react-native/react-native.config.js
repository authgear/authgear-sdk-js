module.exports = {
  dependency: {
    platforms: {
      android: {
        // If relative path is used here, it IS NOT relative to this file.
        // Instead, it is observed that it is relative to ./android.
        // Therefore, the intended path is ./android/..android/src/main/jni/CMakeLists.txt =>
        // ./android/src/main/jni/CMakeLists.txt
        //
        // See https://reactnative.dev/docs/the-new-architecture/codegen-cli#enabling-includesgeneratedcode
        // See https://github.com/reactwg/react-native-new-architecture/blob/main/docs/codegen.md#including-generated-code-into-libraries
        // See https://github.com/facebook/react-native/blob/v0.80.2/packages/react-native-popup-menu-android/react-native.config.js#L12
        cmakeListsPath: "../android/src/main/jni/CMakeLists.txt",
      },
    },
  },
};
