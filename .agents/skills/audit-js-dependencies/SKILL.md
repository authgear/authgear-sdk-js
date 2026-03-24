---
name: audit-js-dependencies
description: Audit JavaScript and TypeScript dependencies across every directory in this repository that contains a package.json, using the correct install root for each project, apply non-breaking security upgrades, and stop to summarize any fixes that require a major-version change. Use when asked to run dependency audits, update vulnerable npm or yarn packages, reduce JavaScript dependency CVEs, or review whether vulnerable dependency fixes can be applied safely without breaking changes.
---

# Audit JS Dependencies

Use this skill to handle repo-wide JS dependency audits without double-auditing workspace members or blindly applying major upgrades.

## Audit Scope

Audit these install roots:

- `.` for the npm workspace root and all workspace members under `packages/authgear-core`, `packages/authgear-web`, `packages/authgear-react-native`, and `packages/authgear-capacitor`
- `example/reactweb`
- `example/reactnative`
- `example/capacitor`
- `website`

Do not run `npm audit` separately inside `packages/authgear-core`, `packages/authgear-web`, `packages/authgear-react-native`, or `packages/authgear-capacitor`. Those packages are installed and resolved by the repo root workspace and root `package-lock.json`.

Use these package managers:

- `.`: `npm`
- `example/reactweb`: `npm`
- `example/reactnative`: `yarn`
- `example/capacitor`: `npm`
- `website`: `npm`

## Workflow

1. Audit each install root with its existing package manager.
2. Apply only fixes that stay within the current major line unless the user explicitly asks for breaking upgrades.
3. Re-run audits after each change.
4. Run lightweight verification for each touched project.
5. If a fix requires a major bump, stop and report it instead of applying it.

## Audit Commands

Use these commands:

```bash
npm audit --json
npm outdated --json
```

```bash
yarn audit --json
yarn outdated --json
```

If dependencies are missing, install them with the package manager already used by that directory before auditing. Keep lockfiles aligned with the existing manager.

## Decide Whether A Fix Is Non-Breaking

Treat a fix as non-breaking only when at least one of these is true:

- `npm audit fix` or the package-manager equivalent resolves the issue without changing declared major versions
- The minimal fixed version stays in the same major line as the current declared dependency
- The package is transitive and can be fixed by a lockfile update or override/resolution that does not widen a package to a new major

Use registry metadata to verify the target version before changing manifests:

```bash
npm view <package> version versions --json
```

Check the current declared range in `package.json`, the vulnerable installed version from the audit report, and the minimum patched version. If the patched version requires a new major, do not apply it automatically.

Before adding any `overrides` or `resolutions`, check whether the existing declared range already allows a patched version. If it does, prefer a lockfile-only update via `npm audit fix`, the package-manager equivalent, or a non-breaking reinstall over changing `package.json`.

When an override or resolution is genuinely required, keep its scope as narrow as possible:

- For npm, use `npm explain <package>` to identify the exact parent chain and scope the override to the nested dependency path instead of the package globally.
- For Yarn, use `yarn why <package>` and prefer the most specific resolution pattern that matches the vulnerable path.
- If the vulnerable package can be updated through the existing semver range after a lockfile refresh, remove the temporary override or resolution instead of leaving it behind.
- As part of the final pass, review any existing or newly added `overrides` and `resolutions` touched by the audit and remove entries that are now outdated, redundant, or no longer needed.
- If an override or resolution crosses a major version line for a transitive dependency, only do it when you have primary-source evidence that the major change is compatible in this context, and note that evidence alongside the manifest change before verification.

For this repo, also account for these specifics:

- Keep local file references such as `../../packages/authgear-web` and `../../packages/authgear-react-native` untouched
- Preserve root `overrides` or per-project `resolutions` unless the fix requires adjusting them
- In `example/reactnative`, use the existing `yarnauditfix` script only when it cleanly resolves lockfile-level vulnerabilities without introducing a major bump

## Apply Safe Fixes

Prefer the smallest change that clears the audit:

1. Run `npm audit fix` in npm projects when it does not propose breaking upgrades.
2. Re-check whether the vulnerability is already fixed by the refreshed lockfile before editing manifests.
3. If a targeted package still needs a patch, install the minimal fixed version explicitly.
4. Only add a narrowly scoped override or resolution when the existing declared range cannot otherwise land on the patched version.
5. Update the lockfile with the same package manager that owns the directory.
6. Re-run the audit immediately after each root is updated.

When explicit targeted updates are needed, use commands in this shape:

```bash
npm install <package>@<fixed-version>
```

```bash
yarn add <package>@<fixed-version>
```

Avoid opportunistic upgrades. The goal is to remove vulnerable dependencies with the narrowest safe diff.

## Verify After Changes

Re-run the audit for every root you touched. Then run the most relevant lightweight verification for each affected project:

- Repo root: `npm test` and `npm run typecheck`
- `example/reactweb`: `npm run build`
- `example/reactnative`: `npm test` and `npm run typecheck`
- `example/capacitor`: `npm run build`
- `website`: `npm run build`

If a dependency update affects native mobile tooling, note any heavier validation you did not run, such as Capacitor or React Native platform builds.

## Report Breaking Changes Instead Of Applying Them

If the audit can only be fixed through a major-version change, stop and notify the user with a concise summary:

- Affected project root
- Package name
- Current declared range
- Minimum fixed version
- Why it is breaking
- Whether a lockfile-only mitigation or override was available
- The verification work that would be needed after a major upgrade
