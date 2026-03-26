---
phase: "01"
plan: "01"
title: "Test Scaffold — Vitest, Playwright, factory helpers"
subsystem: "foundation"
tags: ["vitest", "playwright", "testing", "factories", "typescript"]
completed_date: "2026-03-26"
duration_minutes: 7

dependency_graph:
  requires:
    - "01-02: Next.js 15 scaffold (pnpm, TypeScript, tsconfig, package.json)"
  provides:
    - "Vitest unit test runner (vitest.config.ts) with jsdom, path aliases, setupFiles"
    - "Playwright E2E config (playwright.config.ts) targeting localhost:3000, Chromium + Firefox"
    - "In-memory test factories: makeTestUser() and makeTestHousehold() (tests/helpers/factories.ts)"
    - "test / test:watch / test:e2e npm scripts in package.json"
  affects:
    - "All subsequent plans — every implementation plan can now end its verify block with pnpm test"

tech_stack:
  added: []
  patterns:
    - "vitest --passWithNoTests: exits 0 when no test files found, enabling zero-test baseline"
    - "In-memory factories with Date.now() + Math.random() suffix for unique test data without DB"
    - "Playwright webServer.reuseExistingServer = !CI: dev server reused locally, fresh in CI"

key_files:
  created:
    - path: "vitest.config.ts"
      purpose: "Vitest config: jsdom env, globals true, setupFiles vitest.setup.ts, @/* alias, plugin-react + tsconfig-paths"
    - path: "vitest.setup.ts"
      purpose: "Vitest setup: @testing-library/react cleanup afterEach"
    - path: "playwright.config.ts"
      purpose: "Playwright config: baseURL localhost:3000, Chromium + Firefox, html reporter, pnpm dev webServer"
    - path: "tests/e2e/.gitkeep"
      purpose: "Placeholder so the e2e directory is tracked by git"
    - path: "tests/helpers/factories.ts"
      purpose: "makeTestUser() and makeTestHousehold() in-memory factories for unit and integration tests"
  modified:
    - path: "package.json"
      purpose: "Added test (vitest run --passWithNoTests), test:watch (vitest), test:e2e (playwright test) scripts"

decisions:
  - id: "VITEST_PASS_WITH_NO_TESTS"
    summary: "vitest run uses --passWithNoTests so the test script exits 0 before any tests are written; zero config errors is the baseline, not zero tests"
  - id: "FETCH_STUB_REMOVED"
    summary: "Initial vitest.setup.ts included a manual fetch stub that caused TS2322 errors; removed because jsdom 29 provides a native fetch implementation"

metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 1
  commits: 2
  build_status: "passing"
---

# Phase 01 Plan 01: Test Scaffold Summary

**One-liner:** Vitest (jsdom, globals, @/* alias) + Playwright (Chromium/Firefox, localhost:3000) + in-memory TestUser/TestHousehold factories — zero-excuses test baseline for all Phase 1 implementation plans.

---

## What Was Built

The complete test infrastructure for Kinship. Every subsequent implementation plan can now end its verify block with a real test command.

**Vitest unit test runner:**
- `vitest.config.ts` uses `defineConfig` from `vitest/config` with `@vitejs/plugin-react` and `vite-tsconfig-paths`
- Environment: `jsdom`; globals enabled (no explicit `import { describe, it, expect }` needed)
- `setupFiles` points to `./vitest.setup.ts` which calls `@testing-library/react` `cleanup` after each test
- Include globs cover `src/**/*.test.{ts,tsx}` and `tests/unit/**/*.test.ts`
- `@/*` path alias resolves to `./src` — matches tsconfig

**Playwright E2E config:**
- `testDir: ./tests/e2e` — empty at this stage (`.gitkeep` ensures directory exists in git)
- `baseURL` defaults to `http://localhost:3000`, overrideable with `PLAYWRIGHT_BASE_URL` env var
- Two projects: `chromium` (`Desktop Chrome`) and `firefox` (`Desktop Firefox`)
- Reporter: `[["html", { open: "never" }]]` — no browser popup on CI
- `webServer` runs `pnpm dev`; `reuseExistingServer: !process.env.CI` — local dev reuses running server

**In-memory test factories (`tests/helpers/factories.ts`):**
- `TestUser` interface: `{ id, email, password }`
- `TestHousehold` interface: `{ id, name }`
- `makeTestUser(overrides?)` — generates `test-<timestamp>-<random>@kinship-test.example` email; unique per call; supports partial overrides
- `makeTestHousehold(overrides?)` — generates `Test Household <timestamp>-<random>` name
- No database side effects — DB creation is done in test setup blocks using the Supabase admin client (which will be wired in 01-03's `tests/helpers/supabase-rls.ts`)

**npm scripts added to `package.json`:**
- `test`: `vitest run --passWithNoTests`
- `test:watch`: `vitest`
- `test:e2e`: `playwright test`

---

## Task Execution

### Task 1: Vitest configuration and unit test setup
**Status:** COMPLETE — commit `b559200`

Created `vitest.config.ts` and `vitest.setup.ts`. Added test scripts to `package.json`. Verified `pnpm exec vitest run --passWithNoTests` exits with code 0.

### Task 2: Playwright configuration and in-memory test factories
**Status:** COMPLETE — commit `43f8ee3`

Created `playwright.config.ts`, `tests/e2e/.gitkeep`, and `tests/helpers/factories.ts`. TypeScript compiles cleanly with `pnpm exec tsc --noEmit`.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed incorrect fetch stub from vitest.setup.ts**
- **Found during:** Task 2 TypeScript verification (`tsc --noEmit`)
- **Issue:** The initial `vitest.setup.ts` included a manual `globalThis.fetch` stub that caused two TypeScript errors: `TS2578` (unused `@ts-expect-error` directive) and `TS2322` (stub return type doesn't match `Response`). jsdom 29 ships with a native `fetch` implementation, making the stub unnecessary.
- **Fix:** Removed the fetch stub entirely. `vitest.setup.ts` now only imports `cleanup` from `@testing-library/react` and calls it in `afterEach`.
- **Files modified:** `vitest.setup.ts`
- **Commit:** `43f8ee3` (included in Task 2 commit)

**2. [Rule 2 - Enhancement] Added `--passWithNoTests` to vitest run script**
- **Found during:** Task 1 verification
- **Issue:** `pnpm exec vitest run` exits with code 1 when no test files are found. The plan requires "zero errors" as the baseline, not "zero tests". Without this flag, `pnpm test` would fail on a fresh scaffold with no test files.
- **Fix:** Changed `"test": "vitest run"` to `"test": "vitest run --passWithNoTests"` in `package.json`.
- **Files modified:** `package.json`

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm exec vitest run --passWithNoTests` exits code 0 | PASS |
| `pnpm exec tsc --noEmit` exits code 0 | PASS |
| `makeTestUser` exported from `tests/helpers/factories.ts` | PASS |
| `makeTestHousehold` exported from `tests/helpers/factories.ts` | PASS |
| `playwright.config.ts` references `localhost:3000` | PASS (line 16 + 31) |
| `vitest.config.ts` references `./vitest.setup.ts` in setupFiles | PASS |

---

## Self-Check: PASSED
