# Authgear SDK for JavaScript

[![@authgear/web](https://img.shields.io/npm/v/@authgear/web.svg?label=@authgear/web)](https://www.npmjs.com/package/@authgear/web)
[![@authgear/web](https://img.shields.io/npm/dt/@authgear/web.svg?label=@authgear/web)](https://www.npmjs.com/package/@authgear/web)
[![@authgear/react-native](https://img.shields.io/npm/v/@authgear/react-native.svg?label=@authgear/react-native)](https://www.npmjs.com/package/@authgear/react-native)
[![@authgear/react-native](https://img.shields.io/npm/dt/@authgear/react-native.svg?label=@authgear/react-native)](https://www.npmjs.com/package/@authgear/react-native)
![License](https://img.shields.io/badge/license-Apache%202-blue)

## Documentation

View the API Reference at [https://authgear.github.io/authgear-sdk-js/](https://authgear.github.io/authgear-sdk-js/).

## Usage

### Web

```sh
$ npm install --save @authgear/web
```

### React Native

```sh
$ npm install --save @authgear/react-native
```

## Contributing

First, fork the repository.

```sh
$ git clone --branch master git@github.com:<myusername>/authgear-sdk-js.git
$ cd authgear-sdk-js
$ npm install
$ npm run lerna bootstrap
```

## Releasing

First, ensure `github-release` and `yarn` tool is installed.
Also, Git should be configured to be able to sign using GPG keys,
and npm should be logged in as appropriate user.

```sh
$ npm run prepare-new-release
# Edit the file new-release.
# It will be prepended to CHANGELOG.md
# So make sure the style is consistent.
$ vim new-release
$ GIT_USER=<github-username> GITHUB_TOKEN=<github-token> GIT_BRANCH=master VERSION=<new-version> ./scripts/release.sh
```
