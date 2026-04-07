# Phase 3: Kids Activities — Research

**Researched:** 2026-04-07
**Domain:** Kids activity tracking + unified calendar (React/Next.js 15 / Supabase / Inngest)
**Confidence:** HIGH — all findings drawn from existing codebase, installed packages, and established Phase 2 patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Child profiles = lightweight managed list (name only, no DOB) stored in a `children` table
- Activity form field "responsible parent" is labelled "Assignee" — same pattern as chores "Owner"
- Unified calendar (CAL-01 to CAL-04) is built in Phase 3, not Phase 4
- Calendar shows month view (default) and week view, togglable
- Month grid: up to 2 events per day with coloured dot + short label; "+N more" for overflow
- Clicking a calendar event navigates to the source item in its module section (CAL-03)
- Calendar exposed at `/kids` (view toggle) and `/calendar` (standalone route)
- Reminders → assignee only; same Inngest `step.sleepUntil` pattern as chores
- Recurring activities → same pre-generation pattern as tasks (1 year ahead, JSONB recurrenceRule)
- Child tabs filter the activity list view
- Dashboard card (replacing Phase 1 TODO stub): 3 nearest upcoming activities across all children, showing title + child name + date

### Module colours (locked by CAL-02)
| Module | Colour |
|--------|--------|
| Chores | Blue `#0053dc` |
| Kids Activities | Green |
| Car Maintenance | Orange |
| Insurance | Purple |
| Electronics | Teal |

### Claude's Discretion
- Exact control for view toggle (icon buttons vs segmented control) — keep compact, top-right
- Green shade for Kids Activities module colour (exact hex not specified)
- "+N more" behaviour: expand inline or open a popover — either is acceptable
- Calendar data query strategy — how to aggregate across tables with Phase 4 extension points

### Deferred Ideas (OUT OF SCOPE)
- Child DOB field (KIDS-01 mentions it but user simplified to name-only)
- Per-occurrence activity editing ("Edit this occurrence only") — Phase 6
- Child profile deletion UI — Phase 6 (cascade handles data integrity)
- All-members reminder option — future notification settings toggle
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KIDS-01 | User can create child profiles (name only; DOB deferred) | `children` table schema defined in CONTEXT.md; RLS pattern mirrors existing tables |
| KIDS-02 | User can add multiple children to the household | Same `children` table; "Add new child" inline on activity form |
| KIDS-03 | User can add an activity for a child (title, child, date/time, location, category, assignee) | `kid_activities` table schema defined; form mirrors TaskForm pattern |
| KIDS-04 | User can create recurring activities | Same `generateOccurrences` utility + `generate-recurrence` Inngest function pattern |
| KIDS-05 | User receives a reminder before an activity (configurable) | `send-task-reminder` Inngest function pattern to clone as `send-activity-reminder` |
| KIDS-06 | User can view a calendar of all kids activities across all children | `react-day-picker` v9 (already installed) for month grid; custom week view |
| KIDS-07 | User can edit and delete activities and child profiles | Same Server Action + optimistic update pattern as tasks |
| KIDS-08 | Activity categories: school / medical / sport / hobby / social | Badge component already exists; colour mapping needed |
| CAL-01 | Unified calendar aggregates chores + kids (Phase 3); car/insurance/electronics in Phase 4 | Data query design must be extensible — use a unified `CalendarEvent[]` type |
| CAL-02 | Each module has a distinct colour | Colour constants file; Kids = green, Chores = `#0053dc` |
| CAL-03 | Clicking calendar item navigates to source section | Each event carries `href` field pointing to `/chores` or `/kids` |
| CAL-04 | Calendar supports month view and week view | `react-day-picker` DayPicker for month; custom time-slot grid for week |
</phase_requirements>

---

## Summary

Phase 3 delivers two related but distinct features: (1) a kids activities module that mirrors the Phase 2 chores architecture closely, and (2) the unified cross-module calendar that Phase 4 will extend. Both features build on patterns already proven in Phase 2, so the research focus is on what is genuinely new: the calendar rendering strategy, the multi-source data query design, and the RLS implications of two new tables.

The key discovery is that `react-day-picker` v9 is **already installed** in the project (`package.json: "react-day-picker": "^9.14.0"`). It already powers the `DatePicker` component. Phase 3 can use its `mode="single"` and navigation APIs to build the month calendar grid without any new dependencies. The week view requires a custom time-slot layout in pure Tailwind — `react-day-picker` does not provide week/time-slot views.

For the calendar data layer, the correct architecture is a `CalendarEvent` union type consumed by a single calendar component. In Phase 3, two data sources populate this type (tasks, kid_activities). In Phase 4, additional sources are added without touching the calendar component.

**Primary recommendation:** Build the calendar as a single `UnifiedCalendar` component that accepts a `CalendarEvent[]` prop. The data-fetching page builds that array from multiple Drizzle queries. This keeps the component pure and the extension point explicit.

---

## Standard Stack

### Core (all already installed — no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-day-picker` | ^9.14.0 | Month calendar grid rendering | Already installed; used in DatePicker; v9 has clean classNames API compatible with Tailwind 4 |
| `date-fns` | ^4.1.0 | Date arithmetic for calendar navigation and recurrence | Already the project standard |
| `drizzle-orm` | ^0.45.1 | Drizzle queries for new `children` and `kid_activities` tables | Project ORM |
| `inngest` | ^4.1.0 | Delayed reminder jobs via `step.sleepUntil` | Established in Phase 2 |
| `zod` | ^4.3.6 | Schema validation in Server Actions | Project standard |
| `react-hook-form` | ^7.72.0 | Activity form state | Used in TaskForm; replicate pattern |
| `lucide-react` | ^1.7.0 | Calendar icon, chevrons, filter toggle | Project icon library |

### Supporting (existing UI components — no new installs)

| Component | File | Purpose |
|-----------|------|---------|
| `Badge` | `src/components/ui/badge.tsx` | Category labels (school/medical/sport/hobby/social) |
| `Dialog` | `src/components/ui/dialog.tsx` | Add/Edit Activity modal |
| `DatePicker` | `src/components/ui/date-picker.tsx` | Starts/Ends date fields on activity form |
| `Card` | `src/components/ui/card.tsx` | Calendar cell wrapper, dashboard card |
| `Button` | `src/components/ui/button.tsx` | View toggle, navigation controls |

### No new npm packages required

All calendar rendering, date arithmetic, form handling, and notification delivery is covered by the existing installed stack. The planner MUST NOT propose installing `react-big-calendar`, `fullcalendar`, or any other calendar library — `react-day-picker` plus custom Tailwind layout is sufficient and consistent with the project approach.

**Installation:** No new installs needed. Zero package changes.

---

## Architecture Patterns

### Recommended Project Structure (new files for Phase 3)

```
src/
├── app/
│   ├── (app)/
│   │   ├── kids/
│   │   │   ├── page.tsx              # Server component — fetches activities + children
│   │   │   └── KidsClient.tsx        # Client component — list/calendar toggle, dialogs
│   │   └── calendar/
│   │       └── page.tsx              # Server component — fetches all calendar events
├── actions/
│   └── kids.ts                       # Server Actions: createActivity, updateActivity, deleteActivity, createChild
├── components/
│   ├── kids/
│   │   ├── ActivityList.tsx          # Flat list of activities with child tabs
│   │   ├── ActivityRow.tsx           # Single activity row (title, badge, date, assignee)
│   │   ├── ActivityForm.tsx          # Add/Edit modal form
│   │   └── ChildTabs.tsx             # "All" + per-child tab filter
│   ├── calendar/
│   │   ├── UnifiedCalendar.tsx       # Accepts CalendarEvent[]; renders month or week
│   │   ├── CalendarMonthView.tsx     # DayPicker-based month grid
│   │   ├── CalendarWeekView.tsx      # Custom time-slot week grid
│   │   ├── CalendarEventDot.tsx      # Coloured dot + truncated label
│   │   └── DayEventsPopover.tsx      # "+N more" overflow popover
│   └── dashboard/
│       └── KidsDashboardCard.tsx     # Replaces Phase 1 TODO stub
└── lib/
    ├── db/
    │   └── schema.ts                 # Add children + kid_activities tables
    └── inngest/
        └── functions/
            ├── generate-activity-recurrence.ts  # Clone of generate-recurrence.ts
            └── send-activity-reminder.ts        # Clone of send-task-reminder.ts
```

---

### Pattern 1: CalendarEvent Union Type (Phase 4 extension point)

**What:** A single TypeScript interface that all calendar data sources conform to. The `UnifiedCalendar` component receives `CalendarEvent[]` and knows nothing about where events come from.

**When to use:** The data-fetching Server Component (page.tsx) builds the array; the calendar component is purely presentational.

```typescript
// src/lib/calendar/types.ts
export interface CalendarEvent {
  id: string
  title: string
  startsAt: Date
  endsAt?: Date | null
  module: 'chores' | 'kids' | 'car' | 'insurance' | 'electronics'
  href: string        // navigation target: /chores, /kids, etc.
  colour: string      // hex or Tailwind colour token
  label?: string      // short label for month grid (truncated title)
}

// Module colour map (CAL-02)
export const MODULE_COLOURS: Record<CalendarEvent['module'], string> = {
  chores:      '#0053dc',
  kids:        '#16a34a',  // green-600 — confirm exact shade with designer
  car:         '#ea580c',  // orange-600
  insurance:   '#9333ea',  // purple-600
  electronics: '#0d9488',  // teal-600
}
```

**Phase 4 extension:** Add car/insurance/electronics queries in the calendar page and map them to `CalendarEvent[]` using the same function. The `UnifiedCalendar` component requires zero changes.

---

### Pattern 2: Multi-Source Calendar Data Query

**What:** The `/calendar` page Server Component runs parallel Drizzle queries for each active module, then merges results into `CalendarEvent[]`.

**When to use:** Always aggregate at the page level, never inside the calendar component.

```typescript
// src/app/(app)/calendar/page.tsx (sketch)
// Source: established Drizzle pattern from chores/page.tsx

const [choreEvents, kidEvents] = await Promise.all([
  // Chores: tasks with starts_at in the current month window
  db.select({ id: tasks.id, title: tasks.title, startsAt: tasks.startsAt })
    .from(tasks)
    .where(and(
      eq(tasks.householdId, householdId),
      ne(tasks.status, 'done'),
      or(eq(tasks.isRecurring, false), isNotNull(tasks.parentTaskId)),
      gte(tasks.startsAt, windowStart),
      lte(tasks.startsAt, windowEnd),
    )),
  // Kids: kid_activities in the same window
  db.select({ id: kidActivities.id, title: kidActivities.title, startsAt: kidActivities.startsAt, childId: kidActivities.childId })
    .from(kidActivities)
    .where(and(
      eq(kidActivities.householdId, householdId),
      gte(kidActivities.startsAt, windowStart),
      lte(kidActivities.startsAt, windowEnd),
    )),
])

const events: CalendarEvent[] = [
  ...choreEvents.map(t => ({ id: t.id, title: t.title, startsAt: t.startsAt, module: 'chores', href: '/chores', colour: MODULE_COLOURS.chores, label: t.title })),
  ...kidEvents.map(a => ({ id: a.id, title: a.title, startsAt: a.startsAt, module: 'kids', href: '/kids', colour: MODULE_COLOURS.kids, label: a.title })),
]
```

---

### Pattern 3: Month Calendar Grid with react-day-picker v9

**What:** Use `DayPicker` from `react-day-picker` in `mode="single"` (or uncontrolled) to render the month grid. Overlay event dots using the `modifiers` and `components` props.

**When to use:** `CalendarMonthView` component. The existing `DatePicker` in the project already demonstrates this API.

```typescript
// Source: react-day-picker v9 API (already used in src/components/ui/date-picker.tsx)
import { DayPicker } from 'react-day-picker'

// Group events by date string (yyyy-MM-dd)
const eventsByDay: Record<string, CalendarEvent[]> = {}
events.forEach(e => {
  const key = format(e.startsAt, 'yyyy-MM-dd')
  if (!eventsByDay[key]) eventsByDay[key] = []
  eventsByDay[key].push(e)
})

// Custom Day component renders dots + "+N more"
function CustomDay({ date, ...props }) {
  const key = format(date, 'yyyy-MM-dd')
  const dayEvents = eventsByDay[key] ?? []
  const visible = dayEvents.slice(0, 2)
  const overflow = dayEvents.length - 2

  return (
    <td {...props}>
      <button className="...day-button...">{date.getDate()}</button>
      <div className="flex flex-col gap-0.5 mt-0.5">
        {visible.map(e => (
          <a key={e.id} href={e.href}
             className="block truncate rounded text-[10px] px-1"
             style={{ backgroundColor: e.colour, color: 'white' }}>
            {e.label}
          </a>
        ))}
        {overflow > 0 && (
          <button className="text-[10px] text-kinship-primary">+{overflow} more</button>
        )}
      </div>
    </td>
  )
}

<DayPicker
  mode="single"
  month={currentMonth}
  onMonthChange={setCurrentMonth}
  components={{ Day: CustomDay }}
  classNames={{ ... }} // same token-based classNames as existing DatePicker
/>
```

---

### Pattern 4: Week View (Custom Tailwind Grid)

**What:** A 7-column CSS grid with time slots (e.g. hourly rows from 6am–10pm). Events are positioned by `startsAt` time using CSS `grid-row` or `top` offset within an absolutely-positioned container.

**When to use:** `CalendarWeekView` component, rendered when the user toggles to week view.

**Approach:**
- Outer grid: 7 columns (days of week), N rows (time slots).
- Each event is rendered as an absolutely positioned `<a>` within its day column at `top = (hour - startHour) * slotHeight`.
- Events with no time (all-day) appear in a pinned header row above the time grid.
- No library needed — pure Tailwind + inline style for time offset.

```typescript
// Time slot constants
const START_HOUR = 6   // 6am
const END_HOUR   = 22  // 10pm
const SLOT_HEIGHT = 48 // px per hour

function timeToOffset(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60
  return (hours - START_HOUR) * SLOT_HEIGHT
}
```

---

### Pattern 5: Kids Server Action (mirrors tasks.ts)

**What:** `src/app/actions/kids.ts` with `createActivity`, `updateActivity`, `deleteActivity`, `createChild`.

**Structure (identical to tasks.ts):**
1. `'use server'` directive
2. Zod schema validation
3. `getUser()` auth check
4. `getHouseholdId()` helper
5. Drizzle `insert` / `update` / `delete`
6. `inngest.send()` for recurring generation and reminder scheduling
7. `activityFeed` insert
8. `revalidatePath('/kids')` + `revalidatePath('/calendar')`

```typescript
// src/app/actions/kids.ts
'use server'
import { z } from 'zod'
// ... same import pattern as tasks.ts

const createActivitySchema = z.object({
  title: z.string().min(1).max(200),
  childId: z.string().uuid(),
  category: z.enum(['school', 'medical', 'sport', 'hobby', 'social']),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
  location: z.string().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema.optional().nullable(),
  reminderOffsetMinutes: z.number().int()
    .refine(v => [30, 60, 180, 1440, 2880].includes(v))  // adds 30min vs tasks
    .optional().nullable(),
  notes: z.string().optional().nullable(),
})
```

Note: kids reminder offsets include 30 minutes (CONTEXT.md §E) — tasks only offer 60, 180, 1440, 2880. The Zod schema must accommodate this.

---

### Pattern 6: Inngest Activity Reminder (mirrors send-task-reminder.ts)

**What:** `src/lib/inngest/functions/send-activity-reminder.ts` — exact structural clone of `send-task-reminder.ts` with these changes:
- Function id: `'send-activity-reminder'`
- Trigger event: `'kids/activity.reminder'`
- Notification type: `'activity_reminder'`
- Email links to `/kids` instead of `/chores`

```typescript
// Exact step structure (verified from send-task-reminder.ts):
export const sendActivityReminder = inngest.createFunction(
  { id: 'send-activity-reminder', triggers: [{ event: 'kids/activity.reminder.scheduled' }] },
  async ({ event, step }) => {
    // step 1: step.sleepUntil('wait-for-reminder-time', remindAt)
    // step 2: step.run('insert-reminder-notification', ...)  — type: 'activity_reminder'
    // step 3: step.run('get-recipient-email', ...)           — adminClient.auth.admin.getUserById
    // step 4: resend.emails.send(...)                        — href: appUrl + '/kids'
  }
)
```

---

### Pattern 7: Recurrence Generation for Activities

**What:** `src/lib/inngest/functions/generate-activity-recurrence.ts` — structural clone of `generate-recurrence.ts`.

The existing `generateOccurrences` utility at `src/lib/chores/recurrence.ts` is generic (takes `RecurrenceRule`, `startDate`, `windowEndDate`) and can be reused directly. Only the table reference changes from `tasks` to `kidActivities`.

```typescript
// Reuse existing utility — no changes needed:
import { generateOccurrences, type RecurrenceRule } from '@/lib/chores/recurrence'

// Trigger event: 'kids/activity.recurring.created'
// Inserts into: kidActivities table (not tasks)
// Links via: parentActivityId (not parentTaskId)
```

---

### Pattern 8: RLS on New Tables

**What:** Both new tables follow the established "household member can do all" pattern.

```typescript
// children table RLS — mirrors choreAreas pattern
pgPolicy('children_all_member', {
  for: 'all',
  to: authenticatedRole,
  using: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = ${authUid}
  )`,
  withCheck: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = ${authUid}
  )`,
})

// kid_activities table RLS — identical household check
pgPolicy('kid_activities_all_member', {
  for: 'all',
  to: authenticatedRole,
  using: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = ${authUid}
  )`,
  withCheck: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = ${authUid}
  )`,
})
```

**No RLS complexity for cross-table FKs:** `assigneeId` references `household_members.id` — since the user can only access household members of their household (enforced by household_members RLS), no extra RLS layer is needed on that FK. Same pattern as `ownerId` on tasks.

---

### Pattern 9: Dashboard Card Integration

**What:** Replace the `ModuleCard` fallback for `key === 'kids'` in `DashboardGrid.tsx` with a `KidsDashboardCard` component. Mirror the `ChoresDashboardCard` pattern exactly.

**Data query in dashboard/page.tsx:**
```typescript
// Mirror the upcomingTasks query for chores — add for kids:
if (activeModules.includes('kids')) {
  const activityRows = await db
    .select({
      id: kidActivities.id,
      title: kidActivities.title,
      childName: children.name,
      startsAt: kidActivities.startsAt,
    })
    .from(kidActivities)
    .innerJoin(children, eq(kidActivities.childId, children.id))
    .where(and(
      eq(kidActivities.householdId, row.householdId),
      // Exclude parent template rows
      or(eq(kidActivities.isRecurring, false), isNotNull(kidActivities.parentActivityId)),
    ))
    .orderBy(asc(kidActivities.startsAt))
    .limit(3)

  upcomingActivities = activityRows
}
```

---

### Anti-Patterns to Avoid

- **Installing a full calendar library (react-big-calendar, fullcalendar, etc.):** react-day-picker is already installed and sufficient. Adding a heavier library conflicts with the design system and introduces styling conflicts with Tailwind 4.
- **Filtering recurring parent template rows in the calendar:** Same bug-prone area as chores — always exclude rows where `isRecurring = true AND parentActivityId IS NULL`. Use the same `or(eq(...isRecurring, false), isNotNull(...parentActivityId))` pattern.
- **Building the calendar component with awareness of data sources:** The `UnifiedCalendar` component must only know about `CalendarEvent[]` — never import from `@/lib/db/schema` inside calendar components.
- **Using RLS subqueries that join kid_activities to children in a policy:** Keep policies simple (household_id check only). Cross-table integrity is enforced by application logic and FK constraints.
- **Fetching all events for the full year in the calendar query:** Scope queries to the currently visible month (or week ± buffer). The calendar should send `windowStart` / `windowEnd` to the server via search params.
- **Reminder offset validation mismatch:** Activity reminders include 30 minutes; chore reminders do not. The Zod schema and UI options for activities must include `30` (= 30 minutes) in addition to the chores set `[60, 180, 1440, 2880]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month calendar grid with day navigation | Custom date grid from scratch | `react-day-picker` DayPicker (already installed) | Already used in DatePicker; handles month navigation, day selection, modifiers, accessible keyboard nav |
| Occurrence generation for recurring activities | New recurrence algorithm | `generateOccurrences` from `src/lib/chores/recurrence.ts` | Already tested, handles all frequency types, reusable across modules |
| Delayed Inngest reminder | `setTimeout` or cron | `step.sleepUntil(remindAt)` | Durable, retried, survives restarts; already working in Phase 2 |
| Date arithmetic for calendar navigation | Manual month addition | `date-fns` `addMonths`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval` | Project standard; avoids off-by-one errors with timezone-aware dates |
| Inline event dot colouring | Tailwind class per module | CSS `style={{ backgroundColor: MODULE_COLOURS[event.module] }}` | Dynamic colour can't be done with static Tailwind class names; inline style is correct here |

---

## Common Pitfalls

### Pitfall 1: Calendar Window Not Scoped to Visible Period
**What goes wrong:** Calendar page fetches all events for all time, making the query slow as data grows.
**Why it happens:** Simple implementation fetches `WHERE household_id = ?` with no date range filter.
**How to avoid:** Pass `windowStart` and `windowEnd` as search params (or compute from current month server-side). Use `gte(startsAt, windowStart)` + `lte(startsAt, windowEnd)` in every data source query.
**Warning signs:** Page response time increases linearly with number of activities.

### Pitfall 2: Recurring Parent Template Rows Appearing in Calendar
**What goes wrong:** Parent rows (isRecurring=true, parentActivityId=null) appear as phantom events on the first activity date.
**Why it happens:** The filter `WHERE isRecurring = false` misses parent rows. Must use the two-condition check.
**How to avoid:** Always use `or(eq(kidActivities.isRecurring, false), isNotNull(kidActivities.parentActivityId))` — same as the chores pattern.
**Warning signs:** Events appear doubled on the creation date of recurring activities.

### Pitfall 3: Child "Add New" Flow Not Persisting to DB Before Activity Save
**What goes wrong:** User types a new child name in the "Child" dropdown and saves the activity, but the child was never persisted first.
**Why it happens:** Combobox pattern that creates children inline requires careful sequencing.
**How to avoid:** The `createActivity` Server Action must check if `childId` is a temporary client-side ID and create the child row atomically before creating the activity. Alternatively, persist the child immediately when the user confirms the new name (before saving the full form). The second approach is simpler — fire a `createChild` Server Action on "Enter" or blur, get back a real UUID, then use that UUID in the activity form.
**Warning signs:** Activities with null childId in the database.

### Pitfall 4: Week View Time Offset Drift with Timezones
**What goes wrong:** Events appear at the wrong time in the week view when the user's browser timezone differs from the stored UTC timestamp.
**Why it happens:** `startsAt` is stored as UTC; rendering must convert to local time.
**How to avoid:** Use `date-fns` `format(startsAt, 'HH:mm')` (which uses local time) or explicitly convert with `toLocaleTimeString`. Never use `.getUTCHours()` for display.
**Warning signs:** Events appear 1–2 hours offset in non-UTC timezones.

### Pitfall 5: Inngest Function Not Registered
**What goes wrong:** Activity reminder events are sent but never processed.
**Why it happens:** New Inngest functions must be added to the functions array in the Inngest serve handler (`src/app/api/inngest/route.ts` or equivalent).
**How to avoid:** After creating `send-activity-reminder.ts` and `generate-activity-recurrence.ts`, immediately add them to the Inngest serve handler's function list.
**Warning signs:** Inngest dashboard shows events received but no function runs triggered.

### Pitfall 6: RLS Blocking the `children` Table Insert When `childId` Is Set to a Different Household's Child
**What goes wrong:** A user attempts to create an activity with a `childId` that belongs to another household.
**Why it happens:** The application doesn't validate that the child belongs to the user's household before inserting.
**How to avoid:** In the `createActivity` Server Action, verify `childId` exists with `WHERE id = ? AND household_id = ?` before inserting the activity. The DB FK alone doesn't prevent cross-household assignment if RLS is on `kid_activities` only.
**Warning signs:** Activities created with orphaned or cross-household childId values.

---

## Code Examples

Verified patterns from existing codebase:

### Inngest Delayed Reminder — Exact Production Pattern
```typescript
// Source: src/lib/inngest/functions/send-task-reminder.ts (Phase 2, verified)
// Step 1: sleep until reminder time
const startsAtMs = new Date(startsAt).getTime()
const offsetMs = reminderOffsetMinutes * 60 * 1000
const remindAt = new Date(startsAtMs - offsetMs)
await step.sleepUntil('wait-for-reminder-time', remindAt)

// Step 2: insert in-app notification
await step.run('insert-reminder-notification', async () => {
  await db.insert(notifications).values({
    householdId,
    userId: ownerId,      // assigneeId in activities context
    type: 'activity_reminder',
    entityId: activityId,
    message,
  })
})

// Step 3: look up email and send
const recipientEmail = await step.run('get-recipient-email', async () => {
  const adminClient = createAdminClient()
  const { data } = await adminClient.auth.admin.getUserById(ownerId)
  return data?.user?.email ?? null
})
```

### Recurrence Generation — Exact Production Pattern
```typescript
// Source: src/lib/inngest/functions/generate-recurrence.ts (Phase 2, verified)
// Reuse generateOccurrences utility unchanged:
import { generateOccurrences, type RecurrenceRule } from '@/lib/chores/recurrence'
import { addYears } from 'date-fns'

const rule = parentActivity.recurrenceRule as RecurrenceRule
const startDate = new Date(parentActivity.startsAt)
const windowEndDate = addYears(startDate, 1)
const occurrenceDates = generateOccurrences(rule, startDate, windowEndDate)

// Batch insert occurrence rows:
const occurrenceRows = occurrenceDates.map((date) => ({
  householdId: parentActivity.householdId,
  childId: parentActivity.childId,
  title: parentActivity.title,
  category: parentActivity.category,
  location: parentActivity.location,
  assigneeId: parentActivity.assigneeId,
  startsAt: date,
  isRecurring: true,
  recurrenceRule: parentActivity.recurrenceRule,
  parentActivityId: parentActivity.id,
  createdBy: parentActivity.createdBy,
  reminderOffsetMinutes: parentActivity.reminderOffsetMinutes,
}))
await db.insert(kidActivities).values(occurrenceRows)
```

### RLS Policy — Exact Production Pattern
```typescript
// Source: src/lib/db/schema.ts (Phase 2, verified — choreAreas and tasks)
pgPolicy('kid_activities_all_member', {
  for: 'all',
  to: authenticatedRole,
  using: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = ${authUid}
  )`,
  withCheck: sql`household_id IN (
    SELECT household_id FROM household_members WHERE user_id = ${authUid}
  )`,
})
```

### Dashboard Card — Exact Production Pattern to Mirror
```typescript
// Source: src/components/dashboard/ChoresDashboardCard.tsx (Phase 2, verified)
// KidsDashboardCard mirrors this with: childName instead of areaName, href to /kids
export function KidsDashboardCard({ activities }: { activities: UpcomingActivity[] }) {
  return (
    <Card className="bg-kinship-surface-container-lowest p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {/* Kids green icon */}
        <h3 className="font-display text-base font-semibold text-kinship-on-surface">Kids Activities</h3>
      </div>
      {/* List rows: title + childName + startsAt */}
      <div className="pt-2 border-t border-kinship-surface-container">
        <a href="/kids" className="font-body text-sm hover:underline" style={{ color: MODULE_COLOURS.kids }}>
          View all activities →
        </a>
      </div>
    </Card>
  )
}
```

### Server Action Pattern — Exact Production Pattern
```typescript
// Source: src/app/actions/tasks.ts (Phase 2, verified)
'use server'
export async function createActivity(input: unknown): Promise<ActionResult<ActivityItem>> {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // 2. Validate
  const parsed = createActivitySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  // 3. Get household
  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  // 4. DB insert
  const [row] = await db.insert(kidActivities).values({ ... }).returning()

  // 5. Fire Inngest events
  if (parsed.data.isRecurring) {
    await inngest.send({ name: 'kids/activity.recurring.created', data: { activityId: row.id, householdId } })
  }
  if (parsed.data.reminderOffsetMinutes) {
    await inngest.send({ name: 'kids/activity.reminder.scheduled', data: { ... } })
  }

  // 6. Activity feed
  await db.insert(activityFeed).values({ ... })

  // 7. Revalidate
  revalidatePath('/kids')
  revalidatePath('/calendar')

  return { success: true, data: row }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 3 |
|--------------|------------------|--------------------|
| Full-page calendar libraries (react-big-calendar) | Lightweight DayPicker + custom Tailwind layout | Already installed; no new deps; design system control |
| Separate calendar page per module | Unified calendar with module colour coding | Build once, Phase 4 plugs in data |
| Eager fetch all events | Window-scoped queries with date range params | Required from day one to avoid slow queries |
| Manual FK constraints only for RLS | `pgPolicy` co-located with table definition | Established project pattern in schema.ts |

**Deprecated/outdated:**
- `react-day-picker` v8 API: The project uses v9 (confirmed in package.json). The `mode="single"` and `components` API are the v9 API, not the deprecated v7/v8 `ReactDayPicker` wrapper. Do not reference v8 docs.

---

## Open Questions

1. **Exact green hex for Kids Activities module**
   - What we know: CAL-02 says "Green"; Tailwind green-600 is `#16a34a`; the design system (`01-CONTEXT.md`) mentions "Kids = `#006b62` teal" for module accent buttons in Phase 1
   - What's unclear: The Phase 1 context says teal for Kids buttons, but CAL-02 says green for the calendar. These may conflict.
   - Recommendation: Use `#16a34a` (green-600) for the calendar event colour and badge. If a designer review is available, confirm. Otherwise establish a single `KIDS_GREEN` constant and use it everywhere.

2. **`/calendar` route: server-side month vs. client-side navigation**
   - What we know: The month view needs prev/next navigation. Server-side would require a URL param (`?month=2026-04`); client-side would keep state in useState.
   - What's unclear: The chores page uses URL params for filters (router.push pattern); should the calendar follow the same convention?
   - Recommendation: Use URL search params for the current month (`?month=2026-04`) so the URL is shareable and the server can scope the DB query. This matches the established chores filter pattern.

3. **`KidsClient` view state: list vs. calendar toggle**
   - What we know: The toggle controls whether `/kids` shows ActivityList or UnifiedCalendar (kids-filtered).
   - What's unclear: Should the toggle state persist across page loads (URL param) or be ephemeral (useState)?
   - Recommendation: Use a URL param `?view=calendar` for the `/kids` page so the state survives refresh. The `/calendar` route always shows the calendar.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + @testing-library/react 16 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `vitest run --passWithNoTests` |
| Full suite command | `vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KIDS-01/02 | `createChild` Server Action creates a children row | unit | `vitest run tests/unit/kids/children.test.ts -x` | ❌ Wave 0 |
| KIDS-03 | `createActivity` Server Action validates required fields | unit | `vitest run tests/unit/kids/activities.test.ts -x` | ❌ Wave 0 |
| KIDS-04 | `generateOccurrences` produces correct dates for kid activities | unit | `vitest run tests/unit/kids/recurrence.test.ts -x` | ❌ Wave 0 (can reuse recurrence logic already tested) |
| KIDS-05 | Reminder offset calculation produces correct `remindAt` timestamp | unit | `vitest run tests/unit/kids/reminder.test.ts -x` | ❌ Wave 0 |
| KIDS-06/CAL-04 | `CalendarEvent[]` grouping by day is correct | unit | `vitest run tests/unit/calendar/groupByDay.test.ts -x` | ❌ Wave 0 |
| KIDS-07 | `deleteActivity` removes activity and cascade | unit | included in activities.test.ts | ❌ Wave 0 |
| KIDS-08 | Category enum validates correctly in Zod schema | unit | included in activities.test.ts | ❌ Wave 0 |
| CAL-01 | Calendar event array merges chores + kids correctly | unit | `vitest run tests/unit/calendar/merge.test.ts -x` | ❌ Wave 0 |
| CAL-02 | `MODULE_COLOURS` has correct entries for all modules | unit | included in merge.test.ts | ❌ Wave 0 |
| CAL-03 | Each `CalendarEvent` carries correct `href` | unit | included in merge.test.ts | ❌ Wave 0 |

Note: KIDS-06 (calendar rendering) and CAL-04 (month/week views) have UI behaviour that is best verified manually. Automated tests cover the data layer (grouping, merging, colour assignment).

### Sampling Rate
- **Per task commit:** `vitest run tests/unit/kids/ tests/unit/calendar/ --passWithNoTests`
- **Per wave merge:** `vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/kids/children.test.ts` — covers KIDS-01, KIDS-02
- [ ] `tests/unit/kids/activities.test.ts` — covers KIDS-03, KIDS-07, KIDS-08
- [ ] `tests/unit/kids/recurrence.test.ts` — covers KIDS-04 (can import `generateOccurrences` directly)
- [ ] `tests/unit/kids/reminder.test.ts` — covers KIDS-05 (reminder time calculation)
- [ ] `tests/unit/calendar/groupByDay.test.ts` — covers CAL-04 day-grouping logic
- [ ] `tests/unit/calendar/merge.test.ts` — covers CAL-01, CAL-02, CAL-03

Existing infrastructure: `vitest.config.ts` exists and is configured. No new framework install needed.

---

## Sources

### Primary (HIGH confidence — verified in codebase)
- `src/lib/inngest/functions/send-task-reminder.ts` — exact `step.sleepUntil` pattern for activity reminders
- `src/lib/inngest/functions/generate-recurrence.ts` — exact recurrence generation pattern to clone
- `src/lib/db/schema.ts` — RLS policy pattern for new tables
- `src/components/ui/date-picker.tsx` — confirms `react-day-picker` v9 DayPicker API and classNames approach
- `package.json` — confirms all needed packages already installed (react-day-picker 9.14, date-fns 4.1, inngest 4.1)
- `src/app/actions/tasks.ts` — Server Action pattern with Zod, auth, Inngest events, revalidatePath
- `src/components/dashboard/ChoresDashboardCard.tsx` — exact dashboard card pattern to mirror

### Secondary (MEDIUM confidence)
- `react-day-picker` v9 documentation — `DayPicker` `components` prop accepts custom `Day` renderer, enabling event dot overlay
- `date-fns` v4 — `eachDayOfInterval`, `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth` for calendar navigation

### Tertiary (LOW confidence — not verified against official docs, but consistent with v9 usage in codebase)
- Custom week view layout using CSS grid + inline style positioning — standard pattern but not verified against a specific reference

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in package.json
- Architecture (Inngest patterns): HIGH — verified from production Phase 2 code
- Architecture (calendar): MEDIUM — react-day-picker custom Day component approach is confirmed by DatePicker usage; week view is hand-rolled CSS (LOW for that specific part)
- RLS patterns: HIGH — verified from schema.ts
- Pitfalls: HIGH — drawn from Phase 2 implementation experience in the same codebase

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack; no fast-moving dependencies)
