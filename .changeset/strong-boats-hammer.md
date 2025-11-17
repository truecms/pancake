---
"@truecms/pancake-sass": patch
---

Complete Sass modernization: migrate test modules and fixtures to use `@use` instead of deprecated `@import` syntax

- Updated test modules (`testmodule1-4`) to use `@use` internally instead of `@import`
- Added sass-versioning import to `_module.scss` files so `_globals.scss` can access `versioning-add` mixin
- Updated test fixtures to expect `@use` syntax in generated SCSS files
- Ensures full compatibility with modern Sass `@use` system used by pancake-sass
- Fixes compilation errors where modules using `@import` couldn't access `@use`-imported mixins
