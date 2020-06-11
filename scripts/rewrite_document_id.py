#!/usr/bin/env python3
import os
import os.path
import sys
import json

DIR = sys.argv[1]

def main():
    for (dirpath, dirnames, filenames) in os.walk(DIR):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            relpath = os.path.relpath(filepath, DIR)
            relpath_noext, ext = os.path.splitext(relpath)
            # Ignore non-md files
            if ext != ".md":
                continue
            with open(filepath, "r") as f:
                data = f.read()
            lines = [line for line in data.split("\n") if not line.startswith("id: ")]
            with open(filepath, "w") as f:
                for line in lines:
                    print(line, file=f)


if __name__ == "__main__":
    main()
