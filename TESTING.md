# Testing Guide

## Prerequisites

Ensure you have the correct Node.js version and dependencies installed:

```bash
# Use Node.js 22 (required)
nvm use

# Enable Corepack (if not already enabled)
corepack enable

# Install dependencies
pnpm install --frozen-lockfile
```

## Build First

Always build the packages before testing, as the integration tests require built artifacts:

```bash
pnpm run build
```

## Running Tests

### Full Test Suite

Run both end-to-end and unit tests (recommended before committing):

```bash
pnpm run test
```

This runs:
1. End-to-end tests (`tests/tester.js`) - tests pancake CLI with various scenarios
2. Unit tests (`pnpm exec vitest run`) - includes the integration test we fixed

### Unit Tests Only (Including Integration Test)

Run just the Vitest suite, which includes the `plugins-output.test.ts` integration test:

```bash
pnpm run test:unit-test
```

This will test:
- All unit tests in `packages/*/__tests__/`
- The integration test `tests/integration/plugins-output.test.ts` (tests react-bundle and json-manifest scenarios)

### Watch Mode (Development)

For iterative development, use watch mode:

```bash
pnpm run test:watch
```

This will re-run tests automatically when files change.

### End-to-End Tests Only

Run just the end-to-end fixture regression tests:

```bash
pnpm run test:end-to-end
```

## Testing Specific Scenarios

### Test the Integration Test We Fixed

The integration test (`tests/integration/plugins-output.test.ts`) specifically tests:
- `react-bundle` scenario (test10)
- `json-manifest` scenario (test11)

To verify our Sass modernization fixes:

```bash
# Build first
pnpm run build

# Run just the unit tests (includes integration test)
pnpm run test:unit-test
```

### Verify Sass Compilation

You can manually test Sass compilation by running pancake on one of the test scenarios:

```bash
# Build first
pnpm run build

# Run pancake on test10 (react-bundle scenario)
cd tests/test10
node ../../packages/pancake/bin/pancake .

# Check the generated files
ls -la pancake/css/
ls -la pancake/sass/
```

Verify that:
- Generated SCSS files use `@use` syntax (not `@import`)
- CSS files compile successfully
- No "Undefined mixin" errors appear

## Install Check (CI Gate)

Run the deterministic install/build gate (same as CI):

```bash
pnpm run install:check
```

This verifies:
- `pnpm install --frozen-lockfile` works
- `pnpm run build` succeeds
- `pnpm pack` works for all packages

## Common Issues

### "Cannot find module '../dist/cli.js'"

**Solution:** Run `pnpm run build` first. The integration tests require built packages.

### "Undefined mixin" Sass errors

**Solution:** This should be fixed now, but if you see it:
1. Verify test modules use `@use` internally (check `tests/modules/*/lib/sass/_module.scss`)
2. Verify fixtures expect `@use` syntax (check `tests/*/fixture/pancake/sass/*.scss`)
3. Rebuild: `pnpm run build`

### Node version mismatch

**Solution:** Ensure you're using Node.js 22:
```bash
nvm use
# or check .nvmrc for the version
cat .nvmrc
```

## Pre-Commit Checklist

Before committing, ensure:

- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test` passes (all tests green)
- [ ] `pnpm run install:check` passes
- [ ] No linter errors (if configured)

## CI Simulation

To simulate what CI does:

```bash
# 1. Install
pnpm install --frozen-lockfile

# 2. Build
pnpm run build

# 3. Run tests
pnpm run test

# 4. Install check
pnpm run install:check
```


