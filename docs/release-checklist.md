# Release Checklist

This checklist coordinates `@truecms/*` Pancake releases. Follow every step in order. Commands assume Node 22 with `nvm use 22` and Corepack-enabled pnpm.

## Pre-flight

1. Confirm working tree is clean: `git status --short` should show no staged or unstaged changes.
2. Pull latest `master` (or release branch) and ensure design-system fixtures are current.
3. Run validation commands locally:
   - `pnpm run test`
   - `pnpm run install:check`
   - `pnpm run release:dry-run -- --allow-dirty --skip-publish` (ensures versioning + scripts are healthy without mutating the branch).
4. Review `pnpm audit --prod`; address critical issues or capture mitigations in the release notes.

## CI Authentication

1. Generate an npm **Automation Token** from `https://www.npmjs.com/settings/<account>/tokens`. Automation tokens are the only token type that bypass two-factor prompts in CI.
2. Store the token in the GitHub repository secrets as `NPM_TOKEN` (Settings → Secrets and variables → Actions).
3. Optionally scope the token to npm organisations if required by corporate policy.
4. Verify the token before release by running `pnpm whoami` locally with `NODE_AUTH_TOKEN` exported.

## Record Changes

1. For each logical change, run `pnpm run changeset` and select affected packages.
2. Commit the generated `.changeset/*.md` files with the feature changes.
3. Push to open a PR; approvals must confirm:
   - CI (`.github/workflows/ci.yml`) is green.
   - Install check workflow succeeded.

## Release Dry Run

1. On the release branch, run `pnpm run release:dry-run -- --allow-dirty`.
   - Script stages `changeset version`, exercises publish dry runs, then restores the working tree.
   - Resolve any failures or warnings before proceeding.
2. Review generated changelog entries and version bumps in the dry-run output; adjust changesets if necessary.

## Publish

1. Merge the release branch into `master`.
2. On `master`, re-run:
   - `pnpm run release:dry-run -- --allow-dirty --skip-publish` to verify clean status.
3. Publish using `pnpm run release:publish` from a clean working tree.
4. Tag the release (`git tag vX.Y.Z`) and push tags.
5. Verify packages appear under `@truecms/*` on npm and documentation links resolve.

## Post-release

1. Announce via `docs/announcements/truecms-upgrade.md` template (update version numbers and highlights).
2. Update `specs/001-upgrade-support-latest/tasks.md` checklist items.
3. Reset local environment: `pnpm run purge` and reinstall if needed.

> Note: Legacy `@gov.au/*` packages remain archived; do not publish there. If downstream teams require backports, document exceptions explicitly in the changelog.
