---
phase: 2
title: "Home Chores — Implementation Context"
created: 2026-04-02
source: discuss-phase session
---

# Phase 2 Context: Home Chores

Implementation decisions for researcher and executor agents. These supplement PLAN.md files and answer questions the plans should not re-open.

---

## App Identity

- App name: **Kinship** (established in Phase 1)
- Chores module accent colour: **blue** (`#0053dc` — primary) per CAL-02 colour spec

---

## A. Task List Layout (`/chores`)

**Primary view:** flat list, sorted by due date ascending (soonest first).

**Status** is displayed as a label/badge on each task row — not used as a grouping or column.

**Status values (exact):** `To Do` | `In Progress` | `Done`

**Filters (all on same page, no separate routes):**
- Filter by status: multi-select (show all / To Do / In Progress / Done)
- Filter by house area: dropdown of household's saved areas
- Sort by date: ascending (default) or descending toggle

**Completed tasks:** remain visible in the list (filtered out by default — "Hide done" toggle or status filter). Not deleted on completion.

**Dashboard card** (from Phase 1 stub `// TODO: Phase 2`): show the 3 nearest upcoming tasks (status ≠ Done, sorted by starts_at asc). Include task name, area label, due date. "View all" link → `/chores`.

---

## B. Task Creation & Schema

### Form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Task name | text input | yes | max 200 chars |
| Area | dropdown | yes | household areas list + "Create area" option |
| Starts | date + time picker | yes | this IS the due date/time |
| Ends | date + time picker | no | optional end time; defines duration |
| Repeat | frequency config | no | see Section D |
| Owner | dropdown | yes | list of household members; default = current user |
| Notes | textarea | no | free text, no max enforced in v1 |

### "Starts" = due date
`starts_at` is the canonical due date. `ends_at` is optional and defines a time window (e.g. "Clean kitchen 9am–11am"). No separate "due_date" column.

### House areas
Stored as a household-level `chore_areas` table — not per-task free text. "Create area" in the dropdown saves a new row to `chore_areas` for the household, making it reusable across all future tasks.

**Default areas seeded on household creation (or first chores module activation):**
`Kitchen` | `Bedroom` | `Living Room` | `Garden` | `Full House`

Users can add custom areas. No deletion UI required in Phase 2 (no tasks would break; defer to Phase 6 polish).

### Drizzle schema additions

```typescript
// chore_areas — household-level reusable areas
export const choreAreas = pgTable('chore_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  notes: text('notes'),                          // nullable
  areaId: uuid('area_id').references(() => choreAreas.id, { onDelete: 'set null' }),
  // owner_id references household_members.id (cross-table FK — use plain uuid, add constraint in migration)
  ownerId: uuid('owner_id'),
  status: text('status').notNull().default('todo'), // 'todo' | 'in_progress' | 'done'
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),   // nullable
  // Recurrence
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrenceRule: jsonb('recurrence_rule'),       // see Section D
  parentTaskId: uuid('parent_task_id'),           // FK to tasks.id — set for all occurrences
  createdBy: uuid('created_by').notNull(),        // auth.users cross-schema
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
```

**Status values in DB:** `'todo'` | `'in_progress'` | `'done'` (snake_case in DB; display labels are "To Do" / "In Progress" / "Done")

**RLS:** all members of the household can SELECT, INSERT, UPDATE, DELETE tasks for their household. No admin restriction on tasks — CHORE-09 (equal access) applies.

---

## C. Notifications

**Delivery channels: in-app + email only.** No web push (service worker / VAPID) in Phase 2.

**In-app notifications:**
- A notification bell icon in the app header showing unread count
- Notification records stored in a `notifications` table per user
- Realtime: new notifications pushed via Supabase Realtime (same `RealtimeProvider` pattern as Phase 1)

**Email notifications via Resend + Inngest** (same pattern as `send-invite-email`):
- CHORE-08: assignment notification — sent immediately when a task is assigned to a member (Inngest event `chore/task.assigned`)
- CHORE-10: due date reminder — sent X hours before `starts_at` (configurable per task or global default); Inngest `step.sleep` or `step.waitForEvent` to delay

**Reminder configuration (CHORE-10):**
- Default: remind 1 day before `starts_at`
- User can configure per task: 1 hour / 3 hours / 1 day / 2 days before
- Stored as `reminder_offset_minutes: number` on the task row (null = use default)

**`notifications` table (new):**
```typescript
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),             // recipient — cross-schema FK
  type: text('type').notNull(),                  // 'task_assigned' | 'task_reminder'
  entityId: uuid('entity_id'),                   // task id
  message: text('message').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),  // null = unread
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
```

**Settings page:** Phase 1 `/settings` has a "Notifications" section marked "Coming soon." Phase 2 activates it with a single toggle: "Email me when I'm assigned a task" (default: on). The per-task reminder offset is set on the task form, not in global settings.

---

## D. Recurring Task Mechanics

### Frequency config

User selects:
- **Frequency:** `Daily` | `Weekly` | `Monthly` | `Yearly`
- **Every:** number input (e.g. "3" → every 3 days / every 3 months)
- **On:** calendar date picker — specific day within the cycle:
  - Monthly/Yearly: day of month (e.g. 3rd of the month)
  - Weekly: day of week (Mon–Sun)
  - Daily: no "On" field shown

**`recurrence_rule` JSONB structure:**
```json
{
  "frequency": "daily" | "weekly" | "monthly" | "yearly",
  "interval": 3,
  "on_day_of_month": 15,   // for monthly/yearly (1–31); null otherwise
  "on_day_of_week": 1      // for weekly (0=Sun … 6=Sat); null otherwise
}
```

### Occurrence generation

**All occurrences are pre-generated at task creation** — not lazily on completion.

- When a recurring task is saved, a Server Action (or Inngest function) immediately creates individual task rows for all occurrences up to **1 year ahead**, all linked via `parent_task_id`.
- The parent task row itself (`parent_task_id = null`) is the template — not shown in the task list. Only occurrence rows are shown.
- `isRecurring = true` on all rows (parent + occurrences); occurrences also have `parentTaskId` set.

**On mark-as-complete:**
- The occurrence row's status → `'done'`
- It is filtered out of the default task list view (hidden unless "Show done" is toggled)
- No new occurrence is generated (all are already pre-created)
- CHORE-06 ("auto-regenerate") is satisfied by the upfront pre-generation

**Edit recurring task:**
- Editing the parent task updates all future (not-yet-done) occurrences
- UI prompt: "Update this occurrence only / Update all future occurrences" — Phase 2 implements "all future" only; "this one only" is a Phase 6 enhancement

---

## E. Activity Feed Events (Phase 2 additions)

Extend the existing `activity_feed` with new event types:

| Event type | Copy template |
|------------|---------------|
| `task_created` | "[Name] added a task: [Task name]" |
| `task_completed` | "[Name] completed: [Task name]" |
| `task_assigned` | "[Name] assigned [Task name] to [Owner name]" |

Link from activity feed entry → `/chores` (no deep link to individual task in Phase 2).

---

## code_context

```
src/lib/db/schema.ts           — add choreAreas, tasks, notifications tables
src/app/actions/household.ts   — Server Action pattern to follow
src/lib/inngest/functions/send-invite-email.ts  — Inngest function pattern to follow
src/components/realtime/RealtimeProvider.tsx    — extend context to include notifications
src/app/(app)/settings/page.tsx — add notification toggle to Notifications section
stitch/DESIGN.md / DESIGN 2.md — design system (no-line rule, tokens, card patterns)
```

**Reusable Phase 1 assets:**
- `src/components/ui/` — Button, Card, Input, Label, Badge, Avatar, Dialog, Separator
- `src/components/realtime/RealtimeProvider.tsx` — extend context with `notifications` + `unreadCount`
- Inngest client at `src/lib/inngest/client.ts`
- Server Action authentication pattern (getUser → validate → db op → return result)
- Drizzle query patterns in dashboard/page.tsx and household actions

---

*Created: 2026-04-02 — discuss-phase session*
