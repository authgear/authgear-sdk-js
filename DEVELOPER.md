# Notes for developers working on this repository

## React Native New Architecture

> [!IMPORTANT]
> This section assumes you have basic understanding on support React Native New Architecture in a library.
> If you are not, please read:
> - https://github.com/reactwg/react-native-new-architecture/blob/main/docs/enable-libraries.md
> - https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/back-turbomodule-070
> - https://reactnative.dev/docs/the-new-architecture/codegen-cli
> - https://reactnative.dev/docs/the-new-architecture/codegen-cli#including-generated-code-into-libraries

Assume you have read the above materials, you should realize that we should enable `includesGeneratedCode`.

In the official documentation, `includesGeneratedCode=true` has one caveat though, quoted below:

> The generated code will use the React Native version defined inside your library.
> So if your library is shipping with React Native 0.76,
> the generated code will be based on that version.
> This could mean that the generated code is not compatible with apps using previous React Native version used by the app (e.g. an App running on React Native 0.75).

So I tried the following versions of React Native and invoke the codegen command, see any difference in the generated code.

- 0.76.9
  - We start with 0.76 because it is the first version with the New Architecture enabled by default.
  - However, this version does not come with the codegen command, so we cannot use it.
- 0.77.3
  - This is the first version that comes with the codegen command.
- 0.78.3
  - The generated code is the same as that of the previous version.
- 0.79.7
  - The generated code is the same as that of the previous version.
  - This is the first version [native events](https://reactnative.dev/docs/0.79/the-new-architecture/native-modules-custom-events) is documented. But the API is unstable.
- 0.80.2
  - The generated code is the same as that of the previous version.
  - This is the first version [native events](https://reactnative.dev/docs/0.80/the-new-architecture/native-modules-custom-events) become stable.
- 0.81.5
  - The generated `CMakeLists` references a new symbol `target_compile_reactnative_options`. Therefore, if the app is older than 0.81, it is incompatible.
- 0.82.1
  - The generated code is the same as that of the previous version.
  - As of 2025-10-22, this is the latest released version I can test.

Therefore, it follows that we should use the most compatible version to run codegen, that is **0.80.2**.

Due to the way that the codegen works, it is impossible to stop it from scanning our spec file.
If we use something that is too new in the spec file, for example, `CodegenTypes` introduced in 0.80,
then when the codegen runs in the app, the scanning will fail.

This implies the version we use for codegen indicates the minimum version of React Native our SDK requires.

## Important Notes

### You must resolve all warnings in AGAuthgearReactNative.mm

One common issue is that AGAuthgearReactNative does not actually conform to the generated spec.
But this is not a compilation error, rather a warning.

This warning will become a runtime crash only until a particular native method is called.

Common issues include

- The method labels mismatch, for example, it is `resolve` and `reject` in the spec, but it was `resolver` and `rejecter` in the implementation.
- The argument type mismatch, for example, when it is `number` in JavaScript, then the type is `double` in the spec.
  If you declare it to be `NSUInteger`, the `double` will be incorrectly cast to `NSUInteger`, resulting in a very large unsigned integer.

## FAQ

### Why do we need to install devDep `@react-native-community/cli` in `packages/authgear-react-native`?

It is because it provides the `codegen` command we use to run Codegen.

### Why do we need to install devDep `react-native` in `packages/authgear-react-native`?

It is because `@react-native-community/cli` is a driver only, it delegates to `@react-native/codegen`,
which is a dependency of `react-native`.
