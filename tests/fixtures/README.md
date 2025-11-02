# Design System Fixture Linking

Use the linking script to mount the local `design-system-components` repository into Pancake's test fixtures before running integration builds. This keeps fixture data outside the Pancake repo while still allowing the test harness to consume real components.

## Quick start

1. Clone the design system repo to `~/websites/sites/govau/design-system-components` (or set `DESIGN_SYSTEM_FIXTURES` to an alternate path).
2. Run the linker: `node tests/scripts/link-design-system.mjs`
3. Verify that `tests/fixtures/design-system-components` now resolves to your design-system checkout.

## Custom paths

- Override the source path via `node tests/scripts/link-design-system.mjs --source /path/to/design-system-components`.
- Or set `DESIGN_SYSTEM_FIXTURES=/path/to/design-system-components` before running the script.
- Use `--force` to replace an existing link.

Run `node tests/scripts/link-design-system.mjs --help` for the full option reference.
