const path = require("path");
const fs = require("fs");

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
