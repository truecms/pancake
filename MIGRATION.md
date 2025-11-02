# Pancake Upgrade Guide

This guide walks existing Pancake consumers through the modernization release that migrated the workspace to Node.js 22, pnpm, Vitest, and the new `@truecms/*` npm scope. Follow every section in order before depending on the refreshed packages in production.

## Who should follow this guide?

- Delivery teams currently consuming any `@gov.au/*` Pancake packages.
- Internal contributors preparing to work on the updated monorepo or publish new releases.

## 1. Prepare your environment

1. Install Node.js 22.x and enable it in your shell (the project ships an `.nvmrc` file, so `nvm use` will select the correct version).
2. Enable Corepack and allow it to manage pnpm: `corepack enable`.
3. Verify pnpm 8.15.x (or later 8.x) is active with `pnpm --version`.
4. Clean local caches to avoid stale dependencies:
   - `pnpm store prune`
   - Remove project `node_modules/` and lock files created by npm or yarn.

## 2. Update dependencies to the `@truecms` scope

1. Replace any `@gov.au/*` package references with their `@truecms/*` equivalents. The package names are unchanged beyond the scope swap.
2. If your project pinned legacy versions, confirm that the desired release exists under the new scope—modern packages follow semantic versioning and were republished when the migration completed.
3. For applications that vendor Pancake configuration, update any `pancake` settings (for example, the default `npmOrg`) to point at `@truecms`.

## 3. Refresh installs and lockfiles

1. Run `pnpm install` (or `pnpm install --frozen-lockfile` in CI) to rewrite the dependency graph using the new scope.
2. Commit the updated `pnpm-lock.yaml` after confirming there are no unexpected drops in the dependency tree.
3. Run `pnpm run install:check` to execute the deterministic installation gate. This command verifies packability, build artefacts, and ensures each workspace compiles with Node 22.

## 4. Validate builds and tests

1. Execute `pnpm run test` to run both the Vitest unit suite and end-to-end fixture harness. Fix any regressions surfaced by the stricter Sass, esbuild, or logging behaviour introduced in the modernization.
2. If your application publishes bundles that rely on Pancake outputs, rebuild those assets and compare them with production artefacts (for example, via a diff or checksum comparison).
3. Review the generated JSON manifest (`@truecms/pancake-json`) for the new `_meta` payload that records schema and plugin versions.

## 5. Optional: rehearse a release

1. If you maintain downstream component packages, run `pnpm run release:dry-run -- --allow-dirty --skip-publish` to ensure Changesets and the new release workflow succeed in your environment.
2. Use the output to confirm package versions, changelog entries, and publish order before creating tags.

## 6. Sign off and communicate

1. Capture migration notes in your project changelog, referencing the upgrade to `@truecms/*` and Node 22.
2. Share the announcement using the template under `docs/announcements/truecms-upgrade.md` so stakeholders understand the scope of change and validation performed.
3. Tag the release and push to ensure the GitHub Actions release workflow (`.github/workflows/release.yml`) handles automated publishing.

## Troubleshooting checklist

- **pnpm refuses to install packages**: Confirm you are running Node 22 and that Corepack installed pnpm 8.x. Older versions do not understand the workspace layout.
- **Sass sourcemaps fail to parse**: Regenerate the compiled CSS using the new PostCSS pipeline. The upgrade stringifies Dart Sass map payloads instead of inserting raw objects.
- **CI cannot publish to npm**: Ensure the `NPM_TOKEN` secret is an npm Automation Token and that the tagging workflow pushes `v*` tags.
- **React bundles missing `.mjs` files**: Upgrade any custom Pancake consumers to look for both `.js` and `.mjs` artefacts. The esbuild migration now emits dual module targets by default.

Following these steps keeps downstream applications aligned with the modernization programme and ensures automated release tooling continues to operate without manual overrides.
