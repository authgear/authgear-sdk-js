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
      label: "@skygear/web",
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
      ],
    },
    {
      type: "category",
      label: "@skygear/react-native",
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
        i = 1;
      } else if (package == "react-native") {
        i = 2;
      } else {
        throw new Error("unexpected package " + package);
      }

      let j;
      if (kind === "interfaces") {
        j = 1;
      } else if (kind == "classes") {
        j = 2;
      } else {
        throw new Error("unexpected kind " + kind);
      }

      sidebar["root"][i]["items"][j]["items"].push(noext);
    }
  }
}

recur(DIR);

console.log("module.exports = " + JSON.stringify(sidebar, null, 2) + ";");
