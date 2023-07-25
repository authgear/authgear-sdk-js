<div align="center">

[![Authgear banner](./.github/assets/banner.png)](https://www.authgear.com/)

</div>

# Authgear SDK for Single Page Applications (SPA)

[![@authgear/web](https://img.shields.io/npm/v/@authgear/web.svg?label=@authgear/web)](https://www.npmjs.com/package/@authgear/web)
[![@authgear/web](https://img.shields.io/npm/dt/@authgear/web.svg?label=@authgear/web)](https://www.npmjs.com/package/@authgear/web)
[![@authgear/react-native](https://img.shields.io/npm/v/@authgear/react-native.svg?label=@authgear/react-native)](https://www.npmjs.com/package/@authgear/react-native)
[![@authgear/react-native](https://img.shields.io/npm/dt/@authgear/react-native.svg?label=@authgear/react-native)](https://www.npmjs.com/package/@authgear/react-native)
![License](https://img.shields.io/badge/license-Apache%202-blue)

With Authgear SDK for Single Page Applications (SPA), you can easily integrate authentication features into your app (Angular, Vue, React, or any JavaScript websites).
In most cases, it involves just **a few lines of code** to enable **multiple authentication methods**, such as [social logins](https://www.authgear.com/features/social-login), [passwordless](https://www.authgear.com/features/passwordless-authentication), [biometrics logins](https://www.authgear.com/features/biometric-authentication), [one-time-password (OTP)](https://www.authgear.com/features/whatsapp-otp) with SMS/WhatsApp, and multi-factor authentication (MFA).

**Quick links** - 📚 [Documentation](#documentation) 🏁 [Getting Started](#getting-started) 🛠️ [Troubleshooting](#troubleshooting)
👥 [Contributing](#troubleshooting)

## What is Authgear?

[Auhgear](https://www.authgear.com/) is a highly adaptable identity-as-a-service (IDaaS) platform for web and mobile applications.
Authgear makes user authentication easier and faster to implement by integrating it into various types of applications - from single-page web apps to mobile applications to API services.

### Key Features

- Zero trust authentication architecture with [OpenID Connect](https://openid.net/developers/how-connect-works/) (OIDC) standard.
- Easy-to-use interfaces for user registration and login, including email, phone, username as login ID, and password, OTP, magic links, etc for authentication.
- Support a wide range of identity providers, such as [Google](https://developers.google.com/identity), [Apple](https://support.apple.com/en-gb/guide/deployment/depa64848f3a/web), and [Azure Active Directory](https://azure.microsoft.com/en-gb/products/active-directory/) (AD).
- Support biometric login on mobile, Passkeys, and Multi-Factor Authentication (MFA) such as SMS/email-based verification and authenticator apps with TOTP.

## Documentation

- View the SDK API Reference at [https://authgear.github.io/authgear-sdk-js/](https://authgear.github.io/authgear-sdk-js/).
- Learn how to manage your users through [Admin API](https://docs.authgear.com/reference/apis/admin-api).

View other Authgear Documentation at [https://docs.authgear.com/](https://docs.authgear.com/)

## Getting Started

Follow the easy steps to start using it:

- [Getting started with Authgear SDK](https://docs.authgear.com/get-started/single-page-app/website)

## Troubleshooting

Please check out our [Get help](https://github.com/orgs/authgear/discussions/categories/get-help) to get solutions for common installation problems and other issues.

### Raise an issue

To provide feedback or report a bug, please [raise an issue on our issue tracker](https://github.com/authgear/authgear-sdk-js/issues).

## Contributing

Anyone who wishes to contribute to this project, whether documentation, features, bug fixes, code cleanup, testing, or code reviews, is very much encouraged to do so.

To join, just raise your hand on the [Authgear Discord server](https://discord.gg/Kdn5vcYwAS) (#trouble) or the GitHub Authgear's [discussion](https://github.com/orgs/authgear/discussions) board.

If you are unfamiliar with how to contribute to GitHub projects, here is a [Getting Started Guide](https://docs.github.com/en/get-started/quickstart/contributing-to-projects). A full set of contribution guidelines, along with templates, are in progress.

Or here is a quick way.

```sh
$ git clone --branch master git@github.com:<myusername>/authgear-sdk-js.git
$ cd authgear-sdk-js
$ npm ci
$ (cd website && yarn install --frozen-lockfile)
```

## Releasing

First, ensure these tools are installed:
- `yarn`
- [`github-release`](https://github.com/github-release/github-release)
- [`git-chglog`](https://github.com/git-chglog/git-chglog)

Also, Git should be configured to be able to sign using GPG keys,
and npm should be logged in as appropriate user.

```sh
# VERSION should be in format like "0.1.0"
$ GIT_USER=<github-username> GITHUB_TOKEN=<github-token> GIT_BRANCH=master VERSION=<new-version> ./scripts/release.sh
```

## Known issues

### Apple silicon

See https://github.com/facebook/react-native/issues/29605#issuecomment-861783673

## Supported and maintained by

<div align="center">
  <a href="https://github.com/authgear"><img src="https://uploads-ssl.webflow.com/60658b46b03f0cf83ac1485d/619e6607eb647619cecee2cf_authgear-logo.svg" /></a>
</div>

<p align="center">
  Auhgear is a highly adaptable identity-as-a-service (IDaaS) platform for web and mobile applications. To learn more checkout <a href="https://www.authgear.com/">website</a>
</p>
