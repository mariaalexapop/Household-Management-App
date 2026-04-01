---
plan: "01-08"
phase: 1
title: "Real-time sync, reconnect indicator, activity feed, GDPR deletion"
status: complete
completed: 2026-04-01
---

# Summary: Plan 01-08

## What was built

### Task 1 — RealtimeProvider, ConnectionIndicator, ActivityFeed, (app) layout
- `src/components/realtime/RealtimeProvider.tsx` — Subscribes to `household:{id}` channel with two `postgres_changes` listeners (household_members + activity_feed). Tracks connection status via subscribe callback and onHeartbeat guard. Exposes `{ status, activityItems }` via React context. Calls `router.refresh()` on membership changes.
- `src/components/realtime/ConnectionIndicator.tsx` — Fixed-position banner shown when status is 'connecting' or 'disconnected'. Renders null when connected.
- `src/components/household/ActivityFeed.tsx` — Merges server-fetched initialItems with realtime activityItems via exported `mergeActivityItems` pure function. Deduplicates by id, sorts by created_at desc, shows max 20 items. Human-readable event text for all Phase 1 event types.
- `src/app/(app)/layout.tsx` — Server Component that fetches current user's household_id, wraps children with RealtimeProvider, includes ConnectionIndicator.
- `tests/unit/realtime/connection.test.tsx` — 9 unit tests: ConnectionIndicator conditional rendering, mergeActivityItems deduplication/sorting, ActivityFeed rendering (empty state + populated).

### Task 2 — Settings, module toggles, GDPR
- `src/app/actions/settings.ts` — `updateModules` Server Action with Zod validation, updates household_settings.active_modules, inserts modules_updated activity event, calls revalidatePath('/dashboard').
- `src/app/(app)/settings/modules/page.tsx` — Server Component with inline ModuleToggleList client component. 5 shadcn Switch toggles, sonner toast on success.
- `src/app/(app)/settings/page.tsx` — Single-page settings with Profile, Modules link, and Danger Zone sections.
- `src/app/(app)/settings/DeleteAccountSection.tsx` — Delete account flow with confirmation dialog requiring user to type "DELETE".
- `src/app/api/household/gdpr/route.ts` — DELETE handler: authenticates, calls `createAdminClient().auth.admin.deleteUser(userId)`, cascades via FK ON DELETE CASCADE, best-effort Resend confirmation email.
- `tests/e2e/realtime.spec.ts` — 4 E2E smoke tests: no reconnecting banner on dashboard, 5 module toggles on /settings/modules, 405 on GET /api/household/gdpr, Activity section on /household.

## Deviations from plan
- `useMemo` removed from `ActivityFeed` (React 19 + Vitest dispatcher null issue; direct computation is correct for ≤20 items)
- `asChild` removed from `DialogTrigger`/`DialogClose` in DeleteAccountSection (base-ui Dialog doesn't support `asChild`; controlled open state used instead)
- `(string[]).includes(m)` cast in settings.ts to satisfy TypeScript strict typing on ModuleKey array

## Phase 1 complete
All 8 plans in Phase 1 (Foundation & Onboarding) are complete.
Requirements satisfied: AUTH-01–05, ONBD-01–04, HSLD-01–08, PLAT-01, PLAT-02, PLAT-04, PLAT-05.
