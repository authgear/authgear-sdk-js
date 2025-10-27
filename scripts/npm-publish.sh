#!/bin/sh

set -eux

if printf "%s\n" "$GITHUB_REF_NAME" | grep -E '^v[0-9.]+$'; then
	npm publish --access public --tag latest
else
	npm publish --access public --tag prerelease
fi
