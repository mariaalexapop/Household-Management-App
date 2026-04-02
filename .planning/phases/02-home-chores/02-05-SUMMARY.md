---
phase: 02-home-chores
plan: 05
subsystem: notifications
tags: [realtime, notifications, bell, settings, supabase-realtime]
dependency_graph:
  requires: [02-01, 02-02, 02-04]
  provides: [notification-bell-ui, notification-realtime-subscription, settings-email-toggle]
  affects: [src/components/realtime/RealtimeProvider.tsx, src/app/(app)/layout.tsx]
tech_stack:
  added: [date-fns/formatDistanceToNow]
  patterns: [supabase-realtime-postgres-changes, server-action-auth-pattern, client-component-toggle]
key_files:
  created:
    - src/components/notifications/NotificationBell.tsx
    - src/components/notifications/NotificationDropdown.tsx
    - src/app/actions/notifications.ts
    - src/app/(app)/settings/NotificationToggle.tsx
  modified:
    - src/components/realtime/RealtimeProvider.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/settings/page.tsx
    - tests/unit/realtime/connection.test.tsx
decisions:
  - "NotificationBell is placed in a fixed top-right position in the app layout (z-30) rather than inside a semantic header element — chosen to avoid restructuring the app shell layout which has no dedicated header bar"
  - "NotificationToggle is UI-only in Phase 2; email preference persistence to DB is deferred to Phase 6 (Inngest always sends when RESEND_API_KEY is set)"
  - "useEffect dependency array for markAllNotificationsRead intentionally omits notifications to prevent re-firing on every render (eslint-disable comment added)"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_changed: 8
requirements:
  - CHORE-08
  - CHORE-09
  - CHORE-10
---

# Phase 02 Plan 05: Real-time Notification Bell and Settings Toggle Summary

**One-liner:** Supabase Realtime subscription on the notifications table drives a bell badge + dropdown in the app header, with email preference toggle in settings.

---

## What Was Built

### Task 1: Extend RealtimeProvider with notifications subscription

Extended `RealtimeProvider` to subscribe to the `notifications` table for the current user via Supabase Realtime (postgres_changes INSERT event, filtered by `user_id`). Added `NotificationItem` interface, `notifications[]` array state, and `unreadCount` computed property to `RealtimeContextValue`. Added required `userId: string` prop to `RealtimeProviderProps`.

**Commits:**
- `9f31517` — feat(02-05): extend RealtimeProvider with notifications subscription

### Task 2: NotificationBell, NotificationDropdown, header wiring, settings toggle

Created `NotificationBell` (reads `unreadCount` from `useRealtime()`, renders badge when count > 0) and `NotificationDropdown` (lists notifications with relative time via `date-fns`, marks all read on mount via Server Action). Created `markAllNotificationsRead` Server Action. Wired `NotificationBell` into app layout with `userId` prop on RealtimeProvider. Added Notifications section to settings page with `NotificationToggle` client component (`role="switch"`).

**Commits:**
- `463421e` — feat(02-05): NotificationBell, NotificationDropdown, header wiring, settings toggle

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed connection.test.tsx mock values missing new RealtimeContextValue fields**
- **Found during:** Task 1
- **Issue:** After extending `RealtimeContextValue` with `notifications` and `unreadCount`, the 5 existing `mockUseRealtime.mockReturnValue()` calls in `tests/unit/realtime/connection.test.tsx` failed TypeScript type-checking because they only provided `{ status, activityItems }`.
- **Fix:** Added `notifications: []` and `unreadCount: 0` to all 5 mock return values.
- **Files modified:** `tests/unit/realtime/connection.test.tsx`
- **Commit:** `9f31517`

---

## Decisions Made

1. **NotificationBell placement:** Fixed position (top-right, z-30) in app layout rather than inside a semantic header. The existing layout has no explicit `<header>` bar — ConnectionIndicator and children are rendered directly. Restructuring the full app shell is out of scope for this plan.

2. **NotificationToggle is UI-only:** The toggle state is local React state only. Persisting the preference to the DB is explicitly a Phase 6 enhancement per the plan notes. The Inngest notification functions always fire when `RESEND_API_KEY` is configured.

3. **Single useEffect for mark-all-read:** The `useEffect` in `NotificationDropdown` runs once on mount with an empty dependency array — intentional to avoid re-firing on every render cycle. The eslint-disable comment documents the deliberate choice.

---

## Self-Check

Verifying created files exist and commits are present:

- FOUND: src/components/notifications/NotificationBell.tsx
- FOUND: src/components/notifications/NotificationDropdown.tsx
- FOUND: src/app/actions/notifications.ts
- FOUND: src/app/(app)/settings/NotificationToggle.tsx
- FOUND: commit 9f31517
- FOUND: commit 463421e

## Self-Check: PASSED
