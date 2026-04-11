---
phase: 04-tracker-modules
plan: 09
subsystem: integration
tags: [calendar, costs, dashboard, cars, insurance, electronics]
requires:
  - 04-06 # cars module
  - 04-07 # insurance module
  - 04-08 # electronics module
  - 04-02 # formatCostFromCents utility
  - 03-05 # CalendarEvent type + /calendar page
provides:
  - extended-calendar-events (car/insurance/electronics)
  - costs-dashboard
  - tracker-dashboard-cards
affects:
  - src/app/(app)/calendar/page.tsx
  - src/app/(app)/dashboard/page.tsx
  - src/components/dashboard/DashboardGrid.tsx
tech_stack:
  added: []
  patterns:
    - drizzle-sql-aggregation
    - server-component-search-params
    - parallel-promise-all-queries
key_files:
  created:
    - src/app/(app)/costs/page.tsx
    - src/app/(app)/costs/CostsClient.tsx
    - src/components/dashboard/CarDashboardCard.tsx
    - src/components/dashboard/InsuranceDashboardCard.tsx
    - src/components/dashboard/ElectronicsDashboardCard.tsx
  modified:
    - src/app/(app)/calendar/page.tsx
    - src/app/(app)/dashboard/page.tsx
    - src/components/dashboard/DashboardGrid.tsx
    - tests/unit/dashboard/dashboard.test.ts
decisions:
  - Used Drizzle raw `sql` template with `to_char(..., 'YYYY-MM')` for monthly grouping (no charting library, simple table per user preference)
  - Car events rendered with NO window filter (small dataset; matches research recommendation in PLAN)
  - Module accent strips implemented as absolute-positioned 1px bars at top of each dashboard card
  - Year filter uses search params + router.push for URL-shareable filter state
  - Dashboard cards only render for active modules (plan's conditional-render pattern)
metrics:
  duration_minutes: 26
  tasks_completed: 2
  files_created: 5
  files_modified: 4
  commits: 2
  completed_at: 2026-04-11T16:18:00Z
requirements:
  - COST-02
  - COST-03
  - CAR-03
  - INS-04
  - ELEC-03
---

# Phase 4 Plan 09: Tracker Integration Summary

Integrated all three Phase 4 tracker modules (cars, insurance, electronics) into the unified calendar, built the costs dashboard with monthly breakdowns, and added three dedicated tracker dashboard cards to the main dashboard.

## One-liner

Extended /calendar with car/insurance/electronics events in canonical module colours, added a /costs page with per-section monthly breakdown filterable by year using Drizzle SQL aggregations, and wired three new dashboard cards (Car/Insurance/Electronics) into DashboardGrid.

## What Was Built

### Task 1: Calendar integration (commit `c854832`)

Extended `src/app/(app)/calendar/page.tsx`:

- Added three parallel Drizzle queries inside the existing `Promise.all`: cars, insurance policies, electronics. None use window filtering (per the research recommendation — small datasets per household).
- Mapped each row to `CalendarEvent[]`:
  - **Cars**: up to three events per car (MOT, Tax, Service) — only for non-null dates. Title format `MOT: Make Model`, id `${carId}-mot` (etc.), colour `MODULE_COLOURS.car` (#ea580c), href `/cars`.
  - **Insurance**: expiry event (always) + optional payment event. Title `${insurer} ${policyType} expires` / `${insurer} payment due`, colour `MODULE_COLOURS.insurance` (#9333ea), href `/insurance`.
  - **Electronics**: warranty expiry events only (skipping null `warrantyExpiryDate`). Title `${name} warranty expires`, colour `MODULE_COLOURS.electronics` (#0d9488), href `/electronics`.
- Added nav links for `/cars`, `/insurance`, `/electronics` to the calendar page header.
- All events merged with existing chore + kids events and sorted by `startsAt`.

### Task 2: Costs dashboard + 3 tracker dashboard cards (commit `5b3423b`)

**`src/app/(app)/costs/page.tsx`** — Server Component:
- Auth + household resolution pattern matches existing pages.
- Accepts `?year=YYYY` search param; defaults to the current year and validates `2000 <= year <= 2100`.
- Three parallel `db.execute(sql`…`)` aggregations using `to_char(date, 'YYYY-MM')` GROUP BY for cars (service_records.cost_cents), insurance (insurance_policies.premium_cents keyed on next_payment_date), and electronics (electronics.cost_cents keyed on purchase_date).
- Normalises query results into 12 month rows (empty months default to 0), builds a 5-year year-select option list.

**`src/app/(app)/costs/CostsClient.tsx`** — `'use client'`:
- Header with year `<select>` — on change, navigates via `router.push('/costs?year=…')`.
- Section total summary cards with coloured accent strips (car orange, insurance purple, electronics teal, total Kinship primary blue).
- Monthly breakdown table with columns: Month, Cars, Insurance, Electronics, Total. Empty cells render `--` (via `formatOrDash` helper). Grand total row in `<tfoot>`. Costs formatted via `formatCostFromCents` (from Plan 04-02).
- Tailwind utilities only — no charting library (per user decision).

**3 Dashboard Cards** (`src/components/dashboard/{Car,Insurance,Electronics}DashboardCard.tsx`):
- Each follows the `KidsDashboardCard.tsx` pattern (Card + icon + heading + upcoming list + footer link).
- Coloured accent strip at top of each card matching the module colour.
- `CarDashboardCard`: collects MOT/Tax/Service key dates across all cars, filters to upcoming (>= −1 day from today), sorts ascending, caps at 3. Shows `{type}: {make} {model}` with days-until badge.
- `InsuranceDashboardCard`: sorts policies by expiry date, shows up to 3 upcoming expiries with days-until badge.
- `ElectronicsDashboardCard`: filters items with a warranty, sorts by expiry, shows up to 3 upcoming with days-until badge.
- All have appropriate empty states (no items tracked vs no upcoming dates).

**`src/components/dashboard/DashboardGrid.tsx`**:
- Added three new props: `upcomingCars`, `upcomingPolicies`, `upcomingElectronics`.
- `activeModules.map` now branches for `'car'`, `'insurance'`, `'electronics'` keys to render the respective dashboard cards (replacing the old fallback to `ModuleCard`/"Coming soon").

**`src/app/(app)/dashboard/page.tsx`**:
- Added three conditional queries (one per tracker module, gated by `activeModules.includes(...)`) fetching the fields each card needs.
- Passes the new arrays to `<DashboardGrid>`.
- Added Calendar + Costs links in the dashboard header.

## Verification

- `rtk npx tsc --noEmit` — passes cleanly (0 errors).
- `rtk pnpm exec vitest run tests/unit/dashboard/dashboard.test.ts` — **10/10 passing** after test updates for the new DashboardGrid signature.
- Manual review of calendar page confirms car/insurance/electronics events render via the existing `UnifiedCalendar` component (no component changes needed — CalendarEvent type already supported the new module keys since Phase 3 Plan 05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Updated existing dashboard test to match new DashboardGrid signature**
- **Found during:** Task 2 typecheck after adding `upcomingCars/upcomingPolicies/upcomingElectronics` props.
- **Issue:** `tests/unit/dashboard/dashboard.test.ts` had 6 TS2769 errors because all `render(React.createElement(DashboardGrid, …))` calls were missing the new required props. It also asserted that `car`/`insurance`/`electronics` rendered `ModuleCard` with a "Coming soon" badge — which is no longer true.
- **Fix:** Added an `emptyExtras` constant with empty upcoming arrays and spread it into every `createElement` call. Rewrote the two "Coming soon" assertions to assert zero badges, and added positive assertions that each module's dedicated card heading ("Cars", "Insurance", "Electronics", "Kids Activities", "Home Chores") is present when all modules are active. Added `Monitor` to the lucide-react mock for `ElectronicsDashboardCard`.
- **Files modified:** `tests/unit/dashboard/dashboard.test.ts`
- **Commit:** `5b3423b`
- **Verification:** `vitest run tests/unit/dashboard/dashboard.test.ts` → 10 passing.

### Authentication Gates

None.

## Key Decisions

- **No charting library** — used a plain HTML table with tabular-nums Tailwind for the cost breakdown. Keeps the dependency tree lean and matches the stated user preference. Easy to swap later for Recharts if richer visualisations are needed.
- **Drizzle `sql` template over JS reduce** — the aggregation happens in Postgres (GROUP BY to_char(...)) rather than loading raw rows and grouping in JS. Scales if a household ever has hundreds of service records.
- **`differenceInCalendarDays(..., today) >= -1`** — cards include today's items (days=0) and yesterday's (days=-1) as a small grace window so a MOT "due today" still shows up on the card.
- **Dashboard cards read directly from DB, not via an API layer** — matches the existing ChoresDashboardCard/KidsDashboardCard pattern (Server Component fetches, passes props to client card).

## Files Changed

**Created:**
- `src/app/(app)/costs/page.tsx` (125 lines)
- `src/app/(app)/costs/CostsClient.tsx` (147 lines)
- `src/components/dashboard/CarDashboardCard.tsx` (90 lines)
- `src/components/dashboard/InsuranceDashboardCard.tsx` (76 lines)
- `src/components/dashboard/ElectronicsDashboardCard.tsx` (80 lines)

**Modified:**
- `src/app/(app)/calendar/page.tsx` — +152 / −6 (3 new queries + 3 event mappers + nav links)
- `src/app/(app)/dashboard/page.tsx` — +55 / −2 (3 new conditional queries + header nav)
- `src/components/dashboard/DashboardGrid.tsx` — +27 / −8 (3 new props + 3 new branches)
- `tests/unit/dashboard/dashboard.test.ts` — +68 / −25 (signature updates + assertion rewrites)

## Commits

- `c854832` — feat(04-09): extend calendar with car/insurance/electronics events
- `5b3423b` — feat(04-09): add costs dashboard, 3 tracker dashboard cards, integrate into DashboardGrid

## Self-Check: PASSED

- `src/app/(app)/calendar/page.tsx` — FOUND (modified)
- `src/app/(app)/costs/page.tsx` — FOUND
- `src/app/(app)/costs/CostsClient.tsx` — FOUND
- `src/components/dashboard/CarDashboardCard.tsx` — FOUND
- `src/components/dashboard/InsuranceDashboardCard.tsx` — FOUND
- `src/components/dashboard/ElectronicsDashboardCard.tsx` — FOUND
- `src/components/dashboard/DashboardGrid.tsx` — FOUND (modified)
- `src/app/(app)/dashboard/page.tsx` — FOUND (modified)
- commit `c854832` — FOUND in `git log`
- commit `5b3423b` — FOUND in `git log`
- `rtk npx tsc --noEmit` — PASS
- `vitest run tests/unit/dashboard/dashboard.test.ts` — 10/10 PASS
