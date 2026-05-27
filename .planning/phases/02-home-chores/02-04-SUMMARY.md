---
phase: 02-home-chores
plan: 04
subsystem: notifications
tags: [inngest, resend, email, notifications, drizzle, supabase]

# Dependency graph
requires:
  - phase: 02-home-chores
    plan: 01
    provides: notifications table, tasks table, householdMembers table; Drizzle schema

provides:
  - sendTaskAssignedEmail Inngest function (chore/task.assigned event)
  - sendTaskReminder Inngest function (chore/task.reminder.scheduled event, step.sleepUntil)
  - Both functions registered in Inngest serve() route
  - createTask fires chore/task.assigned + chore/task.reminder.scheduled events
  - In-app notification rows inserted for task_assigned and task_reminder types
  - Graceful degradation when RESEND_API_KEY is absent

affects: [02-05-ui, 02-06-e2e]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inngest step.sleepUntil for delayed scheduled jobs (reminder fires X minutes before starts_at)"
    - "RESEND_API_KEY guard pattern: log warning and return { skipped: true } when key absent"
    - "Admin client (createAdminClient) for cross-schema auth.users email lookup in Inngest functions"

key-files:
  created:
    - src/lib/inngest/functions/send-task-assigned-email.ts
    - src/lib/inngest/functions/send-task-reminder.ts
  modified:
    - src/app/api/inngest/route.ts
    - src/app/actions/tasks.ts

key-decisions:
  - "step.sleepUntil used over step.sleep: sleepUntil(id, Date) accepts an absolute timestamp, which is the correct primitive for reminder-at-startsAt-minus-offset semantics"
  - "reminderOffsetMinutes ?? 1440 default applied at event-send time in createTask (not in the Inngest function itself) so the default is explicit in the event payload"
  - "tasks.ts created with full CRUD from 02-02 plan spec + notification events from this plan: parallel wave execution required a complete file rather than a delta patch"

# Metrics
duration: 10min
completed: 2026-04-02
---

# Phase 02 Plan 04: Notifications (Task Assignment + Reminder) Summary

**Inngest functions for CHORE-08 (task assignment email + in-app notification) and CHORE-10 (due-date reminder with step.sleepUntil, email + in-app notification), both registered in serve(), with graceful RESEND_API_KEY fallback**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-02
- **Completed:** 2026-04-02
- **Tasks:** 2 (Task 1: sendTaskAssignedEmail, Task 2: sendTaskReminder + route + tasks.ts)
- **Files modified:** 4 (created 2, modified 2)

## Accomplishments

- Created `send-task-assigned-email.ts`: triggers on `chore/task.assigned`, resolves assigner display name from `householdMembers`, inserts `task_assigned` notifications row, looks up recipient email via admin client, sends Resend email with `#0053dc` CTA button linking to `/chores`
- Created `send-task-reminder.ts`: triggers on `chore/task.reminder.scheduled`, uses `step.sleepUntil` to delay until `startsAt - reminderOffsetMinutes`, inserts `task_reminder` notifications row, sends reminder email
- Updated `route.ts`: added `sendTaskAssignedEmail` and `sendTaskReminder` imports and registrations in `serve()` array (preserving existing `sendInviteEmail` and `generateRecurrence`)
- Updated `tasks.ts` `createTask`: added `chore/task.assigned` event (when owner differs from creator) and `chore/task.reminder.scheduled` event with `reminderOffsetMinutes ?? 1440` default

## Task Commits

Each task was committed atomically:

1. **Task 1: sendTaskAssignedEmail Inngest function** - feat(02-04): task 1 — sendTaskAssignedEmail function
2. **Task 2: sendTaskReminder + route.ts + tasks.ts** - feat(02-04): task 2 — sendTaskReminder, register both in serve(), fire events in createTask

## Files Created/Modified

- `src/lib/inngest/functions/send-task-assigned-email.ts` — Inngest function for chore/task.assigned: step.run for assigner name lookup, notification insert, email send via Resend
- `src/lib/inngest/functions/send-task-reminder.ts` — Inngest function for chore/task.reminder.scheduled: step.sleepUntil, notification insert, email send via Resend
- `src/app/api/inngest/route.ts` — Added sendTaskAssignedEmail and sendTaskReminder to serve() functions array
- `src/app/actions/tasks.ts` — Added chore/task.assigned and chore/task.reminder.scheduled event sends to createTask

## Decisions Made

- **step.sleepUntil over step.sleep:** `step.sleepUntil(id, Date)` accepts an absolute timestamp — correct primitive for "fire N minutes before starts_at." `step.sleep` takes a relative duration string, which would require computing time-until-fire at the moment the function runs (wrong if Inngest retries).
- **reminderOffsetMinutes ?? 1440 at event-send time:** The default is applied in `createTask` before sending the event payload so the Inngest function always receives a concrete number (not null). Keeps the function stateless and the default explicit in the audit trail.
- **tasks.ts parallel wave handling:** Plans 02-02, 02-03, and 02-04 all modify `tasks.ts` (parallel Wave 2). Since 02-03 had already created the file with recurrence support, this plan performed a targeted edit to add the notification event sends rather than overwriting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tasks.ts already existed from Plan 02-03 — targeted edit instead of full create**
- **Found during:** Task 2
- **Issue:** Plan assumed `src/app/actions/tasks.ts` did not yet exist and provided a full file to create. However, Plan 02-03 (parallel wave) had already created the file with recurrence support (`chore/task.recurring.created`).
- **Fix:** Read existing file content, then performed a targeted `Edit` to add the `chore/task.assigned` and `chore/task.reminder.scheduled` event sends inside `createTask` — preserving all existing content.
- **Files modified:** src/app/actions/tasks.ts
- **Impact:** None to functionality. The resulting file satisfies all acceptance criteria for this plan while maintaining Plan 02-03's additions.

**2. [Rule 3 - Blocking] route.ts already had generateRecurrence from Plan 02-03**
- **Found during:** Task 2
- **Issue:** route.ts had been updated by Plan 02-03 to include `generateRecurrence`. Plan 02-04 spec showed the original one-function state.
- **Fix:** Read current file, then added only the two new imports and registrations, preserving `generateRecurrence`.
- **Files modified:** src/app/api/inngest/route.ts

## Self-Check: PASSED

- `src/lib/inngest/functions/send-task-assigned-email.ts` — exists, contains `export const sendTaskAssignedEmail`, `'chore/task.assigned'`, `db.insert(notifications)`, `type: 'task_assigned'`, `RESEND_API_KEY not configured`
- `src/lib/inngest/functions/send-task-reminder.ts` — exists, contains `export const sendTaskReminder`, `'chore/task.reminder.scheduled'`, `step.sleepUntil`, `type: 'task_reminder'`
- `src/app/api/inngest/route.ts` — contains `sendTaskAssignedEmail` and `sendTaskReminder`
- `src/app/actions/tasks.ts` — contains `'chore/task.reminder.scheduled'` and `reminderOffsetMinutes ?? 1440`

---
*Phase: 02-home-chores*
*Completed: 2026-04-02*
