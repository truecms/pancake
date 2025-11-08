Pancake JS plugin

## 2.0.2

### Patch Changes

- 8b9b68f: - Upgrade @truecms/pancake-js dependency on `esbuild` to `^0.25.x` to address dev-server advisory (GHSA-67mh-4wv8-2f99) without changing emitted bundles.
  - Ensure `@truecms/syrup` patch version to capture dependency hygiene improvements alongside the security roll-up.

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

> This is a [Pancake](https://github.com/truecms/pancake) plugin to handle js files.

## Versions

- [v1.2.1 - Move `uglify-js` from devDependency -> dependency](v121)
- [v1.2.0 - Upgrade dependencies](v120)
- [v1.1.0 - Multiple organisations](v110)
- [v1.0.14 - Update dependencies](v1014)
- [v1.0.13 - Add ie8 support for mangled js files and updated dependencies](v1013)
- [v1.0.12 - Update node modules](v1012)
- [v1.0.11 - Update forgotten changelog](v1011)
- [v1.0.10 - Update node modules](v1010)
- [v1.0.9 - Fixed mixed js and Sass module bug](v109)
- [v1.0.8 - Cleaned log and updated uglify-js](v108)
- [v1.0.7 - Dependencies and tests](v107)
- [v1.0.6 - Receiving global settings from pancake now](v106)
- [v1.0.5 - Loading fixes](v105)
- [v1.0.4 - Bug hunting](v104)
- [v1.0.3 - 💥 Initial version](v103)

---

## v1.2.1

- Move `uglify-js` from devDependency -> dependency

## v1.2.0

- Upgrade dependencies

## v1.1.0

- Multiple organisations

## v1.0.14

- Update dependencies

## v1.0.13

- Add ie8 support for mangled js files
- Updated dependencies

## v1.0.12

- Update dependencies

## v1.0.11

- Add changelogs

## v1.0.10

- Update dependencies

## v1.0.9

- Fixed a bug where pancake would fail when we mix modules that are only Sass and only Js.

## v1.0.8

- Cleaned log so now pancake will announce plugins just when it tries to run them
- Updated uglify-js to 2.8.18 to fix regression found in 2.8.7

## v1.0.7

- Made pancake a dependency
- Added jest unit tests

## v1.0.6

- Receiving global settings from pancake now
- Loading now separate from main module in case the main module is globally installed

## v1.0.5

- Loading as a plugin is now fixed, even when you have pancake installed globally
- Removed pancake as a dependency

## v1.0.4

- Fixed some bugs

## v1.0.3

- 💥 Initial version

**[⬆ back to top](#contents)**

# };
