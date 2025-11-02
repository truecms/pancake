# Changesets

This directory stores the configuration used by [Changesets](https://github.com/changesets/changesets) to coordinate versioning and publishing for the Pancake workspace.

- Run `pnpm run changeset` to record a new change summary before releasing.
- Run `pnpm run release:dry-run` to rehearse the orchestrated publish flow without publishing to npm.
- Run `pnpm run release:publish` once CI and audits are green to publish `@truecms/*` packages.

Configuration lives in `config.json`; adjust it when release policies change.
