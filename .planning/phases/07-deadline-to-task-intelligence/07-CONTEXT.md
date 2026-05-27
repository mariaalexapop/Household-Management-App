# Phase 7: Deadline-to-Task Intelligence - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Smart task generation from module deadlines. Deadlines from car (MOT, tax, service), insurance (expiry, payment), and electronics (warranty expiry) generate actionable task suggestions — they do NOT appear as raw items in the dashboard timeline. The dashboard timeline shows only tasks (chores + kids activities). Suggestions live in a sidebar card with one-click accept, edit, and dismiss.

</domain>

<decisions>
## Implementation Decisions

### Timeline Separation
- **D-01:** Dashboard timeline (left column) shows **tasks only** — chores and kids activities. All car/insurance/electronics deadline rows are removed from the timeline.
- **D-02:** Overdue tasks (chores/activities) stay in the timeline **only if ≤14 days overdue**. Tasks older than 14 days overdue are moved to a separate "Things you need to review" card in the sidebar.

### Suggestion Persistence
- **D-03:** Suggestions are **database-backed**. A new `suggestions` table stores generated suggestions with status (pending/accepted/dismissed).
- **D-04:** An **Inngest job runs daily** to check upcoming deadlines and create/update suggestion records in the DB. Not computed client-side.
- **D-05:** Dismiss/accept state persists across sessions and devices via DB.

### Task Templates
- **D-06:** Each deadline type gets a **smart action-oriented title template**:
  - Car MOT due → "Book MOT for [make] [model]"
  - Car tax due → "Renew road tax for [make] [model]"
  - Car service due → "Book service for [make] [model]"
  - Insurance expiry → "Renew [insurer] [type] policy"
  - Insurance payment → "Pay [insurer] [type] premium"
  - Electronics warranty → "Check warranty options for [item name]"
- **D-07:** Templates are static mappings (no AI generation). Editable by user before task creation.

### Dismiss & Snooze Behavior
- **D-08:** Dismiss is **permanent per deadline cycle**. Dismissing "Book MOT for Skoda Kodiaq" for the current MOT due date won't resurface until the next MOT cycle.
- **D-09:** No snooze functionality — keep it simple. Dismiss or accept.

### Claude's Discretion
- Suggestion card visual design and layout within the existing sidebar
- How many days before a deadline to generate a suggestion (e.g., 14 days, 30 days)
- Inngest job scheduling frequency and error handling
- DB schema details for the suggestions table

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `src/components/dashboard/DashboardTimeline.tsx` — Current dashboard with inline suggestions (to be refactored)
- `src/app/(app)/dashboard/page.tsx` — Dashboard server component with data fetching
- `src/app/actions/tasks.ts` — `createTask` server action (reuse for suggestion → task conversion)

### Schema & Infrastructure
- `src/lib/db/schema.ts` — Drizzle schema (add suggestions table here)
- `supabase/migrations/` — Migration directory for new table

### Background Jobs
- `src/inngest/` — Inngest function directory (add daily suggestion generator)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createTask` server action: Already handles task creation with title, notes, ownerId, startsAt — perfect for suggestion acceptance
- `SuggestionsCard` component: Current client-side version exists in DashboardTimeline.tsx — refactor to read from DB instead of computing
- `updateTaskStatus` server action: Can be adapted pattern for suggestion status updates

### Established Patterns
- Server actions with Zod validation for all mutations
- Inngest for background jobs (already used for reminders, recurrence generation)
- Drizzle ORM for all DB operations
- Toast notifications via sonner for user feedback

### Integration Points
- Dashboard page (`dashboard/page.tsx`): Remove car/insurance/electronics from timeline query, add suggestions query
- DashboardTimeline component: Remove inline suggestion computation, consume DB-backed suggestions
- Inngest client: Register new daily suggestion generation function

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants the dashboard to feel like a "task list, not a deadline dump"
- The "Things you need to review" card for old overdue items (>14 days) should be a gentle nudge, not alarming
- Suggestion templates should read as natural actions someone would add to a to-do list

</specifics>

<deferred>
## Deferred Ideas

- AI-generated task titles (considered, decided against for v1 — static templates are sufficient)
- Snooze functionality (keep simple with dismiss only)
- Suggestion notifications (push/email when new suggestions appear)

</deferred>

---

*Phase: 07-deadline-to-task-intelligence*
*Context gathered: 2026-05-27*
