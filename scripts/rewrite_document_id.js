const fs = require("fs");
const path = require("path");

const DIR = process.argv[2];

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
      const ext = path.extname(relpath);
      // Ignore non-md files
      if (ext !== ".md") {
        continue;
      }

      let content = fs.readFileSync(filepath, {
        encoding: "utf8",
        flag: "r",
      });
      let lines = content.split("\n");
      lines = lines.filter((line) => !line.startsWith("id: "));
      content = lines.join("\n") + "\n";
      fs.writeFileSync(filepath, content);
    }
  }
}

recur(DIR);
