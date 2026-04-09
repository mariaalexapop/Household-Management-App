---
phase: 03-kids-activities
plan: 06
subsystem: calendar-ui
status: complete
date: 2026-04-09
tags: [ui, calendar, react-day-picker, dashboard, kids]
dependency_graph:
  requires: [03-04, 03-05]
  provides: [UnifiedCalendar, CalendarMonthView, CalendarWeekView, KidsDashboardCard, /calendar route active]
  affects: [Phase 4 — will plug car/insurance/electronics events into UnifiedCalendar]
tech_stack:
  added: []
  patterns: [react-day-picker-custom-day, time-slot-week-grid, dashboard-card-pattern]
key_files:
  created:
    - src/components/calendar/CalendarEventDot.tsx
    - src/components/calendar/DayEventsPopover.tsx
    - src/components/calendar/CalendarMonthView.tsx
    - src/components/calendar/CalendarWeekView.tsx
    - src/components/calendar/UnifiedCalendar.tsx
    - src/components/dashboard/KidsDashboardCard.tsx
  modified:
    - src/app/(app)/calendar/CalendarClient.tsx
    - src/app/(app)/kids/KidsClient.tsx
    - src/components/dashboard/DashboardGrid.tsx
    - src/app/(app)/dashboard/page.tsx
    - tests/unit/dashboard/dashboard.test.ts
decisions:
  - Use react-day-picker custom Day component (not DayDate — not in v9 API) to inject event dots into month cells
  - Week view uses pure Tailwind CSS grid (grid-cols-8) with 7:00–22:00 hour range to avoid excessive scroll
  - KidsDashboardCard mirrors ChoresDashboardCard pattern — green accent (#16a34a), CalendarHeart icon
metrics:
  duration_minutes: 25
  completed_date: 2026-04-09
  tasks: 2
  files: 11
requirements:
  - CAL-01
  - CAL-02
  - CAL-03
  - CAL-04
  - KIDS-06
---

# Phase 3 Plan 6: Calendar UI Summary

## One-liner

Month/week UnifiedCalendar with react-day-picker custom Day cells, event dots, overflow popover, Tailwind week grid, KidsDashboardCard, and calendar wired into /kids and /calendar routes.

## What Was Done

**Task 1: Calendar components**
- `CalendarEventDot` — coloured dot + truncated label, click navigates to `event.href` (CAL-03).
- `DayEventsPopover` — floating panel listing all events for a day; closes on outside click.
- `CalendarMonthView` — DayPicker with custom `Day` component that renders event dots below the day number. Shows up to 2 events per cell; "+N more" button opens DayEventsPopover.
- `CalendarWeekView` — 8-column CSS grid: time labels (col 1) + 7 day columns. Shows hours 07:00–22:00. Events rendered as coloured pill buttons at their hour slot. Previous/next week navigation using date-fns addWeeks.
- `UnifiedCalendar` — stateful wrapper with month/week toggle (LayoutGrid / List icons). Holds currentMonth and currentWeek state. Renders CalendarMonthView or CalendarWeekView based on view state.

**Task 2: Wiring + dashboard**
- `CalendarClient` — replaced stub with `<UnifiedCalendar events={events} defaultView="month" />`.
- `KidsClient` — replaced calendar placeholder div with UnifiedCalendar rendering kids-only CalendarEvents mapped from optimisticActivities.
- `KidsDashboardCard` — new component showing 3 nearest upcoming activities (title + child name + formatted date). Green accent (#16a34a). "View all" → /kids.
- `DashboardGrid` — added `upcomingActivities` prop; renders KidsDashboardCard for 'kids' module key.
- `dashboard/page.tsx` — adds kidActivities LEFT JOIN children query (3 rows, asc starts_at) when 'kids' in activeModules. Passes result to DashboardGrid.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DayDate is not a valid react-day-picker v9 component**
- **Found during:** Task 1 TypeScript check
- **Issue:** Plan spec referenced `components={{ DayDate: ... }}` but react-day-picker v9 exposes `Day` (cell wrapper, receives `day` and `modifiers`) not `DayDate`
- **Fix:** Used `Day` component with a custom `EventCell` helper that renders the day number + event dots in a `<td>` element
- **Files modified:** src/components/calendar/CalendarMonthView.tsx
- **Commit:** d0e05f3

**2. [Rule 1 - Bug] Update dashboard tests for new DashboardGrid prop + corrected badge count**
- **Found during:** Task 2 TypeScript check
- **Issue:** Existing tests passed DashboardGrid without `upcomingActivities` prop (now required), and the "4 Coming soon" assertion was wrong — 'kids' now renders KidsDashboardCard, so only 3 modules (car/insurance/electronics) show ModuleCard/Coming soon
- **Fix:** Added `upcomingActivities: []` to all test renders; updated badge count assertion from 4 to 3; added `CalendarHeart` to lucide-react mock
- **Files modified:** tests/unit/dashboard/dashboard.test.ts
- **Commit:** d0e05f3

## Self-Check: PASSED

Files created:
- src/components/calendar/CalendarEventDot.tsx — FOUND
- src/components/calendar/DayEventsPopover.tsx — FOUND
- src/components/calendar/CalendarMonthView.tsx — FOUND
- src/components/calendar/CalendarWeekView.tsx — FOUND
- src/components/calendar/UnifiedCalendar.tsx — FOUND
- src/components/dashboard/KidsDashboardCard.tsx — FOUND

Commits: 46db2af (Plan 04) and d0e05f3 (Plan 06) — FOUND
