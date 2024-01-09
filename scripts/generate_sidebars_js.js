const fs = require("fs");
const path = require("path");

const DIR = process.argv[2];

const sidebar = {
  root: [
    {
      type: "doc",
      id: "index",
    },
    {
      type: "category",
      label: "@authgear/web",
      items: [
        {
          type: "doc",
          id: "web/index",
        },
        {
          type: "category",
          label: "Interfaces",
          items: [],
        },
        {
          type: "category",
          label: "Classes",
          items: [],
        },
        {
          type: "category",
          label: "Enums",
          items: [],
        },
      ],
    },
    {
      type: "category",
      label: "@authgear/react-native",
      items: [
        {
          type: "doc",
          id: "react-native/index",
        },
        {
          type: "category",
          label: "Interfaces",
          items: [],
        },
        {
          type: "category",
          label: "Classes",
          items: [],
        },
        {
          type: "category",
          label: "Enums",
          items: [],
        },
      ],
    },
    {
      type: "category",
      label: "@authgear/capacitor",
      items: [
        {
          type: "doc",
          id: "capacitor/index",
        },
        {
          type: "category",
          label: "Interfaces",
          items: [],
        },
        {
          type: "category",
          label: "Classes",
          items: [],
        },
        {
          type: "category",
          label: "Enums",
          items: [],
        },
      ],
    },
  ],
};

function splitext(p) {
  const ext = path.extname(p);
  const dirname = path.dirname(p);
  const basename = path.basename(p, ext);
  const noext = path.join(dirname, basename);
  return {
    noext,
    ext,
  };
}

function indexForPackage(packageName) {
  return sidebar.root.findIndex(
    (a) => a.label != null && a.label === packageName
  );
}

const WEB_PACKAGE_INDEX = indexForPackage("@authgear/web");
const REACT_NATIVE_PACKAGE_INDEX = indexForPackage("@authgear/react-native");
const CAPACITOR_PACKAGE_INDEX = indexForPackage("@authgear/capacitor");

function indexForCategory(package, categoryLabel) {
  return package.items.findIndex(
    (a) =>
      a.label != null && a.label.toLowerCase() === categoryLabel.toLowerCase()
  );
}

function recur(dir) {
  const entries = fs.readdirSync(dir, {
    encoding: "utf8",
    withFileTypes: true,
  });
  for (const entry of entries) {
    const filepath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      recur(filepath);
    } else if (entry.isFile()) {
      const relpath = path.relative(DIR, filepath);
      const { noext, ext } = splitext(relpath);
      // Ignore non-md files
      if (ext !== ".md") {
        continue;
      }

      const components = noext.split(path.sep);
      // We expect <package>/<kind>/<name>
      if (components.length != 3) {
        continue;
      }

      const [package, kind, name] = components;

      let i;
      if (package === "web") {
        i = WEB_PACKAGE_INDEX;
      } else if (package == "react-native") {
        i = REACT_NATIVE_PACKAGE_INDEX;
      } else if (package == "capacitor") {
        i = CAPACITOR_PACKAGE_INDEX;
      } else {
        throw new Error("unexpected package " + package);
      }

      const j = indexForCategory(sidebar.root[i], kind);
      if (j < 0) {
        throw new Error("unexpected kind " + kind);
      }

      sidebar.root[i].items[j].items.push(noext);
    }
  }
}

recur(DIR);

console.log("module.exports = " + JSON.stringify(sidebar, null, 2) + ";");
