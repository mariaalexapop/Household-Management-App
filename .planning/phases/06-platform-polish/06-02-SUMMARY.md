---
phase: 06-platform-polish
plan: 02
subsystem: mobile-responsiveness
tags: [mobile, responsive, tailwind, 375px, touch-targets]
dependency_graph:
  requires: [06-01]
  provides: [mobile-responsive-pages]
  affects: [all-app-pages, chatbot-dock, chatbot-fab]
tech_stack:
  added: []
  patterns: [responsive-padding, flex-wrap, grid-cols-1-mobile, safe-area-bottom, min-h-11-touch]
key_files:
  created: []
  modified:
    - src/app/(app)/dashboard/page.tsx
    - src/app/(app)/chores/page.tsx
    - src/app/(app)/chores/ChoresClient.tsx
    - src/app/(app)/kids/page.tsx
    - src/app/(app)/kids/KidsClient.tsx
    - src/app/(app)/calendar/page.tsx
    - src/app/(app)/cars/page.tsx
    - src/app/(app)/cars/CarsClient.tsx
    - src/app/(app)/insurance/page.tsx
    - src/app/(app)/insurance/InsuranceClient.tsx
    - src/app/(app)/electronics/page.tsx
    - src/app/(app)/electronics/ElectronicsClient.tsx
    - src/app/(app)/costs/page.tsx
    - src/app/(app)/costs/CostsClient.tsx
    - src/app/(app)/settings/page.tsx
    - src/app/(app)/settings/household/page.tsx
    - src/app/(app)/settings/household/activity/page.tsx
    - src/components/calendar/CalendarMonthView.tsx
    - src/components/chatbot/ChatbotDock.tsx
    - src/components/chatbot/ChatbotFab.tsx
    - src/components/nav/AppHeader.tsx
decisions:
  - Grid-cols-1 on mobile for summary cards (costs) and form fields (electronics)
  - Chatbot dock full-screen below sm breakpoint, 420px panel above
  - Calendar month cells h-20 on mobile, h-32 on desktop
  - All action buttons min-h-11 (44px) for touch targets
metrics:
  duration: ~25min
  completed: 2026-04-20
  tasks_completed: 1
  tasks_total: 2
  files_modified: 21
requirements:
  - PLAT-03
---

# Phase 6 Plan 02: Mobile Responsiveness Audit Summary

Systematic mobile responsiveness fixes across all 21 app files for 375px+ viewport width, ensuring touch-friendly layouts without horizontal scrolling.

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Audit and fix all app pages for mobile responsiveness (375px+) | 7749a8e | 21 files, responsive padding/grids/touch targets |
| 2 | Human verification checkpoint | -- | Awaiting manual verification in Chrome DevTools |

## Changes by Page

### All Pages (11 page.tsx files)
- Replaced `px-6 py-8` with `px-4 py-6 sm:px-6 sm:py-8` on every `<main>` wrapper
- Ensures 16px side padding on 375px screens (vs 24px which wastes space)

### AppHeader
- Responsive padding: `px-4 sm:px-6`
- `min-w-0` on link container to allow truncation
- `truncate` on subtitle text

### Dashboard
- Responsive main padding (DashboardGrid already had `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

### Chores
- Dialog padding: `p-4 sm:p-8`
- Dialog title: `text-2xl sm:text-[32px]` (32px was too large on mobile)
- Page heading: responsive font size

### Kids
- Header: `flex-wrap gap-3` to handle narrow screens
- Heading: `text-2xl sm:text-[32px]`
- View toggle buttons: `min-h-11 min-w-11` for 44px touch targets
- Add Activity button: `min-h-11`
- Calendar container: `p-3 sm:p-6`

### Cars
- Page header: `flex-wrap gap-3`
- Heading: `text-2xl sm:text-[32px]`
- Add Car button: `min-h-11`
- Service history section: `p-4 sm:p-6`, `flex-wrap gap-3` header
- Service history heading: `text-lg sm:text-xl`
- Add Service Record button: `min-h-11`
- Show Service Info button: `min-h-11`, shortened text
- All 4 dialogs: `p-4 sm:p-8`, responsive title sizes
- KeyDateBadge: `flex-wrap gap-1` for narrow cards

### Insurance
- Header: `flex-wrap gap-3`
- Heading: `text-2xl sm:text-[32px]`
- Add Policy button: `min-h-11`
- Policy action buttons (edit/delete/expand): `min-h-11 min-w-11` for 44px touch
- Form submit button: `h-11 px-4` (was `h-8 px-2.5` -- too small for touch)

### Electronics
- Header: `flex-wrap gap-3`
- Heading: `text-2xl sm:text-[32px]`
- Add Item button: `h-11` (was `h-10`)
- Card edit/delete buttons: `min-h-11 min-w-11` for 44px touch targets
- Form grids: `grid-cols-1 sm:grid-cols-2` (brand/model and date/cost rows)

### Costs
- Header: `flex-wrap gap-3`
- Summary cards grid: `grid-cols-1 sm:grid-cols-3 lg:grid-cols-5` (was grid-cols-2)
- Table: `min-w-[540px]` for proper horizontal scrolling

### Calendar
- Month view cells: `h-20 sm:h-32` (shorter on mobile to fit screen)
- Navigation buttons: `h-11 w-11` (was h-10 w-10, now 44px touch targets)

### Chatbot
- ChatbotDock: `fixed inset-0` on mobile (full-screen), `sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-full sm:max-w-[420px]` on desktop
- ChatbotFab: Added `safe-area-bottom` class for notched phone offset

## Patterns Applied

1. **Responsive padding**: `px-4 py-6 sm:px-6 sm:py-8` on all page wrappers
2. **Touch targets**: `min-h-11` (44px) on all interactive buttons
3. **Flex wrap**: `flex-wrap gap-3` on header rows to prevent overflow
4. **Responsive grids**: `grid-cols-1 sm:grid-cols-2` on form fields
5. **Responsive text**: `text-2xl sm:text-[32px]` for major headings
6. **Full-screen mobile modals**: ChatbotDock uses `inset-0` below sm breakpoint
7. **Safe area insets**: ChatbotFab uses `safe-area-bottom` CSS utility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Fixed settings pages padding**
- **Found during:** Task 1, page audit
- **Issue:** Settings pages (main, household, activity) also had `px-6 py-8` but were not listed in the plan
- **Fix:** Applied same responsive padding pattern
- **Files modified:** settings/page.tsx, settings/household/page.tsx, settings/household/activity/page.tsx

## Verification

- Build passes: `npx next build` completes with 0 errors
- Task 2 (human verification in Chrome DevTools at 375px) is pending

## Self-Check

Verified via `npx next build` -- zero errors, zero warnings. All 21 files committed in 7749a8e.
