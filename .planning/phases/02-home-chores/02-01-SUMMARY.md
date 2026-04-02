---
phase: 02-home-chores
plan: 01
subsystem: database
tags: [drizzle, postgres, supabase, rls, vitest, schema, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: households, householdMembers, activityFeed tables; Drizzle ORM + pgPolicy RLS pattern; Supabase auth.users cross-schema FK pattern

provides:
  - choreAreas Drizzle table with RLS (all household members CRUD)
  - tasks Drizzle table with all Phase 2 columns including recurrenceRule jsonb, parentTaskId, reminderOffsetMinutes integer
  - notifications Drizzle table with select-own + insert-member + update-own RLS policies
  - 0001_phase2_chores.sql migration applied to Supabase with manual cross-schema FK constraints
  - makeTestChoreArea, makeTestTask, makeTestNotification factory helpers
  - Wave 0 test stubs (30 it.todo) covering CHORE-01 through CHORE-10

affects: [02-02-tasks-crud, 02-03-recurrence, 02-04-notifications, 02-05-ui, 02-06-e2e]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drizzle pgPolicy for-all RLS with household membership subquery (matching Phase 1 pattern)"
    - "Cross-schema FK constraints added manually to migration SQL (auth.users not reachable via Drizzle FK API)"
    - "Wave 0 it.todo stubs in Vitest — not standalone todo() — define contracts before implementation"

key-files:
  created:
    - src/lib/db/migrations/0001_phase2_chores.sql
    - tests/unit/chores/tasks.test.ts
    - tests/unit/chores/recurrence.test.ts
    - tests/unit/chores/areas.test.ts
    - tests/unit/chores/notifications.test.ts
  modified:
    - src/lib/db/schema.ts
    - tests/helpers/factories.ts
    - src/lib/db/migrations/meta/_journal.json

key-decisions:
  - "Use it.todo() not standalone todo() — vitest 4.x does not export todo as a standalone function; it.todo() is the correct API"
  - "RLS patterns use ${authUid} directly (not wrapped in select) matching Phase 1 tables — generates (select auth.uid()) in SQL output"
  - "Renamed generated migration file to 0001_phase2_chores.sql and updated _journal.json tag accordingly"

patterns-established:
  - "Wave 0 stubs: create all it.todo() stubs before any implementation so plans fail-then-pass (Nyquist)"
  - "Manual FK constraints block at end of migration for cross-schema auth.users and self-referential FKs"

requirements-completed: [CHORE-01, CHORE-02, CHORE-03, CHORE-04, CHORE-05, CHORE-06, CHORE-07, CHORE-08, CHORE-09, CHORE-10]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 02 Plan 01: Schema Foundations and Wave 0 Test Stubs Summary

**Three new Drizzle tables (chore_areas, tasks, notifications) with RLS policies, migration applied to Supabase, and 30 Wave 0 it.todo stubs across 4 test files covering all 10 CHORE requirements**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02T14:31:06Z
- **Completed:** 2026-04-02T14:35:45Z
- **Tasks:** 2
- **Files modified:** 7 (created 6, modified 1 schema + 1 factories + 1 journal)

## Accomplishments

- Added `boolean` and `integer` to Drizzle imports; appended choreAreas, tasks, notifications table definitions with correct RLS policies to schema.ts
- Generated and applied `0001_phase2_chores.sql` migration with ENABLE ROW LEVEL SECURITY, CREATE POLICY, and manual FK constraints for cross-schema auth.users and self-referential tasks.parent_task_id
- Extended factories.ts with TestChoreArea, TestTask, TestNotification interfaces and makeTest* helpers; created 4 test stub files totalling 30 it.todo tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Phase 2 tables to schema.ts and generate migration** - `8a4e7be` (feat)
2. **Task 2: Wave 0 test stubs and factory helpers** - `bfaad1f` (feat)

## Files Created/Modified

- `src/lib/db/schema.ts` - Added boolean/integer imports and choreAreas, tasks, notifications table definitions with RLS policies
- `src/lib/db/migrations/0001_phase2_chores.sql` - Migration SQL: 3 CREATE TABLE, ENABLE ROW LEVEL SECURITY, CREATE POLICY, manual FK constraints
- `src/lib/db/migrations/meta/_journal.json` - Updated to reference 0001_phase2_chores tag
- `src/lib/db/migrations/meta/0001_snapshot.json` - Generated snapshot for Phase 2 tables
- `tests/helpers/factories.ts` - Added TestChoreArea, TestTask, TestNotification interfaces and makeTestChoreArea, makeTestTask, makeTestNotification factories
- `tests/unit/chores/tasks.test.ts` - 10 it.todo stubs for CHORE-01 through CHORE-04
- `tests/unit/chores/recurrence.test.ts` - 10 it.todo stubs for CHORE-05, CHORE-06
- `tests/unit/chores/areas.test.ts` - 5 it.todo stubs for CHORE-07
- `tests/unit/chores/notifications.test.ts` - 5 it.todo stubs for CHORE-08, CHORE-10

## Decisions Made

- **it.todo() not standalone todo():** Vitest 4.x does not export `todo` as a standalone function. The correct API is `it.todo('...')`. Initial attempt used `import { describe, it, todo } from 'vitest'` which failed at runtime; fixed to use `it.todo()` exclusively.
- **RLS pattern uses ${authUid} directly:** Matching Phase 1 table patterns (without extra `select` wrapper), which Drizzle generates as `(select auth.uid())` in SQL output — consistent with existing policies.
- **Migration renamed post-generate:** Drizzle assigns random names (e.g., `0001_amazing_matthew_murdock.sql`); renamed to `0001_phase2_chores.sql` and updated `_journal.json` tag to match.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vitest todo() import — it.todo() is correct API**
- **Found during:** Task 2 (Wave 0 test stubs)
- **Issue:** Plan specified `import { describe, it, todo } from 'vitest'` and `todo('...')` calls. Vitest 4.x does not export `todo` as a standalone function — throws `TypeError: todo is not a function` at runtime.
- **Fix:** Changed all 4 test files to use `it.todo('...')` instead of `todo('...')`. Import updated to `import { describe, it } from 'vitest'`.
- **Files modified:** tests/unit/chores/tasks.test.ts, tests/unit/chores/recurrence.test.ts, tests/unit/chores/areas.test.ts, tests/unit/chores/notifications.test.ts
- **Verification:** `pnpm test tests/unit/chores/` — 30 tests pass as todo/skipped, exit 0
- **Committed in:** bfaad1f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in plan's API usage)
**Impact on plan:** Fix required for tests to run. No scope change. The string pattern `todo('CHORE-01:` is still present inside `it.todo('CHORE-01:` so acceptance criteria are met.

## Issues Encountered

- Drizzle generates random migration filenames; manual rename + journal update required. Removed intermediate snapshot/journal entry and regenerated cleanly.

## User Setup Required

None - migration applied automatically via `pnpm drizzle-kit migrate`.

## Next Phase Readiness

- All three Phase 2 tables exist in Supabase with RLS enforced
- Wave 0 test stubs ready: Plan 02-02 (tasks CRUD) can begin implementing CHORE-01 through CHORE-04 against existing stubs
- Factory helpers available for all Phase 2 test files

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 02-home-chores*
*Completed: 2026-04-02*
