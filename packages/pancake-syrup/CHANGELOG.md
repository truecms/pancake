Syrup

## 2.0.1

### Patch Changes

- [#1](https://github.com/truecms/pancake/pull/1) [`3aa8027`](https://github.com/truecms/pancake/commit/3aa802715da195eac14486d04c7969c04aed97cb) Thanks [@ivangrynenko](https://github.com/ivangrynenko)! - - Upgrade the JS bundler to esbuild 0.25.x so recent npm advisories are addressed without changing emitted bundles.
  - Replace the legacy request client in syrup with @cypress/request to pull in patched form-data and tough-cookie dependencies.

## 2.0.0

### Major Changes

- migrate the toolchain to Node 22 with Vitest-powered tests, esbuild JS bundling, PostCSS + browserslist pipelines, and structured logging modes for the CLI
- expose dual ESM/CJS artefacts across JS and React plugins, add manifest metadata, and update fixtures to the new outputs
- rename the workspace to the `@truecms/*` scope and wire up the Changesets-driven release flow with a publish dry-run script and checklist

### Patch Changes

- Updated dependencies:
  - @truecms/pancake@2.0.0

> Syrup is a tool to make working with [pancake](https://github.com/govau/pancake) and npm easy and sweet.

## Versions

- [v1.2.0 - Upgrade dependencies](v120)
- [v1.1.0 - Multiple organisations](v110)
- [v1.0.8 - Update dependencies](v108)
- [v1.0.7 - Update dependencies](v107)
- [v1.0.6 - Update node modules](v106)
- [v1.0.5 - Update forgotten changelog](v105)
- [v1.0.4 - Update node modules](v104)
- [v1.0.3 - Added npm init support](v103)
- [v1.0.2 - Fix syrup command](v102)
- [v1.0.1 - Fixed Invalid URI bug](v101)
- [v1.0.0 - 💥 Initial version](v100)

---

## v1.2.0

- Update dependencies

## v1.1.0

- Multiple organisations

## v1.0.8

- Update dependencies

## v1.0.7

- Update dependencies

## v1.0.6

- Update dependencies

## v1.0.5

- Add changelogs

## v1.0.4

- Update dependencies

## v1.0.3

- Added `npm init` support if the folder you run syrup ion does not have a `package.json` file.

## v1.0.2

- Fixed the syrup command not being available. 😰 ([#44](https://github.com/govau/pancake/issues/44))

## v1.0.1

- Fixed settings error where settings.json wasn’t included into the npm build ([#43](https://github.com/govau/pancake/issues/43))

## v1.0.0

- 💥 Initial version

**[⬆ back to top](#contents)**

# };
