---
plan: "01-06"
phase: 1
title: "Module-based dashboard skeleton — Server Component, ModuleCard, DashboardGrid"
status: complete
---

## What was built

A Server Component dashboard that reads `active_modules` from `household_settings` via Drizzle and renders one placeholder `ModuleCard` per activated module.

### Files created

| File | Purpose |
|------|---------|
| `src/app/(app)/dashboard/page.tsx` | Server Component: auth guard → Drizzle JOIN query → render DashboardGrid |
| `src/components/dashboard/ModuleCard.tsx` | Placeholder card with module icon, label, description, "Coming soon" badge |
| `src/components/dashboard/DashboardGrid.tsx` | CSS grid (1/2/3 col responsive) that maps activeModules → ModuleCard |
| `src/components/dashboard/EmptyModuleState.tsx` | Shown when activeModules is empty; links to /settings/modules |
| `tests/unit/dashboard/dashboard.test.ts` | 8 async unit tests for DashboardGrid and ModuleCard |
| `tests/e2e/onboarding.spec.ts` | E2E smoke tests (redirect + wizard UI); auth-requiring tests skip without SUPABASE_URL |

### Key decisions

- **Server Component for data fetching**: Dashboard page is async, reads DB via Drizzle — no client-side fetch needed.
- **Drizzle JOIN query**: `householdMembers → households → householdSettings` in one query rather than multiple round trips.
- **Redirect on no household**: Dashboard redirects to `/onboarding` if user has no household entry; middleware handles the unauthenticated case.
- **Module expansion point**: `ModuleCard` is intentionally a placeholder — Phases 2–5 will replace "Coming soon" with real content.
- **Test mocking**: `lucide-react` v1.x and `@base-ui/react` (used in shadcn Badge) both conflict with jsdom in pnpm's virtual store. Both are mocked in tests. `resolve.dedupe: ['react', 'react-dom']` added to `vitest.config.ts` as a baseline deduplication measure.

### Requirements covered

- ONBD-03: Household creation flows to a working dashboard
- ONBD-04: Dashboard renders only the modules the user activated

### Verification

- `pnpm exec vitest run tests/unit/` → 24/24 passed (13 wizard + 3 RLS + 8 dashboard)
- `pnpm build` → compiled successfully, `/dashboard` route present as dynamic (ƒ)
- `grep -n "household_settings" src/app/(app)/dashboard/page.tsx` → confirms Drizzle query
