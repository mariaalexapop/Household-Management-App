# Phase 1 Validation Architecture

**Phase:** 01 — Foundation & Onboarding
**Framework:** Vitest 4.1.1 + React Testing Library + Playwright 1.58.2
**Created:** 2026-03-24

---

## Test Framework

| Property | Value |
|----------|-------|
| Unit/component runner | Vitest (`pnpm exec vitest run`) |
| E2E runner | Playwright (`pnpm exec playwright test`) |
| Quick suite | `pnpm exec vitest run` |
| Full suite | `pnpm exec vitest run && pnpm exec playwright test` |

**Limitation:** Vitest does not support async React Server Components. Server Component rendering must be covered by Playwright E2E tests.

---

## Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Plan |
|--------|----------|-----------|-------------------|------|
| AUTH-01 | Email signup creates user and shows verification message | E2E | `pnpm exec playwright test tests/e2e/auth.spec.ts` | 01-04 |
| AUTH-02 | Email verification email is sent after signup | E2E (manual verify) | `pnpm exec playwright test tests/e2e/auth.spec.ts` | 01-04 |
| AUTH-03 | Password reset request shows "Check your email" | E2E | `pnpm exec playwright test tests/e2e/auth.spec.ts` | 01-04 |
| AUTH-04 | Google OAuth button visible on login page | E2E | `pnpm exec playwright test tests/e2e/auth.spec.ts` | 01-04 |
| AUTH-05 | Unauthenticated user visiting /dashboard redirected to /auth/login | E2E | `pnpm exec playwright test tests/e2e/auth.spec.ts` | 01-04 |
| ONBD-01 | Household type selection renders step, updates Zustand store | Unit | `pnpm exec vitest run tests/unit/onboarding/wizard.test.ts` | 01-05 |
| ONBD-02 | Module multi-select updates store; min-1 validation enforced | Unit | `pnpm exec vitest run tests/unit/onboarding/wizard.test.ts` | 01-05 |
| ONBD-03 | Dashboard renders only activated module cards | Unit | `pnpm exec vitest run tests/unit/dashboard/dashboard.test.ts` | 01-06 |
| ONBD-04 | Settings module toggle updates DB; dashboard revalidates | E2E | `pnpm exec playwright test tests/e2e/realtime.spec.ts` | 01-08 |
| HSLD-01 | Household creator inserted with role=admin | Unit | `pnpm exec vitest run tests/unit/onboarding/wizard.test.ts` | 01-05 |
| HSLD-02 | Admin can send email invite (route accepts POST, returns 200) | Unit (mocked) | `pnpm exec vitest run tests/unit/household/invite.test.ts` | 01-07 |
| HSLD-03 | Invite link token is a valid UUID; stored in household_invites | Unit (mocked) | `pnpm exec vitest run tests/unit/household/invite.test.ts` | 01-07 |
| HSLD-04 | Invite accept flow: atomic claim, inserts household_members | Unit (mocked) | `pnpm exec vitest run tests/unit/household/invite.test.ts` | 01-07 |
| HSLD-05 | RLS: user A cannot read household B's members | Integration | `pnpm exec vitest run tests/unit/db/rls.test.ts` | 01-03 |
| HSLD-06 | Display name update persists via updateProfile action | E2E | `pnpm exec playwright test tests/e2e/household.spec.ts` | 01-07 |
| HSLD-07 | RLS: non-admin cannot DELETE from household_members | Integration | `pnpm exec vitest run tests/unit/db/rls.test.ts` | 01-03 |
| HSLD-08 | Activity feed merges initial items and realtime items correctly | Unit | `pnpm exec vitest run tests/unit/realtime/connection.test.ts` | 01-08 |
| PLAT-01 | DB change propagates to second browser session | E2E | `pnpm exec playwright test tests/e2e/realtime.spec.ts` | 01-08 |
| PLAT-02 | ConnectionIndicator renders null when connected; shows banner when disconnected | Unit | `pnpm exec vitest run tests/unit/realtime/connection.test.ts` | 01-08 |
| PLAT-04 | Supabase project region is eu-central-1 | Manual | — manual: check Supabase Dashboard → Project Settings → General | 01-02 |
| PLAT-05 | Delete account removes auth user; ON DELETE CASCADE cleans household data | Integration (manual verify) | `pnpm exec vitest run tests/unit/db/rls.test.ts` + manual verify in Supabase | 01-08 |

---

## Sampling Strategy

| Gate | Command |
|------|---------|
| Per task commit | `pnpm exec vitest run` (unit + integration; skip E2E) |
| Per wave merge | `pnpm exec vitest run && pnpm exec playwright test` |
| Phase gate | Full suite green before `/gsd:verify-work` |

---

## Test Files by Plan

### Plan 01-01 (test scaffold)
- `vitest.config.ts` — config only, no tests
- `playwright.config.ts` — config only, no tests
- `tests/helpers/factories.ts` — helpers, no tests

### Plan 01-03 (database + RLS)
- `tests/helpers/supabase-rls.ts` — RLS assertion helper
- `tests/unit/db/rls.test.ts` — integration tests (requires live Supabase; skips if env vars absent)

### Plan 01-04 (auth flows)
- `tests/e2e/auth.spec.ts` — 5 Playwright tests covering AUTH-01 through AUTH-05

### Plan 01-05 (onboarding wizard)
- `tests/unit/onboarding/wizard.test.ts` — 4 unit tests covering ONBD-01, ONBD-02, HSLD-01 store transitions

### Plan 01-06 (dashboard)
- `tests/unit/dashboard/dashboard.test.ts` — 3 unit tests covering ONBD-03 card rendering
- `tests/e2e/onboarding.spec.ts` — E2E smoke test for /dashboard redirect and wizard pages

### Plan 01-07 (invite system)
- `tests/unit/household/invite.test.ts` — 3 unit tests covering HSLD-02, HSLD-03, HSLD-04 (mocked DB)
- `tests/e2e/household.spec.ts` — E2E tests for household page render

### Plan 01-08 (realtime + GDPR)
- `tests/unit/realtime/connection.test.ts` — 3 unit tests covering PLAT-02, HSLD-08
- `tests/e2e/realtime.spec.ts` — 4 E2E tests covering ONBD-04, PLAT-01, PLAT-05 smoke

---

## Phase Gate Criteria

Phase 1 is complete when ALL of the following pass:

```bash
pnpm exec vitest run
# Expected: all unit + integration tests pass (RLS tests skip in CI if no Supabase creds)

pnpm exec playwright test
# Expected: all E2E tests pass (tests requiring live auth sessions may skip in CI)

pnpm build
# Expected: zero TypeScript errors
```

Manual verification required for:
- PLAT-04: confirm region = eu-central-1 in Supabase Dashboard
- PLAT-05: test GDPR deletion end-to-end in staging by deleting a test user and confirming table cleanup
