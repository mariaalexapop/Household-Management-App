---
phase: 3
title: "Kids Activities — Implementation Context"
created: 2026-04-06
source: discuss-phase session
---

# Phase 3 Context: Kids Activities

Implementation decisions for researcher and executor agents. These supplement PLAN.md files and answer questions the plans should not re-open.

---

## Scope Note — Unified Calendar Pulled Forward

The unified calendar (CAL-01 to CAL-04) is being built in Phase 3, not Phase 4.

**Why:** The user wants the calendar to show all events across all modules from day one — not a kids-only calendar that gets replaced later. Phase 3 will deliver the calendar component showing Chores + Kids data. Phase 4 plugs Car / Insurance / Electronics data into the existing component.

**Impact on Phase 4:** The calendar build is no longer part of Phase 4. Phase 4 delivers tracker modules (car, insurance, electronics) and their data integration into the existing Phase 3 calendar.

---

## A. Module Page Layout (`/kids`)

**Default view:** Activity list — flat list of upcoming activities across all children, sorted by date/time ascending (same pattern as `/chores`).

**View toggle:** List ↔ Calendar toggle — Claude's discretion on exact control (icon buttons or segmented control). Either way, the toggle is compact and lives in the top-right of the content area.

**Filter by child:** Child tabs at the top of the list (one tab per child + "All" default). Switching tabs filters the list to that child's activities.

**Activity row shows:**
- Activity title
- Category badge (school / medical / sport / hobby / social — each in a distinct colour)
- Date and time
- Assignee name (the household member responsible for this activity)

**Dashboard card stub** (from Phase 1 `// TODO: Phase 3`): Show the 3 nearest upcoming activities across all children (status ≠ done, sorted by starts_at asc). Include title, child name, date. "View all" → `/kids`.

---

## B. Child Profiles — Lightweight Managed List

**No structured child profile pages.** KIDS-01/KIDS-02's "date of birth" field is deferred (see Deferred Ideas below).

**Instead:** A `children` table stores household-level child names only:

```typescript
export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
```

**UX:** On the activity form, "Child" is a dropdown populated from this `children` table. If the name doesn't exist yet, the user can type a new name and it gets saved as a new `children` row for the household. No separate manage-children page.

**Deletion:** Deleting a child from the managed list is not required in Phase 3 (no activities would break — cascade deletes can handle it; defer the UI to Phase 6 polish).

---

## C. Activity Schema

Activities mirror the chores `tasks` table pattern closely.

```typescript
export const kidActivities = pgTable('kid_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'school' | 'medical' | 'sport' | 'hobby' | 'social'
  location: text('location'),           // nullable
  assigneeId: uuid('assignee_id'),      // household member — cross-table FK
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  notes: text('notes'),
  reminderOffsetMinutes: integer('reminder_offset_minutes'), // null = default (1 day)
  // Recurrence — same JSONB pattern as tasks
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrenceRule: jsonb('recurrence_rule'),
  parentActivityId: uuid('parent_activity_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
```

**Activity form fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | text input | yes | max 200 chars |
| Child | dropdown | yes | from `children` table + "Add new child" |
| Category | dropdown | yes | school / medical / sport / hobby / social |
| Starts | date + time picker | yes | |
| Ends | date + time picker | no | optional end time |
| Location | text input | no | venue name or address |
| Assignee | dropdown | yes | household members; default = current user |
| Repeat | frequency config | no | same JSONB pattern as chores |
| Reminder | offset picker | no | 30 min / 1 hour / 3 hours / 1 day (default) / 2 days |
| Notes | textarea | no | |

---

## D. Recurring Activities

Same mechanic as Phase 2 chores:
- Pre-generate all occurrences up to 1 year ahead on creation
- All linked via `parentActivityId`
- `recurrenceRule` JSONB: `{ frequency, interval, on_day_of_month, on_day_of_week }` — identical structure to tasks
- Edit: "Update all future occurrences" only in Phase 3 (per-occurrence editing deferred to Phase 6)

---

## E. Notifications (KIDS-05)

Follows Phase 2 chores notification pattern exactly:
- **Assignee only** receives the reminder (not all household members)
- Default reminder: 1 day before `starts_at`
- Configurable per activity: 30 min / 1 hour / 3 hours / 1 day / 2 days
- Stored as `reminder_offset_minutes` on the activity row
- Delivery: in-app notification + email (Inngest delayed job, same `step.sleep` pattern as `chore/task.reminder`)
- Inngest event: `kids/activity.reminder`

---

## F. Unified Calendar (CAL-01 to CAL-04)

### Format
- **Month view** (default) and **week view** — toggleable
- Both views needed; month is the default

### Month grid cells
- Up to 2 events shown per day: coloured dot + short truncated title
- If more than 2 events: "+N more" link that expands inline or opens a popover listing all events for that day
- Clicking any event navigates directly to it in its source section (CAL-03)

### Module colours (CAL-02)
| Module | Colour |
|--------|--------|
| Chores | Blue (`#0053dc`) |
| Kids Activities | Green |
| Car Maintenance | Orange |
| Insurance | Purple |
| Electronics | Teal |

### Data sources (in Phase 3)
Phase 3 calendar shows:
1. **Chores** — task `starts_at` dates (from `tasks` table)
2. **Kids Activities** — activity `starts_at` dates (from `kid_activities` table)

Phase 4 will add Car / Insurance / Electronics data to the same calendar component — the component must be built with extension points for additional data sources.

### Navigation & interaction
- Previous/next month (or week) navigation controls
- Clicking a calendar event item → navigate to the source item (chore detail or activity detail)
- Week view: time-slot columns for each day; events placed at their time

### Calendar location
- Accessible from the `/kids` page as the calendar view (toggled via view switcher)
- Also exposed as a standalone `/calendar` route for the full unified view accessible from the main navigation

---

## G. Activity Feed Events (Phase 3 additions)

Extend existing `activity_feed`:

| Event type | Copy template |
|------------|---------------|
| `activity_created` | "[Name] added an activity for [Child]: [Title]" |
| `activity_completed` | "[Name] marked [Title] as done" |

---

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` §Kids Activities (KIDS-01 to KIDS-08) — full requirement list
- `.planning/REQUIREMENTS.md` §Calendar (CAL-01 to CAL-04) — pulled into Phase 3

### Prior phase patterns to replicate
- `.planning/phases/02-home-chores/02-CONTEXT.md` — task schema, recurrence pattern, notification pattern, form fields
- `.planning/phases/01-foundation-onboarding/01-CONTEXT.md` — design system, dashboard card stubs, notification infrastructure

### Stack
- `.planning/research/STACK.md` — stack decisions
- `.planning/research/ARCHITECTURE.md` — system architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/date-picker.tsx` — DatePicker component, reuse for starts_at / ends_at fields
- `src/components/ui/badge.tsx` — Badge for category labels on activity rows
- `src/components/ui/dialog.tsx` — Dialog for Add/Edit Activity modal
- `src/components/ui/card.tsx` — Card for calendar cells and dashboard card
- `src/components/ui/button.tsx` — Pill buttons (rounded-full, primary)
- `src/components/realtime/RealtimeProvider.tsx` — extend with kids_activities channel
- `src/components/notifications/NotificationBell.tsx` — already wired; new notification types added via DB rows only
- `src/lib/inngest/functions/send-invite-email.ts` — Inngest function pattern to replicate for activity reminders
- `src/lib/db/schema.ts` — add `children` and `kid_activities` tables following existing patterns

### Established Patterns
- **Server Actions** (`src/app/actions/`) — auth → validate → db op → return result
- **Drizzle queries** with `eq`, `and`, `gt`, `isNull` — see existing route handlers
- **Realtime**: Supabase channel subscription via `RealtimeProvider`
- **Recurrence JSONB**: `{ frequency, interval, on_day_of_month, on_day_of_week }` — identical to tasks
- **Reminder offsets**: `reminder_offset_minutes` INT on entity row; Inngest `step.sleep` for delay

### Integration Points
- Dashboard `/kids` stub card at `src/app/(app)/dashboard/page.tsx` — replace `// TODO: Phase 3` stub with real data query
- Navigation: add `/kids` and `/calendar` to the app nav (sidebar or header)
- `notifications` table — insert rows for `activity_reminder` type using existing schema

</code_context>

<deferred>
## Deferred Ideas

- **Child DOB field** — KIDS-01 specifies date of birth, but user simplified to name-only. DOB can be added as an optional field on the `children` table in a future phase if age-display features are needed (e.g. "Sophia, age 7").
- **Per-occurrence activity editing** ("Edit this occurrence only") — deferred to Phase 6 polish, consistent with chores.
- **Child profile deletion UI** — no delete button in Phase 3; cascade handles data integrity. UI deferred to Phase 6.
- **All-members reminder option** — user chose assignee-only for now; configurable "notify everyone" could be a notification settings toggle in a later phase.

</deferred>

---

*Phase: 03-kids-activities*
*Context gathered: 2026-04-06*
