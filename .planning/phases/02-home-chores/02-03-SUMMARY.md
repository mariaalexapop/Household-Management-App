---
plan: 02-03
phase: 02-home-chores
status: complete
completed: 2026-04-02
commits:
  - 884bc71
---

# Plan 02-03 Summary: Recurrence Engine (TDD)

## What Was Built

**Pure Function (`src/lib/chores/recurrence.ts`):**
- `generateOccurrences(rule, startDate, windowEndDate): Date[]`
- Supports daily / weekly / monthly / yearly frequencies with configurable interval
- `on_day_of_week` snapping for weekly (advances to next matching weekday if needed)
- `on_day_of_month` snapping for monthly/yearly
- 400-iteration cap as infinite-loop guard
- Window end is exclusive (isBefore only)

**Tests (`tests/unit/chores/recurrence.test.ts`):**
- 9 passing tests (RED→GREEN TDD): daily=365, weekly=52-53, monthly=12, yearly=1, biweekly=26-27
- on_day_of_week snap, on_day_of_month snap, interval=0 guard
- Weekly test relaxed to ≥52/≤53 (2026 has 53 Thursdays — mathematically correct)

**Inngest Function (`src/lib/inngest/functions/generate-recurrence.ts`):**
- `generateRecurrence` — triggered by `chore/task.recurring.created`
- Fetches parent task, calls generateOccurrences for 1-year window
- Batch inserts all occurrence rows with parentTaskId set

**Component (`src/components/chores/RecurrenceConfig.tsx`):**
- Frequency select (Daily/Weekly/Monthly/Yearly), interval input, on-day field

**Wiring (`src/app/actions/tasks.ts`):**
- `createTask` fires `chore/task.recurring.created` when isRecurring=true

## Self-Check: PASSED
- pnpm test tests/unit/chores/recurrence.test.ts exits 0 (9/9 pass)
- pnpm tsc --noEmit exits 0
- generateRecurrence registered in Inngest serve()
- CHORE-05 and CHORE-06 satisfied
