#!/bin/sh

set -eu

if [ -z "$GIT_USER" ]; then
  echo >&2 "GIT_USER is required."
  exit 1
fi

if [ -z "$GIT_BRANCH" ]; then
  echo >&2 "GIT_BRANCH is required."
  exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo >&2 "GITHUB_TOKEN is required."
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo >&2 "VERSION is required."
  exit 1
fi

echo "Making github release and release commit..."

npm run set-version "$VERSION"
npm run clean
npm run format
npm run lint
npm run typecheck
npm run test
VERSION="$VERSION" npm run build

git-chglog --next-tag v"$VERSION" -o CHANGELOG.md
git add lerna.json CHANGELOG.md 'packages/*/package.json' 'packages/*/package-lock.json'
git commit -m "Update CHANGELOG for v$VERSION"
git tag -a v"$VERSION" -s -m "Release v$VERSION"
git push git@github.com:authgear/authgear-sdk-js.git "$GIT_BRANCH"
git push git@github.com:authgear/authgear-sdk-js.git v"$VERSION"

github-release release -u authgear -r authgear-sdk-js --draft --tag v"$VERSION" --name v"$VERSION" --description "$(git-chglog v$VERSION)"

(cd packages/authgear-web && npm publish --access public)
(cd packages/authgear-react-native && npm publish --access public)
