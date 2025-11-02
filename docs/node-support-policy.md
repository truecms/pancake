# Node.js Support Policy

This document codifies the runtime expectations for Pancake contributors and downstream consumers. It complements the upgrade guidance in `MIGRATION.md` and informs release planning for future Node.js major versions.

## Supported versions

- **Active:** Node.js 22.x (LTS) — required for local development, CI, and publishing. The repository enforces this via the root `engines` field, `.nvmrc`, and GitHub Actions workflows.
- **Community support:** Node.js 20.x — accepted only for downstream applications that cannot yet upgrade. Packages may continue to function but are not validated in CI. Critical security fixes will be backported on a best-effort basis until **30 June 2026**.

All other Node.js releases are considered unsupported. Issues reported against unsupported runtimes will be closed with a request to upgrade.

## Deprecation timeline

| Date | Action |
|------|--------|
| 1 July 2025 | Begin communicating Node 20 sunset in release notes, README, and announcements. |
| 31 December 2025 | Final window for teams to request temporary exceptions. |
| 30 June 2026 | Official end of community support for Node 20. CI coverage and compatibility patches cease. |

After the cutoff, new features may rely on Node 22-only APIs without additional notice.

## Escalation path for lagging teams

1. **Raise an issue** in the GitHub repository describing the blocker, the affected applications, and planned upgrade timeline.
2. **Contact the platform maintainers** via the release announcement channel (see `docs/announcements/truecms-upgrade.md`) if the issue impacts a critical service.
3. **Document the exception** in your project README and link back to the tracking issue. Include mitigation steps and review dates.

Exception requests are reviewed monthly. Teams must demonstrate active progress toward Node 22 adoption to remain on the exception list.

## Compatibility testing

- GitHub Actions runs on Ubuntu with Node 22 for PR validation and release pipelines.
- `pnpm run install:check` and `pnpm run test` must pass on Node 22 before merges.
- Downstream teams relying on older environments are encouraged to run `pnpm run test` in their CI to detect regressions early.

## Future updates

The maintainers evaluate new Node.js LTS releases every six months. Once a newer LTS demonstrably improves performance or security, the team will publish an updated policy with migration timelines similar to the Node 20 sunset above.
