// This script does the following:
// 1. Take the 1st positional argument, and assume it to be the version we want to set.
// 2. Update all packages/*/package.json and the lock files with this version.
// 3. Update ./packages/authgear-core/src/index.ts VERSION variable.
// 4. Build the project once.
// 5. Run `npm install` or `yarn install` in the ./example/* to update the lock files.
// 6. Run `bundle exec pod install` to update the lock files.
//
// The goal of this script is to ensure all files are consistent with the given version.

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");

const version = process.argv[2];

const cwd = process.cwd();

function readPackageJSON(relativePath) {
  const p = path.join(cwd, relativePath);
  const s = fs.readFileSync(p, { encoding: "utf-8" });
  return JSON.parse(s);
}

function writePackageJSON(relativePath, packageJSON) {
  const s = JSON.stringify(packageJSON, null, 2) + "\n";
  fs.writeFileSync(relativePath, s);
}

function setPackageVersion(packageJSON) {
  packageJSON["version"] = version;
}

function setDepsVersion(packageJSON, packageNames, depsKey) {
  const deps = packageJSON[depsKey];
  if (deps != null) {
    for (const key of Object.keys(deps)) {
      if (packageNames.indexOf(key) >= 0) {
        deps[key] = version;
      }
    }
  }
}

const toBeWritten = [];
const rootPackageJSON = readPackageJSON("package.json");
toBeWritten.push({
  path: "package.json",
  packageJSON: rootPackageJSON,
});
const workspacePackageJSONs = [];

for (const workspace of rootPackageJSON["workspaces"]) {
  const p = path.join(workspace, "package.json");
  const packageJSON = readPackageJSON(p);
  workspacePackageJSONs.push(packageJSON);
  toBeWritten.push({
    path: p,
    packageJSON,
  });
}

const workspacePackageNames = workspacePackageJSONs.map((a) => a["name"]);

for (const packageJSON of workspacePackageJSONs) {
  setPackageVersion(packageJSON);
  setDepsVersion(packageJSON, workspacePackageNames, "dependencies");
  setDepsVersion(packageJSON, workspacePackageNames, "devDependencies");
}

for (const a of toBeWritten) {
  writePackageJSON(a.path, a.packageJSON);
}

// Update source code.
assert.equal(
  child_process.spawnSync(
    `sed -E 's/^export const VERSION.*/export const VERSION = "${version}";/' ./packages/authgear-core/src/index.ts > ./packages/authgear-core/src/index.ts.new`,
    {
      cwd,
      stdio: "inherit",
      shell: true,
    }
  ).status,
  0
);
assert.equal(
  child_process.spawnSync(
    "mv",
    [
      "./packages/authgear-core/src/index.ts.new",
      "./packages/authgear-core/src/index.ts",
    ],
    {
      cwd,
      stdio: "inherit",
    }
  ).status,
  0
);

// Build
assert.equal(
  child_process.spawnSync("npm", ["run", "build"], {
    cwd: cwd,
    stdio: "inherit",
  }).status,
  0
);

assert.equal(
  child_process.spawnSync("npm", ["install"], {
    cwd: path.join(cwd, "./example/reactweb"),
    stdio: "inherit",
  }).status,
  0
);

assert.equal(
  child_process.spawnSync("rm", ["-rf", "node_modules/"], {
    cwd: path.join(cwd, "./example/reactnative/"),
    stdio: "inherit",
  }).status,
  0
);
assert.equal(
  child_process.spawnSync("yarn", ["install"], {
    cwd: path.join(cwd, "./example/reactnative/"),
    stdio: "inherit",
  }).status,
  0
);
assert.equal(
  child_process.spawnSync("bundle", ["exec", "pod", "install"], {
    cwd: path.join(cwd, "./example/reactnative/ios"),
    stdio: "inherit",
  }).status,
  0
);

assert.equal(
  child_process.spawnSync("npm", ["install", "--force"], {
    cwd: path.join(cwd, "./example/capacitor/"),
    stdio: "inherit",
  }).status,
  0
);
assert.equal(
  child_process.spawnSync("bundle", ["exec", "pod", "install"], {
    cwd: path.join(cwd, "./example/capacitor/ios/App"),
    stdio: "inherit",
  }).status,
  0
);
