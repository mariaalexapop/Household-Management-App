---
phase: "07"
plan: "03"
subsystem: dashboard
tags: [dashboard, timeline, suggestions-card, review-card, refactor]
dependency_graph:
  requires: [suggestions-table, suggestion-crud, suggestion-generation]
  provides: [tasks-only-timeline, db-suggestions-card, stale-review-card]
  affects: [dashboard-ux, task-management]
tech_stack:
  added: []
  patterns: [server-component-data-fetching, server-action-mutations, overdue-splitting]
key_files:
  created: []
  modified:
    - src/app/(app)/dashboard/page.tsx
    - src/components/dashboard/DashboardTimeline.tsx
decisions:
  - "Timeline shows only chores + kid activities — no raw car/insurance/electronics deadlines"
  - "Overdue split at 14-day threshold: <=14 days in timeline amber section, >14 days in review card"
  - "SuggestionsCard calls acceptSuggestion/dismissSuggestion server actions instead of inline createTask"
  - "Things to review card only renders when staleOverdue.length > 0"
metrics:
  duration_seconds: ~120
  completed: "2026-05-27T19:15:10Z"
---

# Phase 7 Plan 03: Dashboard Refactor Summary

**One-liner:** Dashboard refactored to tasks-only timeline with DB-backed suggestions card and stale overdue review card.

## What Was Done

### Task 1: Refactor dashboard page data fetching
- Modified `src/app/(app)/dashboard/page.tsx` (+44 lines)
- Added query for pending suggestions from DB (`suggestions` table, status='pending')
- Split overdue tasks: >14 days into `staleOverdue` array, <=14 days stay in timeline
- Passed `suggestions` and `staleOverdue` as new props to DashboardTimeline

### Task 2: Remove inline deadlines from timeline
- Removed car deadline loop (car-* rows) from DashboardTimeline
- Removed insurance deadline loop (ins-* rows) from DashboardTimeline
- Timeline now only contains tasks (chores) + activities (kids)
- Removed client-side `suggestions` useMemo computation
- Removed `cars`, `policies`, `electronics` props from timeline component

### Task 3: Refactor SuggestionsCard — consume DB data
- SuggestionsCard now accepts DB-backed `suggestions` as prop
- Calls `acceptSuggestion` / `dismissSuggestion` server actions
- Edit button pre-fills task form with suggestion data (title, due date, area)
- Shows source module dot color per suggestion

### Task 4: Add "Things to review" card
- New sidebar card for tasks >14 days overdue
- Shows task title, how long overdue, and quick actions
- Only renders when staleOverdue items exist

### Task 5: Filter overdue in timeline
- Overdue section only shows tasks where overdue <=14 days
- Tasks older than 14 days excluded from timeline entirely (moved to review card)

**Commit:** f500b8d

## Subsequent Refinements (same session)

Multiple follow-up commits refined the dashboard after initial 07-03 execution:
- `93eedf7` — Seed suggestions on dashboard load for immediate visibility
- `6999ae1` — Inline task assignment on dashboard + unassigned accepted suggestions
- `4d965b8` — Fix task assignment persistence with new assignTask action
- `88c7763` — Fix member lookup to match both householdMembers.id and userId
- `eb58b86` — Pre-fill task form when editing a suggestion
- `df613e5` — Pre-select area when editing a suggestion
- `1266666` — Click timeline row to expand task/activity details
- `51db133` — Show all task/activity details in expanded panel
- `9dc91e8` — Detail panel shows only extra info + edit button
- `e543915` — Cost evolution chart in Money Pulse card
- `fb5040f` — Use actual payment schedule projections for cost chart
- `6da905d` — Linear curves in cost evolution chart

## Deviations from Plan

- Added inline task assignment (avatar click to assign/reassign) — not in plan
- Added click-to-expand detail panel — not in plan
- Added cost evolution chart to Money Pulse — not in plan
- Added suggestion edit pre-fill with area selection — enhanced from plan spec

## Verification

- Dashboard timeline shows zero car/insurance/electronics rows
- Timeline shows only chores + kid activities
- Suggestions card reads from DB, not client-side computation
- Accept creates a task and marks suggestion as accepted
- Dismiss persists — suggestion doesn't reappear on reload
- Tasks >14 days overdue appear in "Things to review" card, not in timeline
- Tasks <=14 days overdue still appear in the amber "Overdue" section

## Self-Check: PASSED
