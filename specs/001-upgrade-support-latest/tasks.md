# Tasks: Modernize Pancake for Node 22 Distribution

**Input**: Design documents from `/specs/001-upgrade-support-latest/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: Tests are focused on fixture-based regressions and install checks required by the specification (Vitest adoption, install-check harness, CI verification).
**Organization**: Tasks are grouped by user story (P1–P5) after completing shared setup and foundational work so each increment is independently testable.
**Constitution Alignment**: Every user story includes work to (1) verify Node 22 compatibility, (2) update or replace dependencies for security, (3) ensure GitHub Actions coverage remains merge blocking, (4) prepare scoped releases under `@truecms`, and (5) deliver migration guidance.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no dependency blocking).
- **[Story]**: User story mapping (US1…US5).
- Provide exact file paths in each description.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline repository configuration for Node 22 development.

- [X] T001 Add Node 22 runtime manifest: create `.nvmrc` (value `22`) and update `README.md` prerequisites to reference Node 22 + Corepack.
- [X] T002 [P] Configure pnpm workspace infrastructure: add `pnpm-workspace.yaml` (including `packages/*`) and root `.npmrc` enforcing frozen lockfiles and `engine-strict=true`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core changes required before any user story can proceed.

- [X] T003 Migrate workspace tooling to pnpm: update root `package.json` scripts to pnpm equivalents, remove `yarn.lock`, add `packageManager: "pnpm@8"`, and generate an initial `pnpm-lock.yaml` via `pnpm install`.
- [X] T004 [P] Scaffold design-system fixture linkage: create `tests/scripts/link-design-system.mjs` that mounts `~/websites/sites/govau/design-system-components` fixtures and document usage in `tests/fixtures/README.md`.

**Checkpoint**: pnpm-based workspace bootstraps cleanly on Node 22 and fixtures can be mounted for tests.

---

## Phase 3: User Story 1 - Maintain Node 22 Compatibility & Deterministic Installs (Priority: P1) 🎯 MVP

**Goal**: Ensure Pancake installs and runs on Node 22 with deterministic pnpm/Corepack workflows.

**Independent Test**: Run `pnpm install --frozen-lockfile`, execute `node scripts/install-check.mjs`, and verify the design-system fixture build completes offline with no runtime dependency installs.

### Implementation for User Story 1

- [X] T005 [US1] Update root `package.json` engines to `node ">=22"`, `npm ">=10"`, add `packageManager: "pnpm@8"`, and align lifecycle scripts (`test`, `build`, `purge`) to pnpm equivalents.
- [X] T006 [US1] Update every `packages/*/package.json` engines block to require Node ≥22 / npm ≥10 and align local scripts to pnpm (replace `npm`/`yarn` calls, add `packageManager` metadata where missing).
- [X] T007 [US1] Refactor `packages/pancake/src/pancake.js` module discovery to read consumer lockfiles (`pnpm-lock.yaml`, `package-lock.json`) and avoid runtime `npm install --save` calls; add unit coverage in `packages/pancake/__tests__/pancake.spec.js` for deterministic resolution.
- [X] T008 [US1] Add `scripts/install-check.mjs` that runs `pnpm install --frozen-lockfile`, `pnpm run build`, and per-package `pnpm pack`; expose as `pnpm run install:check` in root `package.json` and ensure it exits non-zero on failure.
- [X] T009 [P] [US1] Update developer docs (`AGENTS.md`, `quickstart.md`, `README.md`) with Node 22 requirements, Corepack usage, and instructions for the new install check script.

**Checkpoint**: Node 22 install check passes locally and documentation directs maintainers to deterministic workflows.

---

## Phase 4: User Story 2 - Modernise Plugins & CLI Contracts (Priority: P2)

**Goal**: Replace legacy Sass/bundling stacks while preserving output structure and CLI behaviour.

**Independent Test**: Execute `pnpm vitest run tests/integration/plugins-output.test.ts` to compare fixture outputs against baselines, allowing only documented differences.

### Tests for User Story 2

- [X] T010 [P] [US2] Introduce Vitest: add `vitest.config.ts`, update root `package.json` scripts (`test`, `test:watch`) to run Vitest, and configure workspace aliases.
- [X] T011 [P] [US2] Create `tests/integration/plugins-output.test.ts` (Vitest) that bundles fixture components and compares CSS/JS/React/`auds.json` outputs against `tests/baseline/` snapshots.

### Implementation for User Story 2

- [X] T012 [US2] Replace `node-sass` with `sass` (Dart Sass) in `packages/pancake-sass`: update `package.json` dependencies, rewrite `src/sass.js` to use `sass` API, and add optional sourcemap flag handling.
- [X] T013 [P] [US2] Add PostCSS 8 pipeline and shared browserslist: create root `.browserslistrc`, add `postcss.config.cjs`, and update `packages/pancake-sass/src/pancake.js` to apply Autoprefixer targets.
- [X] T014 [US2] Rebuild `packages/pancake-js` bundler with esbuild: update `package.json` dependencies, implement dual ESM/CJS outputs with sourcemap toggle in `src/js.js`, and ensure tree-shaking support.
- [X] T015 [P] [US2] Update `packages/pancake-react/src/react.js` to preserve ES module wrappers, emit `.d.ts` files when source definitions exist, and respect existing CLI flags.
- [X] T016 [US2] Implement structured logging and strict exit codes in `packages/pancake/bin/pancake` and `packages/pancake/src/log.js`, supporting `--json`, `--silent`, and `--verbose` modes.
- [X] T017 [P] [US2] Append version metadata to generated manifests in `packages/pancake-json/src/pancake.js`, including schema version and plugin versions for audit trails.

**Checkpoint**: Modernised plugins pass Vitest integration checks with acceptable diff reports.

---

## Phase 5: User Story 3 - Namespace Migration & Release Governance (Priority: P3)

**Goal**: Publish Pancake packages under `@truecms` with coordinated release tooling and migration safeguards.

**Independent Test**: Run `pnpm run release:dry-run` to execute Changesets versioning and `pnpm publish --dry-run` for each package, ensuring outputs target `@truecms` only and produce clean logs.

### Implementation for User Story 3

- [X] T018 [US3] Rename every package to `@truecms/*`: update `packages/*/package.json` `name` fields, adjust dependency references, and update bin entries to use the new scope.
- [X] T019 [P] [US3] Replace code/document references to `@gov.au` with `@truecms` across `packages/**/src/**`, `README.md`, and scripts while retaining legacy scope notes as archival references.
- [X] T020 [US3] Configure Changesets: add `.changeset/config.json`, `.changeset/README.md`, and update root `package.json` scripts (`changeset`, `release:dry-run`, `release:publish`).
- [X] T021 [P] [US3] Implement release dry-run orchestrator `scripts/release/dry-run.mjs` that runs `pnpm changeset status`, `pnpm changeset version`, and `pnpm publish --dry-run` for each workspace, collating warnings.
- [X] T022 [US3] Document release governance in `docs/release-checklist.md`, covering namespace migration steps, tagging, signed releases, and rollback expectations.

**Checkpoint**: Dry-run release under `@truecms` completes without legacy scope leakage.

---

## Phase 6: User Story 4 - Automated Quality Gates & Deterministic CI (Priority: P4)

**Goal**: Replace CircleCI with GitHub Actions workflows providing Node 22 coverage, install checks, and artefact diffs.

**Independent Test**: Trigger `ci.yml` on a feature branch and confirm all matrix jobs pass, `install-check.yml` uploads diff artefacts on failure, and release workflow gates publishing on successful CI.

### Implementation for User Story 4

- [ ] T023 [US4] Create `.github/workflows/ci.yml` with Node 22 matrix (Linux/macOS/Windows) covering lint, Vitest, fixture diff, and packaging jobs with pnpm caching.
- [ ] T024 [P] [US4] Add `.github/workflows/install-check.yml` running `pnpm run install:check`, uploading diff artefacts, and posting summary annotations.
- [ ] T025 [US4] Add `.github/workflows/release.yml` to run Changesets versioning and publish to npm using the `@truecms` token after CI success.
- [ ] T026 [P] [US4] Archive legacy CircleCI: move `.circleci/config.yml` to `docs/ci-archive/` with deprecation notice and update `README.md` badges to GitHub Actions.
- [ ] T027 [US4] Add `scripts/ci/format-summary.mjs` to collate fixture diff results and include them in GitHub Actions job summaries for quick triage.

**Checkpoint**: GitHub Actions pipelines enforce merge-blocking status with actionable logs and replace CircleCI entirely.

---

## Phase 7: User Story 5 - Downstream Migration Guidance (Priority: P5)

**Goal**: Provide clear documentation and communication for teams adopting the `@truecms` release.

**Independent Test**: Follow `MIGRATION.md` in a sample downstream repo to upgrade dependencies, run Node 22 builds, and confirm documentation addresses prerequisites and validation steps.

### Implementation for User Story 5

- [ ] T028 [US5] Author `MIGRATION.md` with step-by-step upgrade instructions, including dependency updates, install-check usage, and validation checklist.
- [ ] T029 [P] [US5] Refresh `README.md` and `AGENTS.md` with migration highlights, updated npm scope references, and pointers to the install-check + CI workflows.
- [ ] T030 [US5] Create `docs/node-support-policy.md` detailing supported Node versions, deprecation timelines for Node 20, and escalation paths for lagging teams.
- [ ] T031 [P] [US5] Update `specs/001-upgrade-support-latest/checklists/package-docs.md` to track per-package README/CHANGELOG updates required before release sign-off.
- [ ] T032 [US5] Produce communication template `docs/announcements/truecms-upgrade.md` covering release summary, testing expectations, and contact channels for downstream teams.

**Checkpoint**: Migration documentation validated via sample upgrade and communication artefacts ready for distribution.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across the monorepo.

- [ ] T033 Run repository-wide quality gates: `pnpm lint`, `pnpm vitest run`, `pnpm run install:check`, and ensure fixture diff reports are clean; address any regressions.
- [ ] T034 [P] Execute `pnpm audit --prod` and resolve remaining vulnerabilities by bumping dependencies or documenting mitigations.
- [ ] T035 Prepare release candidate: run `pnpm changeset version`, `pnpm run release:dry-run`, capture artefacts for review, and reset working tree after validation.

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)** → baseline required for all work.
2. **Foundational (Phase 2)** depends on Phase 1; BLOCKS all user stories.
3. **User Stories (Phases 3–7)** depend on Phase 2 and may progress in priority order (P1 → P2 → P3 → P4 → P5) or in parallel once prerequisites satisfied.
4. **Polish (Phase 8)** depends on completion of desired user stories.

### User Story Dependencies

- **US1** has no dependency on other stories once foundational work completes.
- **US2** depends on US1’s deterministic install scaffolding for fixture runs.
- **US3** depends on US2 outcomes where release notes reference modernised plugins.
- **US4** depends on US1–US3 outputs to wire CI to the new scripts and release pipeline.
- **US5** depends on all prior stories to document final behaviour and policies.

### Task Dependencies Highlights

- T005 → T006 (package engines updates follow root config).
- T008 → T023/T024 (install check script consumed by CI workflows).
- T010/T011 → T012–T017 (Vitest configuration precedes plugin modernisation tests).
- T018/T019 → T021 (renamed packages required before release dry run).
- T023–T027 must complete before T035 release rehearsal.

---

## Parallel Execution Examples

- **US1**: T009 (docs updates) can run in parallel with T007/T008 after engines changes land.
- **US2**: T013, T015, and T017 touch different packages and can proceed concurrently once T012/T014 begin.
- **US3**: T019 (code/doc string replacements) can run alongside T021 (release script) after T018 renames packages.
- **US4**: T024 (install-check workflow) and T027 (summary formatter) can be developed in parallel with T023 CI workflow scaffolding.
- **US5**: T029 (README/AGENTS refresh) and T032 (announcement template) can run simultaneously after MIGRATION.md draft (T028).

---

## Implementation Strategy

### MVP Focus

1. Complete Phases 1–2 to establish pnpm + Node 22 tooling.
2. Deliver User Story 1 end-to-end (install check, deterministic discovery, documented workflows).
3. Validate MVP via install-check script and fixture build before proceeding.

### Incremental Delivery

- After MVP, implement US2 to modernise plugins and establish Vitest regression coverage.
- Proceed with US3 to migrate namespace and release tooling.
- Enable GitHub Actions gates in US4, then finalize downstream documentation in US5.
- Conclude with Phase 8 polish to produce a release candidate.

### Team Parallelisation

- One contributor can drive US1 (runtime compatibility) while another begins US2 (plugin updates) once foundational work is done.
- Release engineering can prepare US3 scripts concurrently with late-stage US2 validation.
- Ops-focused contributors can implement US4 workflows while documentation leads focus on US5 outputs.
