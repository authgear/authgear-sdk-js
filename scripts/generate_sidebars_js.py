#!/usr/bin/env python3
import os
import os.path
import sys
import json

DIR = sys.argv[1]

def main():
    sidebar = {
        "root": [
            {
                "type": "doc",
                "id": "index",
            },
            {
                "type": "category",
                "label": "@skygear/web",
                "items": [
                    {
                        "type": "doc",
                        "id": "web/index",
                    },
                    {
                        "type": "category",
                        "label": "Interfaces",
                        "items": [],
                    },
                    {
                        "type": "category",
                        "label": "Classes",
                        "items": [],
                    },
                ],
            },
            {
                "type": "category",
                "label": "@skygear/react-native",
                "items": [
                    {
                        "type": "doc",
                        "id": "react-native/index",
                    },
                    {
                        "type": "category",
                        "label": "Interfaces",
                        "items": [],
                    },
                    {
                        "type": "category",
                        "label": "Classes",
                        "items": [],
                    },
                ],
            },
        ]
    }
    for (dirpath, dirnames, filenames) in os.walk(DIR):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            # Remove DIR prefix
            relpath = os.path.relpath(filepath, DIR)
            # Remove extension
            relpath_noext, ext = os.path.splitext(relpath)
            # Ignore non-md files
            if ext != ".md":
                continue
            components = relpath_noext.split(os.sep)
            # We expect <package>/<kind>/<name>
            if len(components) != 3:
                continue
            package, kind, name = components

            if package == "web":
                i = 1
            elif package == "react-native":
                i = 2
            else:
                raise TypeError(f"unexpected package {package}")

            if kind == "interfaces":
                j = 1
            elif kind == "classes":
                j = 2
            else:
                raise TypeError(f"unexpected kind {typ}")

            sidebar["root"][i]["items"][j]["items"].append(relpath_noext)

    sidebar_json = json.dumps(sidebar, ensure_ascii=False, indent="  ")
    sidebar_js = "module.exports = " + sidebar_json + ";"
    print(sidebar_js)


if __name__ == "__main__":
    main()
