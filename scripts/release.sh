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

# Update the lock files in example apps to match VERSION.
(set -eu; cd example/reactweb; npm install)
(set -eu; cd example/reactnative; yarn install)
(set -eu; cd example/capacitor; npm install)
(set -eu; cd example/reactnative/ios; bundle exec pod install)
(set -eu; cd example/capacitor/ios/App; bundle exec pod install)

git tag -a v"$VERSION" -s -m "Release v$VERSION"
# The main branch is now protected. We cannot push to it directly.
# git push git@github.com:authgear/authgear-sdk-js.git "$GIT_BRANCH"
git push git@github.com:authgear/authgear-sdk-js.git v"$VERSION"

(set -eu; cd packages/authgear-web; npm publish --access public)
(set -eu; cd packages/authgear-react-native; npm publish --access public)
(set -eu; cd packages/authgear-capacitor; npm publish --access public)
