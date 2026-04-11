---
phase: 04-tracker-modules
plan: 06
subsystem: cars
tags: [ui, server-component, client-component, crud, forms, dialogs, tracker]
dependency_graph:
  requires: [04-02, 04-03]
  provides: [cars-ui, service-history-ui]
  affects: [calendar, dashboard]
tech_stack:
  added: []
  patterns:
    - server-component-data-fetch
    - date-serialization-at-boundary
    - react-hook-form-with-zod-resolver
    - base-ui-dialog
    - sonner-toast-feedback
    - optimistic-refresh-via-router-refresh
key_files:
  created:
    - src/app/(app)/cars/page.tsx
    - src/app/(app)/cars/CarsClient.tsx
  modified: []
decisions:
  - "Serialize all Date fields to ISO strings in the Server Component before passing to the Client Component to keep props JSON-safe"
  - "Store user-entered cost in pounds and convert to cents via poundsToCents on submit (DB is cents per COST-01)"
  - "Use router.refresh() after every mutation rather than optimistic local state — simpler and server actions already revalidatePath('/cars')"
  - "Service history is inline-expandable under the car grid rather than a separate drawer, keeping focus on the selected car"
  - "Reminder days are rendered through ReminderConfig select (7/14/30/60/90) — no free-form input to avoid invalid values"
metrics:
  duration_seconds: 337
  completed: "2026-04-11T15:50:06Z"
  tasks_completed: 2
  tasks_total: 2
requirements: [CAR-01, CAR-02, CAR-03, CAR-05, CAR-06]
---

# Phase 04 Plan 06: Cars UI Summary

Full car maintenance UI at /cars: Server Component fetches cars + service records, Client Component renders an orange-accented Miro grid with car cards, add/edit/delete dialogs with react-hook-form + zod, expandable service history timeline, and key date reminder configuration wired to the Plan 03 server actions.

## Tasks Completed

### Task 1: Cars Server Component page
- **Commit:** 219e571
- **Files:** `src/app/(app)/cars/page.tsx`
- Auth check via `createClient()` → `getUser()` → redirect to `/auth/login`
- Household lookup via `householdMembers` (redirects to `/onboarding` if missing)
- Parallel data fetch using `Promise.all` for cars + service records (ordered by `serviceDate desc`)
- Serializes every `Date` column (MOT/tax/next service, serviceDate, createdAt) to ISO strings so the client component props are JSON-safe
- Renders the shared Kinship `(app)` header with page label "Cars" and Calendar/Dashboard links, then mounts `<CarsClient>` inside `max-w-5xl` main
- Exports `metadata = { title: 'Cars — Kinship' }`

### Task 2: CarsClient (list, forms, service timeline, reminders)
- **Commit:** d76040c
- **Files:** `src/app/(app)/cars/CarsClient.tsx`
- **Car grid:** responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` of `ring-miro rounded-xl` cards showing Car icon (orange tinted), make/model (font-display), year, plate, colour swatch, three key date badges (MOT/Tax/Service) each with "Xd reminder" chip, and row of Edit / Delete / History actions
- **Empty state:** Car icon + prompt message when no cars exist
- **Add/Edit Car dialog:** `@base-ui/react` Dialog wrapper, `react-hook-form` + `zodResolver(carFormSchema)` with client-side validation for make/model/year/plate; colour input with live swatch preview; three `DatePicker` fields for MOT/tax/next service; three `ReminderConfig` selects for reminder days. Submits via `createCar`/`updateCar` server action and shows sonner toasts for success/error
- **Delete car confirmation:** secondary dialog with destructive button, cascades via FK to service records
- **Service history timeline:** expands beneath the grid when a car is selected; lists records newest-first with colour-coded service type badges (`full_service`/`mot`/`repair`/`tyre`/`other`), mileage, garage, `formatCostFromCents` cost, and notes
- **Add/Edit Service Record dialog:** date picker, service type select, mileage (int), cost (entered in pounds, converted via `poundsToCents`), garage, notes textarea
- **Delete service record confirmation:** destructive dialog → `deleteServiceRecord` → `router.refresh()`
- **Miro design throughout:** `ring-miro rounded-xl` cards, `font-display` headings, `font-body` body, orange `#ea580c` primary accent on buttons/badges/swatches, `bg-kinship-surface` page background inherited from Server Component
- **Page header:** 32px font-display heading with a 4px-wide orange accent strip on the left
- Uses `router.refresh()` after every mutation so the Server Component re-fetches fresh data

## Deviations from Plan

None — plan executed exactly as written.

**Minor adjustments (not deviations):**
- Zod v4 schema uses `{ message: ... }` instead of the deprecated `invalid_type_error` key for the year field (caught by initial typecheck)
- Used `router.refresh()` rather than local optimistic state for the car list because the Server Component already owns the data and the Plan 03 server actions call `revalidatePath('/cars')`. This keeps the client component simpler while still feeling snappy

## Verification

- `rtk npx tsc --noEmit` passes with no errors in `src/app/(app)/cars/**`
- Server Component redirects unauthenticated users and household-less users
- Client component imports only exist server actions (`createCar`, `updateCar`, `deleteCar`, `createServiceRecord`, `updateServiceRecord`, `deleteServiceRecord`) and the shared `ReminderConfig` / `DatePicker` components
- Dialogs use the project's `@base-ui/react`-backed `Dialog` wrapper (not Radix)
- All costs entered in pounds by the user and stored as integer cents via `poundsToCents`

## Self-Check: PASSED

- FOUND: src/app/(app)/cars/page.tsx
- FOUND: src/app/(app)/cars/CarsClient.tsx
- FOUND: commit 219e571 (Task 1)
- FOUND: commit d76040c (Task 2)
