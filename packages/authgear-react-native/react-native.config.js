module.exports = {
  dependency: {
    platforms: {
      android: {
        // See https://reactnative.dev/docs/the-new-architecture/codegen-cli#enabling-includesgeneratedcode
        // See https://github.com/reactwg/react-native-new-architecture/blob/main/docs/codegen.md#including-generated-code-into-libraries
        cmakeListsPath: "./android/src/main/jni/CMakeLists.txt",
      },
    },
  },
};
