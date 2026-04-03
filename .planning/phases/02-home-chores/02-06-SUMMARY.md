---
phase: 02-home-chores
plan: "06"
subsystem: dashboard
tags: [dashboard, chores, card, upcoming-tasks]
dependency_graph:
  requires: [02-02, 02-03, 02-05]
  provides: [chores-dashboard-card]
  affects: [dashboard]
tech_stack:
  added: []
  patterns: [drizzle-query, server-component, dashboard-card]
key_files:
  created:
    - src/components/dashboard/ChoresDashboardCard.tsx
  modified:
    - src/components/dashboard/DashboardGrid.tsx
    - src/app/(app)/dashboard/page.tsx
    - tests/unit/dashboard/dashboard.test.ts
decisions:
  - "Used 'chores' module key (not 'home_chores') to match existing ModuleKey type in onboarding store"
  - "DashboardGrid renders ChoresDashboardCard when module key is 'chores', falls back to ModuleCard for all other modules"
  - "Excluded parent recurring task templates from dashboard query by filtering status != 'done' only (no parentTaskId filter needed — occurrence rows have starts_at set)"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-03"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 4
---

# Phase 2 Plan 06: Home Chores Dashboard Card Summary

**One-liner:** ChoresDashboardCard renders 3 nearest non-done tasks (name, area, due date) on the dashboard, replacing the generic ModuleCard stub for the chores module.

---

## Status

**Partial — stopped at checkpoint:human-verify (Task 2)**

Task 1 (auto) is complete and committed. Task 2 requires human verification of the full Phase 2 chores flow before marking Phase 2 complete.

---

## Tasks Completed

### Task 1: ChoresDashboardCard component and dashboard wiring

**Commit:** 23e0895

**What was built:**

1. **`src/components/dashboard/ChoresDashboardCard.tsx`** — New card component:
   - Shows up to 3 upcoming tasks (title, area name, formatted due date `EEE d MMM`)
   - Empty state: "No upcoming tasks. Add a task to get started."
   - "View all tasks →" link to `/chores`
   - Styled with `CheckSquare` icon and kinship design tokens

2. **`src/components/dashboard/DashboardGrid.tsx`** — Updated:
   - Accepts new `upcomingTasks: UpcomingTask[]` prop
   - Renders `ChoresDashboardCard` when module key is `'chores'`
   - Falls back to `ModuleCard` for all other module keys

3. **`src/app/(app)/dashboard/page.tsx`** — Updated:
   - Selects `householdId` from `householdMembers` in the join
   - Conditionally fetches top-3 non-done tasks with `leftJoin(choreAreas)` when `'chores'` is in `activeModules`
   - Passes `upcomingTasks` to `DashboardGrid`

4. **`tests/unit/dashboard/dashboard.test.ts`** — Updated:
   - Added mocks for `@/components/ui/card` and `date-fns`
   - Updated tests to reflect that `'chores'` now renders `ChoresDashboardCard` (not `ModuleCard`)
   - Badge count expectations corrected (4 "Coming soon" for 5 modules, 1 for chores+car)
   - Added 2 new tests: empty state and task list rendering

**Verification:** `pnpm tsc --noEmit` exits 0; `pnpm vitest run tests/unit/dashboard` → 10/10 tests pass.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Module key mismatch: plan used 'home_chores', codebase uses 'chores'**
- **Found during:** Task 1 implementation
- **Issue:** Plan spec referenced `'home_chores'` throughout but `ModuleKey` type and all existing code uses `'chores'`
- **Fix:** Used `'chores'` key in `DashboardGrid` conditional and `activeModules.includes('chores')` in page
- **Files modified:** DashboardGrid.tsx, dashboard/page.tsx
- **Commit:** 23e0895

**2. [Rule 1 - Bug] Existing dashboard tests broke after adding required `upcomingTasks` prop**
- **Found during:** Task 1 verification (`pnpm tsc --noEmit`)
- **Issue:** 4 TypeScript errors — existing tests called `DashboardGrid` without the new required prop; badge count expectations were wrong after chores switched from ModuleCard to ChoresDashboardCard
- **Fix:** Updated test file — added prop, card/date-fns mocks, corrected badge counts, added 2 new tests
- **Files modified:** tests/unit/dashboard/dashboard.test.ts
- **Commit:** 23e0895

---

## Self-Check: PASSED

- [x] `src/components/dashboard/ChoresDashboardCard.tsx` exists and exports `ChoresDashboardCard`
- [x] `src/components/dashboard/DashboardGrid.tsx` contains `ChoresDashboardCard` and `chores`
- [x] `src/app/(app)/dashboard/page.tsx` contains `upcomingTasks` and `ne(tasksTable.status`
- [x] Commit `23e0895` exists
- [x] `pnpm tsc --noEmit` exits 0
- [x] All 10 dashboard unit tests pass
