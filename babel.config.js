var plugins = [
  "@babel/plugin-transform-typescript",
  "@babel/plugin-transform-runtime",
];

const presetEnvOptions = {
  // Use .browserslist by not specifying targets and ignoreBrowserslistConfig
  // During testing, however, we want specify targets so that no polyfill is required.

  // Enable optimization https://babeljs.io/docs/en/babel-preset-env#bugfixes
  bugfixes: true,
  // Keep module syntax untouched.
  // During build, rollup handles module for us.
  // During testing, we use plugin-transform-modules-commonjs.
  modules: false,
  debug: false,
  useBuiltIns: false,
};

if (process.env.NODE_ENV === "test") {
  plugins.push("@babel/plugin-transform-modules-commonjs");
  presetEnvOptions.targets = {
    node: "12",
  };
}

module.exports = {
  assumptions: {
    arrayLikeIsIterable: false,
    constantReexports: true,
    constantSuper: true,
    enumerableModuleMeta: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: false,
    iterableIsArray: true,
    mutableTemplateObject: true,
    noClassCalls: true,
    noDocumentAll: true,
    noIncompleteNsImportDetection: false,
    noNewArrows: true,
    objectRestNoSymbols: true,
    pureGetters: true,
    setClassMethods: true,
    setComputedProperties: true,
    setPublicClassFields: true,
    setSpreadProperties: true,
    skipForOfIteratorClosing: false,
    superIsCallableConstructor: false,
  },
  plugins,
  presets: [["@babel/preset-env", presetEnvOptions]],
};
