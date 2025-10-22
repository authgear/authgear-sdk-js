#!/bin/sh

1>&2 printf "Checking tidiness...\n"

output="$(git status --porcelain)"

if [ -z "$output" ] || [ "$output" = " M .bundle/config" ]; then
	exit 0
fi

1>&2 printf "%s\n" "$output"
1>&2 printf "The above paths have changes.\n"
1>&2 printf "Here is the output of git diff.\n"
git diff --exit-code
