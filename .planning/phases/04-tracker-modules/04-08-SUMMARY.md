---
phase: 04-tracker-modules
plan: 08
subsystem: electronics-ui
tags: [electronics, tracker, ui, warranty, documents]
requires:
  - src/app/actions/electronics.ts (04-05)
  - src/app/actions/documents.ts (04-02)
  - src/components/tracker/FileUploadZone.tsx (04-02)
  - src/components/tracker/DocumentList.tsx (04-02)
  - src/lib/format.ts (04-02)
provides:
  - /electronics page with full CRUD UI
  - Warranty + manual PDF upload per item
  - Warranty expiry status display
affects:
  - Kinship top-level navigation (new /electronics route)
tech-stack:
  added: []
  patterns:
    - Server Component fetch + ISO date serialization across client boundary
    - react-hook-form + zod form validation
    - £ (pounds) UI input converted to integer cents at submission
    - useMemo-based document grouping by entityId
key-files:
  created:
    - src/app/(app)/electronics/page.tsx
    - src/app/(app)/electronics/ElectronicsClient.tsx
  modified: []
decisions:
  - "Cost input uses pounds with step 0.01, converted to cents via poundsToCents before hitting the server action."
  - "Warranty status rendered via date-fns formatDistanceToNowStrict for the not-expired case and a red 'Warranty expired' label for the past case; falls back to 'No warranty' when warrantyExpiryDate is null."
  - "Documents are grouped by entityId in a useMemo'd Map rather than re-filtering on every item render."
  - "Upload-complete handler optimistically adds the document to local state then calls router.refresh(); delete handler removes the doc locally and refreshes."
  - "Add/Edit share a single ItemDialog component with react-hook-form; form resets on open via an openKey memo."
metrics:
  duration_minutes: 4
  tasks_completed: 2
  files_created: 2
  files_modified: 0
  completed_at: 2026-04-11
---

# Phase 04 Plan 08: Electronics Module UI Summary

JWT-free, client-only electronics registry UI wired to existing Server Actions — delivers /electronics list, add/edit/delete dialogs, and dual warranty + manual PDF upload per item using shared tracker components.

## What was built

### Task 1 — `src/app/(app)/electronics/page.tsx`

Server Component that:

1. Authenticates the user (redirects to `/auth/login` if missing).
2. Resolves the household membership row (redirects to `/onboarding` if missing).
3. Fetches electronics items and module=`electronics` documents in parallel with `Promise.all`.
4. Serializes Drizzle `Date` columns to ISO strings so they can cross the server/client boundary.
5. Renders a Kinship header with Calendar/Dashboard nav links and hands items + documents to `<ElectronicsClient>`.

Exported metadata: `{ title: 'Electronics — Kinship' }`.

### Task 2 — `src/app/(app)/electronics/ElectronicsClient.tsx`

`'use client'` component with:

- **Page header**: 32px `font-display` heading with a 4px teal left border (`border-l-4 border-[#0d9488] pl-3`) and a rounded teal "Add Item" button (`bg-[#0d9488] hover:bg-[#0f766e]`).
- **Item grid**: responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` of `ring-miro rounded-xl` white cards. Each card shows:
  - Monitor icon in a teal tint box
  - `font-display` name + brand · model subtitle
  - Purchase date + formatted cost (`formatCostFromCents`)
  - Warranty status via date-fns `formatDistanceToNowStrict` — active (teal), expired (red), or "No warranty" (muted)
  - Truncated coverage summary that un-clamps when expanded
  - Footer actions: expand/collapse documents, edit, delete
- **Empty state**: centered Monitor icon with "No electronics items yet" copy when the list is empty.
- **Add/Edit dialog** (`ItemDialog`): react-hook-form + zod with fields for name (required), brand, model number, purchase date (DatePicker), cost in pounds (converted to cents via `poundsToCents`), warranty expiry date (DatePicker), and coverage summary (textarea). The warranty section has the help text "You'll receive a reminder 30 days before warranty expires." Submit calls `createItem` or `updateItem` and surfaces success/error via sonner toasts.
- **Delete confirmation dialog**: second Dialog scoped to `deleteTarget` state, red-tinted confirm button.
- **Per-item document section** (expanded state): two `<FileUploadZone>` blocks — one with `documentType="warranty"` and one with `documentType="manual"` — above a `<DocumentList>` filtered to the item's documents. Upload completion optimistically prepends the new document and calls `router.refresh()`; deletion removes locally then refreshes.

## Verification

- `rtk npx tsc --noEmit` — PASSES with zero errors.
- `rtk lint src/app/(app)/electronics` — no ESLint issues.
- Plan `must_haves.truths` satisfied:
  - Users see a list of electronics items on `/electronics`. YES (grid + empty state).
  - Users can add an item with name, brand, model number, purchase date, cost. YES (ItemDialog).
  - Users can set warranty expiry date and coverage summary. YES (dedicated warranty section in dialog).
  - Users can upload warranty documents and user manuals (PDF). YES (two FileUploadZones per item).
  - Users can edit and delete items. YES (pencil/trash icons + dialogs).
- Plan `must_haves.artifacts`:
  - `src/app/(app)/electronics/page.tsx` exists and fetches items + documents server-side. CONFIRMED.
  - `src/app/(app)/electronics/ElectronicsClient.tsx` exists with the item list, forms, and document upload. CONFIRMED.
- Plan `must_haves.key_links`:
  - ElectronicsClient imports `createItem`, `updateItem`, `deleteItem` from `@/app/actions/electronics`. CONFIRMED.
  - ElectronicsClient imports `FileUploadZone` from `@/components/tracker/FileUploadZone`. CONFIRMED.
- Requirements satisfied: ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-06.

## Deviations from Plan

None — both tasks were executed exactly as written. No auto-fixes, no architectural decisions, no auth gates.

One false alarm during execution: an initial `rtk npx tsc` run reported missing `./CarsClient` and `./InsuranceClient` imports; a `deferred-items.md` note was created and then removed after a clean re-run confirmed those files exist on disk. Cleanup was committed separately (`chore(04-08): remove inaccurate deferred-items.md`).

## Commits

| Task | Commit  | Message                                                    |
| ---- | ------- | ---------------------------------------------------------- |
| 1    | 07d5e5d | feat(04-08): add electronics page Server Component        |
| 2    | eef9782 | feat(04-08): add ElectronicsClient with CRUD + warranty docs |
| —    | (cleanup) | chore(04-08): remove inaccurate deferred-items.md         |

All commits pushed to `origin/main`.

## Self-Check: PASSED

- FOUND: src/app/(app)/electronics/page.tsx
- FOUND: src/app/(app)/electronics/ElectronicsClient.tsx
- FOUND commit: 07d5e5d (Task 1)
- FOUND commit: eef9782 (Task 2)
- tsc clean, lint clean
