# Phase 2: Home Chores — Research

**Researched:** 2026-04-02
**Domain:** Task management, recurring jobs, in-app + email notifications, Drizzle schema migration, Supabase Realtime, Inngest v4
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Identity**
- App name: Kinship (established in Phase 1)
- Chores module accent colour: blue (`#0053dc` — primary) per CAL-02 colour spec

**Task List Layout (`/chores`)**
- Primary view: flat list, sorted by due date ascending (soonest first)
- Status displayed as badge on each row — not used for grouping
- Status values (exact): `To Do` | `In Progress` | `Done`
- Filters (same page, no separate routes): status multi-select, house area dropdown, sort direction toggle
- Completed tasks remain visible, filtered out by default ("Hide done" toggle)
- Dashboard card (from Phase 1 stub): 3 nearest upcoming tasks (status != Done), task name + area + due date, "View all" link to `/chores`

**Task Creation and Schema**
- Form fields: Task name (text, max 200), Area (dropdown + "Create area"), Starts (date+time, required = canonical due date), Ends (date+time, optional), Repeat (frequency config), Owner (dropdown, defaults to current user), Notes (textarea, no v1 max)
- `starts_at` is the canonical due date; `ends_at` is an optional time window; no separate `due_date` column
- House areas stored in `chore_areas` table (household-level, reusable), not per-task free text
- Default areas seeded: `Kitchen | Bedroom | Living Room | Garden | Full House`
- Users can add custom areas; no deletion UI required in Phase 2
- Exact Drizzle schema for `chore_areas`, `tasks`, `notifications` — see CONTEXT.md Section B and C (copied verbatim below in Architecture Patterns)
- DB status values: `'todo'` | `'in_progress'` | `'done'` (display: "To Do" / "In Progress" / "Done")
- RLS: all household members can SELECT, INSERT, UPDATE, DELETE tasks for their household (CHORE-09 equal access)

**Notifications**
- Delivery: in-app + email only; NO web push (no service worker / VAPID) in Phase 2
- In-app: notification bell in header, unread count badge, `notifications` table per user, pushed via Supabase Realtime (same RealtimeProvider pattern)
- Email via Resend + Inngest: `chore/task.assigned` event for immediate assignment notification; `step.sleep` for due-date reminder delay
- Reminder default: 1 day before `starts_at`; per-task options: 1 hour / 3 hours / 1 day / 2 days; stored as `reminder_offset_minutes: number | null` on the task row
- Settings page: activate "Email me when I'm assigned a task" toggle in `/settings` Notifications section (currently "Coming soon" stub)

**Recurring Task Mechanics**
- Frequency: Daily | Weekly | Monthly | Yearly; interval number; "On" (day of week for weekly, day of month for monthly/yearly)
- `recurrence_rule` JSONB structure: `{ frequency, interval, on_day_of_month, on_day_of_week }`
- All occurrences pre-generated at creation time (1 year ahead) via Server Action or Inngest function — NOT lazy
- Parent task row (`parent_task_id = null`) is the template — NOT shown in task list; only occurrence rows shown
- `isRecurring = true` on all rows; occurrences have `parentTaskId` set
- On complete: occurrence status → `'done'`; no new occurrence generated (all pre-created)
- Edit recurring: "Update all future occurrences" only in Phase 2 ("this one only" deferred to Phase 6)

**Activity Feed**
- Extend existing `activity_feed` with: `task_created`, `task_completed`, `task_assigned` event types
- All link to `/chores` (no deep link to individual task in Phase 2)

**Code Context**
- Files to modify: `src/lib/db/schema.ts`, `src/app/actions/household.ts` (pattern), `src/lib/inngest/functions/send-invite-email.ts` (pattern), `src/components/realtime/RealtimeProvider.tsx`, `src/app/(app)/settings/page.tsx`
- Reusable Phase 1 components: Button, Card, Input, Label, Badge, Avatar, Dialog, Separator from `src/components/ui/`

### Claude's Discretion

- Whether occurrence pre-generation is a Server Action or an Inngest background function (both are viable; research should inform)
- Exact plan decomposition / wave structure for Phase 2
- Date/time picker component strategy (shadcn/ui or add new component)
- Notification bell UI implementation details

### Deferred Ideas (OUT OF SCOPE)

- Web push notifications (VAPID / service workers) — deferred to Phase 6
- "This occurrence only" edit mode for recurring tasks — deferred to Phase 6
- Area deletion UI — deferred to Phase 6
- Deep links to individual tasks from activity feed — deferred to Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHORE-01 | User can create a task with title, description, category, assignee, and due date | Schema patterns (Section B CONTEXT.md), Server Action pattern from household.ts, Drizzle migration pattern from 0000_flaky_sage.sql |
| CHORE-02 | User can assign a task to any household member (including themselves) | `ownerId` uuid on tasks table, household members dropdown query |
| CHORE-03 | User can mark a task as complete | UPDATE task status → `'done'` via Server Action; Realtime triggers refresh |
| CHORE-04 | User can edit and delete tasks | Server Action pattern; DELETE cascades via FK; edit recurring updates all future occurrences |
| CHORE-05 | User can create recurring tasks (daily / weekly / monthly / custom frequency) | Pre-generation approach (Server Action vs Inngest): research finding favors Server Action for < ~50 tasks; recurrence_rule JSONB |
| CHORE-06 | Recurring tasks auto-regenerate on completion | Satisfied by upfront pre-generation (1 year of occurrences created at task creation) — no regeneration needed on complete |
| CHORE-07 | User can organise tasks into categories (e.g. Cleaning, Garden, Admin) | `chore_areas` table with household-level seeded defaults + custom areas |
| CHORE-08 | User receives in-app and push notification when a task is assigned to them | Inngest `chore/task.assigned` event → insert to `notifications` table + send Resend email; Realtime pushes notification record to browser |
| CHORE-09 | All household members can view and edit all tasks | RLS: household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()) — all four operations |
| CHORE-10 | User receives a configurable reminder before a task's due date (in-app and push) | Inngest step.sleep delay computed from `starts_at - reminder_offset_minutes`; insert notification + send Resend email |
</phase_requirements>

---

## Summary

Phase 2 builds the Home Chores module on top of the already-solid Phase 1 foundation. The database layer needs three new tables (`chore_areas`, `tasks`, `notifications`) with RLS, added to the Supabase Realtime publication. The Inngest pattern from `send-invite-email` extends directly to two new functions: one for immediate task-assignment emails and one for delayed reminders using `step.sleep`. The RealtimeProvider extends to include a second subscribed table (`notifications`) and expose `notifications` + `unreadCount` to consumers. The settings page requires activating the "Notifications" section that is currently a stub.

The most architecturally interesting decision is the recurring task pre-generation strategy. Because the user-chosen window is 1 year and frequency can be daily (365 rows), a Server Action is appropriate for the common cases (weekly/monthly = ≤ 52 rows) but could be slow for daily tasks. The safe choice is a dedicated Inngest background function that generates occurrences asynchronously — returning the parent task ID immediately and generating rows in the background without blocking the form submission. This also keeps Server Actions under Vercel's 10s timeout.

The UI layer is largely assembly work: the `/chores` page is a new App Router route, the task form uses existing shadcn/ui primitives (Input, Label, Button, Badge, Dialog), and a date/time picker needs to be added (`react-day-picker` is already pulled in transitively via `date-fns`; for time inputs the simplest approach is a native HTML `<input type="time">`). The notification bell is a new header component consuming the extended RealtimeContext.

**Primary recommendation:** Use an Inngest background function for occurrence pre-generation; extend RealtimeProvider with a `notifications` subscription; follow the Server Action pattern from `household.ts` for all CRUD; use the migration pattern from `0000_flaky_sage.sql` for new tables with RLS.

---

## Standard Stack

### Core (already installed — verified from package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | Schema definition, query builder, migrations | Established in Phase 1; all tables follow Drizzle pgTable + pgPolicy pattern |
| drizzle-kit | ^0.31.10 | Migration generation (`drizzle-kit generate`) | Same migration workflow already used |
| @supabase/supabase-js | ^2.100.1 | Realtime subscriptions, admin client | Established in Phase 1 |
| inngest | ^4.1.0 | Background jobs, delayed steps | Established in Phase 1; v4 2-arg createFunction confirmed |
| resend | ^6.9.4 | Transactional email | Established in Phase 1 via send-invite-email pattern |
| react-hook-form | ^7.72.0 | Task creation form | Already installed; reduces re-render on form inputs |
| zod | ^3.x (peer) | Input validation | Already used in household.ts Server Actions |
| date-fns | ^4.1.0 | Date arithmetic for recurrence generation | Already installed |
| lucide-react | ^1.7.0 | Icons (Bell, CheckSquare, Calendar) | Already used in ModuleCard |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwind-merge | ^3.5.0 | Class merging for conditional styles | Badge status variants (todo/in_progress/done) |
| @base-ui/react | ^1.3.0 | Dialog for task form | Confirmed used in Phase 1 (invite flow); no Radix dependency |

### Not Needed (do not add)

| Instead of | Could Use | Reason to Skip |
|------------|-----------|----------------|
| A date/time picker library | `react-day-picker`, `react-datepicker` | date-fns is already installed; use native `<input type="date">` + `<input type="time">` wrapped in a thin component. Avoids additional bundle weight for a non-critical UX element in Phase 2. |
| `rrule` library | custom recurrence generator | The recurrence_rule is simple (daily/weekly/monthly/yearly with interval + one anchor field). Custom generation with date-fns `addDays`, `addWeeks`, `addMonths`, `addYears` covers all cases and avoids an iCal RFC dependency. |
| `date-fns-tz` | date-fns | Supabase stores all timestamps WITH TIME ZONE; JS Date handles offset correctly when parsing ISO strings from Postgres. No explicit timezone library needed. |

**Installation:** No new packages required. All dependencies are present from Phase 1.

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
src/
├── app/(app)/
│   └── chores/
│       ├── page.tsx              # Server Component: task list + filters (URL params)
│       ├── ChoresClient.tsx      # Client Component: filter state, optimistic updates
│       └── new/
│           └── page.tsx          # Task creation form route (or Dialog on /chores)
├── app/actions/
│   └── tasks.ts                  # Server Actions: createTask, updateTask, deleteTask,
│                                 #   updateTaskStatus, createChoreArea, seedDefaultAreas
├── components/
│   ├── chores/
│   │   ├── TaskList.tsx          # Task row list — receives tasks prop
│   │   ├── TaskRow.tsx           # Single task row: name, area badge, due date, status badge, actions
│   │   ├── TaskForm.tsx          # Create/Edit form using react-hook-form
│   │   ├── RecurrenceConfig.tsx  # Frequency/interval/on-day sub-form
│   │   └── TaskFilters.tsx       # Status + area filter + sort controls
│   ├── notifications/
│   │   ├── NotificationBell.tsx  # Bell icon + unread count badge — reads from useRealtime()
│   │   └── NotificationDropdown.tsx  # List of recent notifications
│   └── realtime/
│       └── RealtimeProvider.tsx  # EXTEND (not replace) — add notifications state
├── lib/
│   ├── db/
│   │   ├── schema.ts             # ADD choreAreas, tasks, notifications tables
│   │   └── migrations/
│   │       └── 0001_phase2_chores.sql  # Generated by drizzle-kit generate
│   └── inngest/
│       └── functions/
│           ├── send-task-assigned-email.ts   # chore/task.assigned handler
│           └── send-task-reminder.ts         # chore/task.reminder.scheduled handler (step.sleep)
└── app/api/inngest/route.ts      # EXTEND: add new functions to serve()
```

### Pattern 1: Drizzle Schema with RLS (extend schema.ts)

**What:** Add three tables following the exact Phase 1 pattern — pgTable with pgPolicy() in the second argument array.

**Cross-schema FK note:** `created_by` and `user_id` (notifications) reference `auth.users` — must be plain `uuid()` in Drizzle, with the FK constraint added manually in the migration SQL (same pattern as Phase 1).

**Example (from CONTEXT.md, confirmed matches existing pattern):**

```typescript
// Source: CONTEXT.md + verified against src/lib/db/schema.ts
import { boolean, integer, jsonb, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'

export const choreAreas = pgTable(
  'chore_areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('chore_areas_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select ${authUid})
      )`,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select ${authUid})
      )`,
    }),
  ]
)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notes: text('notes'),
    areaId: uuid('area_id').references(() => choreAreas.id, { onDelete: 'set null' }),
    ownerId: uuid('owner_id'),           // cross-schema: household_members.id — add FK in migration
    status: text('status').notNull().default('todo'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: jsonb('recurrence_rule'),
    parentTaskId: uuid('parent_task_id'), // self-ref FK added in migration
    reminderOffsetMinutes: integer('reminder_offset_minutes'), // null = use default (1440)
    createdBy: uuid('created_by').notNull(), // cross-schema: auth.users — add FK in migration
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('tasks_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select ${authUid})
      )`,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select ${authUid})
      )`,
    }),
  ]
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),   // cross-schema: auth.users — add FK in migration
    type: text('type').notNull(),        // 'task_assigned' | 'task_reminder'
    entityId: uuid('entity_id'),
    message: text('message').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('notifications_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select ${authUid})`,
    }),
    pgPolicy('notifications_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = (select ${authUid})
      )`,
    }),
    pgPolicy('notifications_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select ${authUid})`,
    }),
  ]
)
```

**RLS performance note (from skill `security-rls-performance.md`):** Always wrap `auth.uid()` (and `authUid`) in `(select ...)` to prevent per-row evaluation. The Phase 1 migration confirms this pattern is already in use: `WHERE user_id = (select auth.uid())`.

**Migration extras (append to generated SQL):**

```sql
-- Self-referential FK on tasks
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fk"
  FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL;

-- Cross-schema FKs
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Indexes for RLS policy columns (per skill: query-missing-indexes)
CREATE INDEX tasks_household_id_idx ON tasks (household_id);
CREATE INDEX tasks_starts_at_idx ON tasks (starts_at);
CREATE INDEX tasks_status_idx ON tasks (status);
CREATE INDEX tasks_owner_id_idx ON tasks (owner_id);
CREATE INDEX notifications_user_id_idx ON notifications (user_id);
CREATE INDEX notifications_household_id_idx ON notifications (household_id);
```

### Pattern 2: Server Action (CRUD for tasks and areas)

**What:** Follow the exact pattern in `src/app/actions/household.ts` — getUser() → validate (Zod) → db op → return result.

**Example:**

```typescript
// Source: src/app/actions/household.ts pattern
'use server'

import { z } from 'zod'
import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tasks, choreAreas, activityFeed } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  areaId: z.string().uuid().nullable(),
  ownerId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  reminderOffsetMinutes: z.number().nullable().optional(),
  recurrenceRule: z.object({
    frequency: z.enum(['daily','weekly','monthly','yearly']),
    interval: z.number().min(1),
    on_day_of_month: z.number().nullable(),
    on_day_of_week: z.number().nullable(),
  }).nullable().optional(),
})

export async function createTask(householdId: string, data: unknown) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = createTaskSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const [newTask] = await db.insert(tasks).values({
    householdId,
    createdBy: user.id,
    ...parsed.data,
  }).returning()

  // Fire-and-forget: pre-generate occurrences and send notifications via Inngest
  if (parsed.data.recurrenceRule) {
    await inngest.send({ name: 'chore/recurring.task.created', data: { taskId: newTask.id } })
  }
  if (parsed.data.ownerId !== user.id) {
    await inngest.send({ name: 'chore/task.assigned', data: { taskId: newTask.id, ownerId: parsed.data.ownerId } })
  }

  // Activity feed
  await db.insert(activityFeed).values({
    householdId, actorId: user.id, eventType: 'task_created',
    entityType: 'task', entityId: newTask.id,
    metadata: { taskTitle: newTask.title },
  })

  return { success: true, taskId: newTask.id }
}
```

### Pattern 3: Inngest v4 Function (email + delayed reminder)

**What:** Follow the exact pattern in `send-invite-email.ts`. Inngest v4 uses 2-arg `createFunction` (confirmed: options object with `triggers` array, then handler). For the reminder function, use `step.sleep` with a duration string computed from the offset.

**Assignment email (immediate):**

```typescript
// Source: src/lib/inngest/functions/send-invite-email.ts pattern
export const sendTaskAssignedEmail = inngest.createFunction(
  {
    id: 'send-task-assigned-email',
    name: 'Send Task Assigned Email',
    triggers: [{ event: 'chore/task.assigned' }],
  },
  async ({ event, step }) => {
    // step.run for DB lookup (idempotent)
    const taskData = await step.run('fetch-task', async () => {
      // db query for task + owner + household name
    })

    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-task-assigned-email] RESEND_API_KEY not set — skipping')
      return { skipped: true }
    }

    await step.run('send-email', async () => {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({ ... })
    })
  }
)
```

**Reminder email (delayed via step.sleep):**

```typescript
export const sendTaskReminderEmail = inngest.createFunction(
  {
    id: 'send-task-reminder-email',
    name: 'Send Task Reminder Email',
    triggers: [{ event: 'chore/task.reminder.scheduled' }],
  },
  async ({ event, step }) => {
    const { taskId, startsAt, reminderOffsetMinutes } = event.data
    const offsetMs = (reminderOffsetMinutes ?? 1440) * 60 * 1000
    const remindAt = new Date(new Date(startsAt).getTime() - offsetMs)
    const sleepUntil = remindAt.toISOString()

    // step.sleepUntil waits until a specific timestamp (Inngest v4)
    await step.sleepUntil('wait-for-reminder-time', sleepUntil)

    // Re-check task is still not done before sending
    const task = await step.run('fetch-task', async () => { /* db query */ })
    if (task?.status === 'done') return { skipped: true, reason: 'task already done' }

    await step.run('insert-notification', async () => {
      // db insert into notifications
    })

    await step.run('send-email', async () => {
      // Resend email
    })
  }
)
```

**Register in route.ts:**

```typescript
// Source: src/app/api/inngest/route.ts pattern
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendInviteEmail,
    sendTaskAssignedEmail,
    sendTaskReminderEmail,
    generateRecurringOccurrences,  // if Inngest approach chosen
  ],
})
```

### Pattern 4: Inngest Function for Occurrence Pre-generation

**What:** When a recurring task is created, fire `chore/recurring.task.created` event → Inngest function generates all occurrence rows using date-fns, then inserts them in a batch.

**Why Inngest rather than Server Action:** Daily recurrence over 1 year = 365 INSERT rows. A Server Action runs inline on the Vercel request; Vercel's default function timeout is 10s. 365 DB inserts can take 2–5s on a cold connection — it is too close to the limit. Inngest background functions have no Vercel timeout constraint. For weekly/monthly use cases (52 or 12 rows) a Server Action would work, but a single Inngest approach covers all frequencies safely.

**Occurrence generation logic with date-fns:**

```typescript
// Source: verified date-fns v4 API
import { addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns'

function generateOccurrenceDates(
  startsAt: Date,
  rule: { frequency: string; interval: number; on_day_of_month?: number | null; on_day_of_week?: number | null }
): Date[] {
  const cutoff = addYears(startsAt, 1)
  const dates: Date[] = []
  let current = startsAt

  while (isBefore(current, cutoff)) {
    dates.push(current)
    switch (rule.frequency) {
      case 'daily':   current = addDays(current, rule.interval); break
      case 'weekly':  current = addWeeks(current, rule.interval); break
      case 'monthly': current = addMonths(current, rule.interval); break
      case 'yearly':  current = addYears(current, rule.interval); break
    }
  }
  return dates  // first element = parent task itself (skip when inserting occurrences)
}
```

**Batch insert with Drizzle:**

```typescript
// Drizzle supports array insert: db.insert(tasks).values([...rows])
await db.insert(tasks).values(occurrences.map(date => ({
  householdId: parentTask.householdId,
  title: parentTask.title,
  notes: parentTask.notes,
  areaId: parentTask.areaId,
  ownerId: parentTask.ownerId,
  status: 'todo',
  startsAt: date,
  endsAt: parentTask.endsAt ? computeEndTime(date, parentTask) : null,
  isRecurring: true,
  recurrenceRule: parentTask.recurrenceRule,
  parentTaskId: parentTask.id,
  reminderOffsetMinutes: parentTask.reminderOffsetMinutes,
  createdBy: parentTask.createdBy,
})))
```

### Pattern 5: Extending RealtimeProvider

**What:** Add `notifications` subscription and expose `notifications` + `unreadCount` to context consumers. The existing pattern (Phase 1) subscribes to `activity_feed` via `postgres_changes`. Extend the same channel.

**Key detail from Phase 1 code:** The channel is named `household:${householdId}` and listens on `postgres_changes`. For per-user notifications (where `userId = current user's ID`), subscribe to `notifications` with a `user_id=eq.${userId}` filter.

**Extended context interface:**

```typescript
// Source: src/components/realtime/RealtimeProvider.tsx — extend this interface
export interface NotificationItem {
  id: string
  type: 'task_assigned' | 'task_reminder'
  entityId: string | null
  message: string
  readAt: string | null
  createdAt: string
}

export interface RealtimeContextValue {
  status: ConnectionStatus
  activityItems: ActivityFeedItem[]
  notifications: NotificationItem[]   // NEW
  unreadCount: number                  // NEW — derived: notifications.filter(n => !n.readAt).length
}
```

**Subscription addition inside the existing useEffect:**

```typescript
// Add to the existing channel.on() chain
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,   // userId passed as new prop from server
  },
  (payload) => {
    const newNotif = payload.new as NotificationItem
    setNotifications((prev) => [newNotif, ...prev])
  }
)
```

**Note:** The `userId` must be passed as a prop to `RealtimeProvider` (the server layout already calls `supabase.auth.getUser()` and can pass it down). Alternatively, use a Supabase client-side `getUser()` call inside the provider — but passing from the server is simpler and avoids an extra round-trip.

### Pattern 6: Notification Bell Component

**What:** A client component in the app header that reads `notifications` and `unreadCount` from `useRealtime()`.

```typescript
// Reads from extended RealtimeContext
'use client'
import { Bell } from 'lucide-react'
import { useRealtime } from '@/components/realtime/RealtimeProvider'
import { Badge } from '@/components/ui/badge'

export function NotificationBell() {
  const { unreadCount, notifications } = useRealtime()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2">
        <Bell className="h-5 w-5 text-kinship-on-surface" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center
                            bg-kinship-primary text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>
      {open && <NotificationDropdown notifications={notifications} />}
    </div>
  )
}
```

### Pattern 7: Date/Time Input for Task Form

**What:** Use native HTML date and time inputs wrapped in a thin component. No additional library needed.

**Rationale:** `date-fns` is already installed for recurrence logic. Native `<input type="date">` + `<input type="time">` are universally supported, require no bundle cost, and produce ISO values that map directly to Postgres `timestamptz` columns via `new Date(`${date}T${time}`).toISOString()`.

```typescript
// Thin wrapper consistent with shadcn/ui Input styling
export function DateTimePicker({ value, onChange, label, required }: DateTimePickerProps) {
  const [date, time] = value ? [value.slice(0,10), value.slice(11,16)] : ['', '']
  return (
    <div className="flex gap-2">
      <Input type="date" value={date} required={required}
        onChange={e => onChange(`${e.target.value}T${time || '00:00'}:00Z`)} />
      <Input type="time" value={time}
        onChange={e => onChange(`${date}T${e.target.value}:00Z`)} />
    </div>
  )
}
```

### Pattern 8: Task List with Filters (URL State)

**What:** The `/chores` page uses URL search params for filter state (status, areaId, sort) so filters are shareable and survive page refresh. The Server Component reads params and queries Drizzle with `where` clauses; a Client Component handles the filter UI and pushes URL updates.

```typescript
// Server Component: src/app/(app)/chores/page.tsx
export default async function ChoresPage({ searchParams }: { searchParams: Record<string, string> }) {
  const status = searchParams.status?.split(',') ?? []
  const areaId = searchParams.area ?? null
  const sort = searchParams.sort === 'desc' ? desc(tasks.startsAt) : asc(tasks.startsAt)
  // ...Drizzle query with .where(and(...conditions)).orderBy(sort)
}
```

### Anti-Patterns to Avoid

- **Lazy occurrence generation on completion:** Do NOT generate the next occurrence when a task is marked done. All occurrences are pre-generated at creation. This avoids a read-modify-write race condition on completion.
- **RLS without `(select ...)` wrapper:** Do NOT write `WHERE user_id = auth.uid()` — always `WHERE user_id = (select auth.uid())`. Phase 1 already sets this pattern; verify all new policies follow it.
- **Inngest reminder without status re-check:** After `step.sleepUntil`, always re-fetch the task to confirm it is not already `'done'` before sending the reminder. Tasks can be completed before the reminder fires.
- **Blocking Server Action for occurrence generation:** Do NOT run 365 INSERT statements synchronously in a Server Action. Fire the Inngest event and return immediately; generate in background.
- **Direct realtime subscription to `tasks` for the task list:** The task list is a Server Component that re-renders via `router.refresh()` (same pattern as `household_members` in Phase 1). Do NOT maintain a client-side `tasks` state — let the Server Component re-fetch on refresh trigger.
- **Forgetting to register new Inngest functions:** The route at `src/app/api/inngest/route.ts` must explicitly list every function in the `functions` array — new functions will NOT be invoked if not registered.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Delayed email/reminder scheduling | Custom cron job, `setTimeout`, DB polling | Inngest `step.sleepUntil` | Inngest persists sleep state; serverless functions can't hold open timers; DB polling is wasteful |
| Recurrence date arithmetic | Custom date math | `date-fns` `addDays/addWeeks/addMonths/addYears` | date-fns is already installed; handles DST edge cases, leap years |
| Form state management | Controlled React state with `useState` per field | `react-hook-form` (already installed) | Already used in project; reduces re-renders; built-in Zod resolver |
| RLS-based data isolation | Manual `WHERE user_id = ?` in every query | Postgres RLS policies | RLS enforces at DB level — app bugs can't leak cross-household data |
| In-app notification delivery | WebSockets, SSE, polling | Supabase Realtime `postgres_changes` | Already set up in Phase 1 for `activity_feed`; same channel, same pattern |
| Email transactional sending | Custom SMTP | Resend (already installed) | Established in Phase 1; has retry / delivery tracking |

**Key insight:** Phase 2 has zero new dependencies. Every problem is solved by a library already in package.json or a pattern already in the codebase.

---

## Common Pitfalls

### Pitfall 1: Inngest step.sleep vs step.sleepUntil Confusion

**What goes wrong:** Using `step.sleep('wait', '1 day')` instead of `step.sleepUntil('wait', isoTimestamp)` for reminder scheduling. `step.sleep` takes a relative duration; `step.sleepUntil` takes an absolute ISO timestamp. For reminders tied to `starts_at`, you must compute the absolute timestamp.

**Why it happens:** The Inngest docs show `step.sleep` in most examples; the distinction is easy to miss.

**How to avoid:** Compute `remindAt = new Date(startsAt - reminderOffsetMinutes * 60_000).toISOString()` and call `step.sleepUntil('wait-for-reminder-time', remindAt)`.

**Warning signs:** Reminders firing at wrong times; reminder arriving immediately (duration = 0).

### Pitfall 2: Supabase Realtime Filter for Per-User Notifications

**What goes wrong:** Subscribing to the `notifications` table without a row filter — all notifications for all users in the household are pushed to every client.

**Why it happens:** The existing `activity_feed` subscription uses a `household_id=eq.${householdId}` filter (household-wide). Notifications are per-user.

**How to avoid:** Use `filter: \`user_id=eq.${userId}\`` on the `notifications` subscription. The `userId` must be the authenticated user's `auth.users.id` (UUID), not the `household_members.id`.

**Warning signs:** Users seeing each other's notification counts.

### Pitfall 3: Parent Task Appearing in Task List

**What goes wrong:** The query for `/chores` returns the parent template row (which has `parent_task_id = null` and `is_recurring = true`) alongside occurrence rows, creating a duplicate-looking "phantom" task.

**How to avoid:** Filter the task list query to exclude parent templates:
```typescript
// Only show non-parent rows: either not recurring, or is an occurrence
.where(and(
  eq(tasks.householdId, householdId),
  or(
    eq(tasks.isRecurring, false),
    isNotNull(tasks.parentTaskId),   // is an occurrence, not the parent
  ),
  ...otherFilters
))
```

**Warning signs:** Tasks appearing doubled with one having no owner/area.

### Pitfall 4: Cross-Schema FK Not Added to Migration

**What goes wrong:** `drizzle-kit generate` produces the Drizzle schema but does NOT emit `FOREIGN KEY ... REFERENCES auth.users(id)` constraints (cross-schema FKs cannot be expressed in Drizzle's API). If the manual SQL block is not appended to the generated migration, the FK is silently missing.

**Why it happens:** Established in Phase 1 (same issue with `household_members.user_id`). Phase 2 adds two more cross-schema FKs (`tasks.created_by` and `notifications.user_id`).

**How to avoid:** After running `drizzle-kit generate`, open the generated `.sql` file and manually append the FK constraints and `ALTER PUBLICATION` statements.

**Warning signs:** Migration runs without errors (missing FK is not an error), but orphaned task/notification rows persist after user deletion.

### Pitfall 5: Occurrence Reminder Events Not Scheduled

**What goes wrong:** Creating occurrence rows without firing the `chore/task.reminder.scheduled` Inngest event for each occurrence. The reminder function only fires when the event is sent — occurrence insertion alone does not trigger it.

**How to avoid:** After batch-inserting occurrence rows, iterate and call `inngest.send` for each occurrence that has a non-null `owner_id` and a `starts_at` in the future.

**Performance note:** `inngest.send` accepts a batch — use `inngest.send([...events])` to send all reminder events in a single API call.

### Pitfall 6: RLS INSERT Policy Missing for Notifications

**What goes wrong:** The `notifications` table INSERT policy must allow household members to insert (since Server Actions insert notification records on behalf of other members). If only a `SELECT` policy for the recipient exists, Inngest background functions (which run as the service role) and Server Actions (which run as the acting user) may fail differently.

**How to avoid:** Use a two-policy approach: SELECT restricted to `user_id = (select auth.uid())`; INSERT allowed to any household member via `household_id IN (...)`. For Inngest functions that need to bypass RLS entirely, use the Supabase admin client (`createAdminClient()`) for the notification INSERT — same pattern as the invite claiming in Phase 1.

---

## Code Examples

### Verified: Inngest v4 createFunction signature

```typescript
// Source: src/lib/inngest/functions/send-invite-email.ts (confirmed working v4.1.0)
inngest.createFunction(
  {
    id: 'function-id',
    name: 'Human Readable Name',
    triggers: [{ event: 'namespace/event.name' }],  // v4: triggers is in options, NOT 3rd arg
  },
  async ({ event, step }) => {
    // handler
  }
)
```

### Verified: Drizzle pgPolicy with select/authUid pattern

```typescript
// Source: src/lib/db/schema.ts (confirmed in 0000_flaky_sage.sql output)
pgPolicy('policy_name', {
  for: 'select',
  to: authenticatedRole,
  using: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = (select ${authUid})
  )`,
})
// The (select ...) wrapper is critical — prevents per-row function evaluation
```

### Verified: Drizzle batch insert

```typescript
// Source: Drizzle ORM docs (verified installed version ^0.45.1 supports array values)
await db.insert(tasks).values([
  { ...row1 },
  { ...row2 },
  // up to 365 rows
])
// All rows inserted in a single round-trip
```

### Verified: Supabase Realtime postgres_changes with filter

```typescript
// Source: src/components/realtime/RealtimeProvider.tsx pattern
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  },
  (payload) => { /* handle */ }
)
```

### Verified: Server Action authentication pattern

```typescript
// Source: src/app/actions/household.ts (confirmed)
'use server'
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) return { success: false, error: 'Not authenticated' }
// use getUser() NOT getSession() — confirmed decision in STATE.md
```

---

## State of the Art

| Old Approach | Current Approach | Relevant to Phase 2 |
|--------------|------------------|---------------------|
| 3-arg Inngest `createFunction(options, trigger, handler)` | 2-arg: `createFunction({...options, triggers: [...]}, handler)` | CRITICAL — v4 only (confirmed v4.1.0 in package.json) |
| Tailwind `tailwind.config.ts` | CSS-first `@theme inline {}` in globals.css | Design token usage (`kinship-primary`, etc.) |
| Radix UI Dialog | `@base-ui/react` Dialog | Task form Dialog — use base-ui (confirmed in STATE.md) |
| `getSession()` for auth checks | `getUser()` (JWT-verified) | All Server Actions must use `getUser()` |

**Deprecated/outdated in this project:**
- 3-arg Inngest `createFunction`: already replaced in send-invite-email.ts
- shadcn/ui component generation via `npx shadcn@latest add` installs Radix-based components — this project uses `@base-ui/react` instead. Add UI components manually or confirm they don't add Radix deps.

---

## Open Questions

1. **Notification bell initial load**
   - What we know: RealtimeProvider handles new inserts via `postgres_changes`. The bell needs to show unread count on first page load (before any Realtime event fires).
   - What's unclear: Where does the initial `notifications` array come from? Either: (a) Server Component fetches recent unread notifications and passes them as a prop to RealtimeProvider, or (b) the client fetches on mount.
   - Recommendation: Pass initial notifications as a prop from the server layout, same pattern as `activityItems` would be seeded if that were needed. The Server Component at `src/app/(app)/layout.tsx` (or wherever RealtimeProvider lives) queries `notifications WHERE user_id = ? AND read_at IS NULL ORDER BY created_at DESC LIMIT 20` and passes the result as `initialNotifications` prop.

2. **Where does RealtimeProvider receive userId?**
   - What we know: The current `RealtimeProvider` only receives `householdId`. The `notifications` subscription needs `userId` for the per-user filter.
   - Recommendation: Add `userId: string` as a second prop to `RealtimeProvider`. The server layout has both values from `supabase.auth.getUser()` and the household query.

3. **Settings page: where is the "Notifications" section stub?**
   - What we know: The settings page at `src/app/(app)/settings/page.tsx` has only Profile and Danger Zone sections. The context says "Coming soon" in a Notifications section — but no such section currently exists in the file.
   - Recommendation: The planner should include a task to add the Notifications section to settings (email assignment toggle) with a new Server Action to persist the preference. A `notification_preferences` field could live on `household_members` (simplest) or a separate table (overkill for Phase 2). Recommend adding a `email_task_assigned: boolean DEFAULT true` column to `household_members` via the Phase 2 migration.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 + Playwright ^1.58.2 |
| Config file | `vitest.config.ts` (exists) + `playwright.config.ts` |
| Quick run command | `pnpm test` (vitest run --passWithNoTests) |
| Full suite command | `pnpm test && pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHORE-01 | createTask Server Action validates input and inserts row | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 |
| CHORE-02 | Task can be assigned to any household member | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 |
| CHORE-03 | updateTaskStatus sets status to 'done' | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 |
| CHORE-04 | deleteTask removes row; updateTask modifies title/area | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 |
| CHORE-05 | generateOccurrences returns correct dates for each frequency | unit | `pnpm test tests/unit/chores/recurrence.test.ts` | ❌ Wave 0 |
| CHORE-06 | Pre-generation: 1-year window produces expected count (daily=365, weekly=52) | unit | `pnpm test tests/unit/chores/recurrence.test.ts` | ❌ Wave 0 |
| CHORE-07 | createChoreArea inserts row; seedDefaultAreas creates 5 areas | unit | `pnpm test tests/unit/chores/areas.test.ts` | ❌ Wave 0 |
| CHORE-08 | Inngest send-task-assigned-email skips gracefully when RESEND_API_KEY unset | unit | `pnpm test tests/unit/chores/notifications.test.ts` | ❌ Wave 0 |
| CHORE-09 | RLS: cross-household task read is blocked | integration | `pnpm test tests/unit/db/rls.test.ts` (extend) | ❌ Wave 0 (extend existing) |
| CHORE-10 | sendTaskReminderEmail fires after correct sleep delay | unit (mock) | `pnpm test tests/unit/chores/notifications.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test && pnpm test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/chores/tasks.test.ts` — covers CHORE-01, CHORE-02, CHORE-03, CHORE-04
- [ ] `tests/unit/chores/recurrence.test.ts` — covers CHORE-05, CHORE-06 (pure date logic, no DB)
- [ ] `tests/unit/chores/areas.test.ts` — covers CHORE-07
- [ ] `tests/unit/chores/notifications.test.ts` — covers CHORE-08, CHORE-10
- [ ] Extend `tests/unit/db/rls.test.ts` with tasks + notifications table assertions — covers CHORE-09
- [ ] Extend `tests/helpers/factories.ts` with `makeTestTask`, `makeTestChoreArea`, `makeTestNotification` helpers

---

## Plan Decomposition Recommendation

Phase 2 breaks naturally into 5 parallel-friendly plans across 3 waves:

**Wave 1 (foundation — must complete before Wave 2):**
- **02-01-PLAN:** Schema + migration (chore_areas, tasks, notifications tables + RLS + indexes + Realtime publication + email_task_assigned on household_members) + seed Server Action for default areas

**Wave 2 (parallel):**
- **02-02-PLAN:** Task CRUD + areas (Server Actions: createTask, updateTask, deleteTask, updateTaskStatus, createChoreArea; Zod schemas; activity feed events)
- **02-03-PLAN:** Recurring task generation (Inngest function `generate-recurring-occurrences`; date-fns occurrence logic; reminder event dispatch)
- **02-04-PLAN:** Notifications (Inngest send-task-assigned-email + send-task-reminder; extend RealtimeProvider; NotificationBell + NotificationDropdown components; settings toggle)

**Wave 3 (depends on 02-02 for data, 02-04 for notifications):**
- **02-05-PLAN:** UI — `/chores` page (task list, filters, task form, dashboard card stub replacement, settings Notifications section activation)

---

## Sources

### Primary (HIGH confidence)

- `src/lib/inngest/functions/send-invite-email.ts` — confirmed Inngest v4 2-arg createFunction signature
- `src/lib/db/schema.ts` — confirmed Drizzle pgTable + pgPolicy + authUid pattern
- `src/lib/db/migrations/0000_flaky_sage.sql` — confirmed migration structure, cross-schema FK pattern, ALTER PUBLICATION pattern
- `src/components/realtime/RealtimeProvider.tsx` — confirmed Supabase Realtime `postgres_changes` subscription pattern
- `src/app/actions/household.ts` — confirmed Server Action authentication + Zod validation pattern
- `package.json` — confirmed all dependency versions (inngest 4.1.0, drizzle-orm 0.45.1, date-fns 4.1.0, resend 6.9.4, react-hook-form 7.72.0, @base-ui/react 1.3.0)
- `.planning/phases/02-home-chores/02-CONTEXT.md` — all locked decisions verified
- `.planning/STATE.md` — key architectural decisions: getUser() not getSession(), base-ui not Radix, Inngest v4 2-arg form
- `.claude/skills/supabase-postgres-best-practices/references/security-rls-performance.md` — (select auth.uid()) wrapper pattern

### Secondary (MEDIUM confidence)

- `vitest.config.ts` — test infrastructure confirmed: Vitest + jsdom, tests in `tests/unit/`
- `tests/unit/db/rls.test.ts` — RLS test pattern for extending with Phase 2 tables
- `tests/helpers/factories.ts` — factory helper pattern for Wave 0 test scaffolding

### Tertiary (LOW confidence — verify before implementation)

- `step.sleepUntil` vs `step.sleep` API in Inngest v4.1.0: the distinction is documented but not exercised in the codebase yet. Verify the exact method name against Inngest v4 docs before writing the reminder function.
- `inngest.send([...events])` batch API: batch sending is documented for Inngest but not used in the codebase. Verify the exact API signature for v4.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from package.json; no new installs needed
- Architecture: HIGH — all patterns directly derived from existing Phase 1 code
- Pitfalls: HIGH — derived from existing code structure and Phase 1 decisions in STATE.md
- Inngest step.sleepUntil: MEDIUM — API exists per docs but not yet used in codebase

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable stack; all packages already locked)
