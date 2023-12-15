import { readFileSync } from "fs";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const getBuiltins = require("builtins");

const extensions = [".mjs", ".js", ".jsx", ".ts", ".tsx"];

const plugins = [
  replace({
    preventAssignment: true,
    values: {
      "process.env.VERSION": JSON.stringify(process.env.VERSION || "VERSION"),
    },
  }),
  resolve({
    extensions,
  }),
  commonjs({
    include: ["node_modules/**", "packages/**/node_modules/**"],
  }),
  babel({
    extensions,
    exclude: ["node_modules/**", "packages/**/node_modules/**"],
    babelHelpers: "runtime",
  }),
  json({
    preferConst: true,
    indent: "  ",
  }),
];

// This function is the external function of rollup configuration.
// The effect is to tell rollup to treat @babel/* depdendencies as external.
// The main purpose to is debug bundle content.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function makeBabelExternal(id) {
  return /^@babel/.test(id);
}

function makeReactNativeExternal() {
  const reactNativePackageJSONString = readFileSync(
    "packages/authgear-react-native/package.json",
    { encoding: "utf8" }
  );
  const reactNativePackageJSON = JSON.parse(reactNativePackageJSONString);

  const deps = Object.keys(reactNativePackageJSON["dependencies"] || {});
  if (deps.length > 0) {
    throw new Error("@authgear/react-native should not have any depdendencies");
  }

  const peerDeps = Object.keys(
    reactNativePackageJSON["peerDependencies"] || []
  );

  function external(id) {
    return peerDeps.indexOf(id) >= 0;
  }

  return external;
}

function makeCapacitorExternal() {
  const packageJSONString = readFileSync(
    "packages/authgear-capacitor/package.json",
    { encoding: "utf8" }
  );
  const packageJSON = JSON.parse(packageJSONString);
  const deps = Object.keys(packageJSON["depdendencies"] || {});
  if (deps.length > 0) {
    throw new Error("@authgear/capacitor should not have any dependencies");
  }

  const peerDeps = Object.keys(packageJSON["peerDependencies"] || []);

  function external(id) {
    return peerDeps.indexOf(id) >= 0;
  }

  return external;
}

export default function makeConfig(commandLineArgs) {
  const configBundleType = commandLineArgs.configBundleType;
  switch (configBundleType) {
    case "iife":
      return {
        plugins,
        input: "packages/authgear-web/src/index.ts",
        output: {
          file: "packages/authgear-web/dist/authgear-web.iife.js",
          format: "iife",
          name: "authgear",
          exports: "named",
        },
      };
    case "web-cjs":
      return {
        plugins,
        input: "packages/authgear-web/src/index.ts",
        output: {
          file: "packages/authgear-web/dist/authgear-web.cjs.js",
          format: "cjs",
          exports: "named",
        },
        // external: makeBabelExternal,
      };
    case "web-module":
      return {
        plugins,
        input: "packages/authgear-web/src/index.ts",
        output: {
          file: "packages/authgear-web/dist/authgear-web.module.js",
          format: "esm",
        },
        // external: makeBabelExternal,
      };
    case "react-native":
      return {
        plugins,
        input: "packages/authgear-react-native/src/index.ts",
        output: {
          file: "packages/authgear-react-native/dist/authgear-react-native.js",
          format: "cjs",
          exports: "named",
        },
        external: makeReactNativeExternal(),
      };
    case "capacitor":
      return {
        input: "packages/authgear-capacitor/dist/esm/index.js",
        output: [
          {
            file: "packages/authgear-capacitor/dist/plugin.iife.js",
            format: "iife",
            name: "authgearCapacitor",
            globals: {
              "@capacitor/core": "capacitorExports",
            },
            sourcemap: true,
            inlineDynamicImports: true,
          },
          {
            file: "packages/authgear-capacitor/dist/plugin.cjs.js",
            format: "cjs",
            sourcemap: true,
            inlineDynamicImports: true,
          },
        ],
        external: makeCapacitorExternal(),
      };
    default:
      throw new Error("unknown bundle type: " + configBundleType);
  }
}
