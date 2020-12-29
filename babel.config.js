var plugins = [
  "@babel/plugin-transform-typescript",
  "@babel/plugin-proposal-class-properties",
  [
    "@babel/plugin-transform-for-of",
    {
      assumeArray: true,
    },
  ],
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
  loose: true,
  debug: false,
  useBuiltIns: false,
  exclude: ["@babel/plugin-transform-for-of"],
};

if (process.env.NODE_ENV === "test") {
  plugins.push("@babel/plugin-transform-modules-commonjs");
  presetEnvOptions.targets = {
    node: "12",
  };
}

module.exports = {
  plugins,
  presets: [["@babel/preset-env", presetEnvOptions]],
};
