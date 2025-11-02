# Template: Pancake Modernisation Announcement

_Use this template when notifying downstream teams about the `@truecms/*` modernization release. Replace bracketed text before sending._

## Subject

`[ACTION REQUIRED] Pancake upgrade to @truecms scope and Node 22`

## Audience

- Front-end engineering teams consuming Pancake bundles
- Delivery managers responsible for release readiness
- Platform reliability and CI administrators

## Message body

Hello team,

We have shipped the Pancake modernisation release and need your help to adopt it.

### What changed

- All Pancake packages now publish under the `@truecms/*` npm scope (legacy `@gov.au/*` releases remain archived).
- Runtime baseline increased to **Node.js 22** with pnpm-managed workspaces.
- Tooling upgrades: Dart Sass + PostCSS Autoprefixer pipeline, esbuild-based JS bundling, Vitest regression suite, structured CLI logging, and automated GitHub Actions pipelines.
- JSON manifests now include a `_meta` block recording schema and plugin versions for traceability.

### Required actions

1. Update your projects to depend on the new scope and reinstall packages (`pnpm install`).
2. Follow the migration checklist documented in `MIGRATION.md`.
3. Run `pnpm run install:check` and `pnpm run test` to validate outputs.
4. Confirm your CI publishes using the new GitHub Actions workflows (tag a release to trigger `.github/workflows/release.yml`).

### Timeline

- Target completion date: **[insert date]**
- Node 20 support ends: **30 June 2026** (see `docs/node-support-policy.md`).

### Verification

- ✅ Install Check: `[record success/failure date]`
- ✅ End-to-end tests: `[record success/failure date]`
- ✅ Release dry run: `[record success/failure date]`

### Support

- Raise questions or blockers in GitHub Issues: https://github.com/truecms/pancake/issues
- Contact maintainers on `[insert Slack/Teams channel]` for urgent escalations.
- Review the release checklist for full governance steps: `docs/release-checklist.md`.

Thank you for helping keep Pancake secure and maintainable.

Regards,

`[Your name]`
Pancake maintainers
