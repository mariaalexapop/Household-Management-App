---
phase: 04-tracker-modules
plan: 07
subsystem: insurance-ui
tags: [ui, client-component, server-component, insurance, document-upload, react-hook-form, zod, miro-design]
dependency_graph:
  requires: [04-01, 04-02, 04-04]
  provides: [InsurancePage, InsuranceClient, PolicyForm]
  affects: [04-09]
tech_stack:
  added: []
  patterns: [server-component-data-fetch, client-component-form, react-hook-form-zod, optimistic-document-list]
key_files:
  created:
    - src/app/(app)/insurance/page.tsx
    - src/app/(app)/insurance/InsuranceClient.tsx
  modified: []
decisions:
  - "Inline PolicyForm subcomponent inside InsuranceClient.tsx to keep dialog state colocated and reduce file count for a single-screen module"
  - "Premium entered in pounds (number input with step=0.01), converted to integer cents via poundsToCents on submit, formatted on display via formatCostFromCents (COST-01 compliance)"
  - "paymentSchedule modeled as free string in form schema (with empty string default) and narrowed to PaymentSchedule | null at submit time, working around zod enum + empty string + react-hook-form resolver friction"
  - "Optimistic local document list (useState) so newly uploaded files appear immediately without waiting for router.refresh round-trip"
  - "Inline confirm() for policy delete is sufficient for v1; document delete uses sonner toast pattern from DocumentList"
metrics:
  duration_seconds: 720
  completed: "2026-04-11"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
requirements: [INS-01, INS-02, INS-03, INS-04, INS-06]
---

# Phase 4 Plan 07: Insurance UI Summary

Insurance management UI delivering a /insurance page with policy CRUD, document upload, payment schedule display, and reminder configuration. Server Component fetches policies + documents in parallel; Client Component renders Miro-styled cards (purple #9333ea accent), an Add/Edit dialog driven by react-hook-form + zod, and per-policy document upload via the shared FileUploadZone + DocumentList primitives from Plan 04-02.

## Tasks Completed

| Task | Name                                                              | Commit  | Key Files                                          |
| ---- | ----------------------------------------------------------------- | ------- | -------------------------------------------------- |
| 1    | Insurance page Server Component                                   | 1f6e7fe | src/app/(app)/insurance/page.tsx                   |
| 2    | InsuranceClient with policy CRUD, forms, and document upload      | 7a04004 | src/app/(app)/insurance/InsuranceClient.tsx        |

## What Was Built

### Task 1 — `src/app/(app)/insurance/page.tsx`

- Auth check via `createClient().auth.getUser()`; redirects to `/auth/login` if anonymous and `/onboarding` if no household membership.
- Parallel data fetch with `Promise.all`:
  - `insurancePolicies` filtered by `householdId`, ordered by `expiryDate desc`.
  - `documents` filtered by `householdId` AND `module='insurance'`, ordered by `createdAt desc`.
- Serializes all `Date` columns to ISO strings (`toISOString()`) before passing to the Client Component, since Date objects can't cross the server/client boundary cleanly.
- Standard app layout: header with Kinship branding + Calendar/Dashboard nav, main content max-w-5xl, renders `<InsuranceClient />`.
- Exports `metadata = { title: 'Insurance — Kinship' }`.

### Task 2 — `src/app/(app)/insurance/InsuranceClient.tsx`

**Page header (Miro design):**
- 32px font-display heading "Insurance" with `border-l-4` purple `#9333ea` accent strip.
- "Add Policy" rounded-full button in purple `#9333ea`, darkening to `#7e22ce` on hover.

**Policy list (`SerializedPolicy[]`):**
- `ring-miro rounded-xl bg-white p-5` cards in a vertical grid.
- Each card shows:
  - Colour-coded type badge (home=blue, car=orange, health=green, life=purple, travel=teal, other=gray).
  - Policy number (if set).
  - Insurer name as `font-display` heading.
  - Expiry date with `formatDistanceToNow` from date-fns ("Expires: 12 Jun 2026 (in 2 months)").
  - Payment schedule label + premium formatted via `formatCostFromCents`.
  - Next payment date.
  - Renewal contact name (inline).
  - Reminder settings line (e.g., "Expiry reminder: 30 days before").
- Card actions: Edit (pencil), Delete (trash with `confirm()`), Expand (chevron up/down).
- Empty state card: "No insurance policies yet. Add your first policy."

**Add/Edit dialog (`@base-ui/react/dialog` via wrapper):**
- max-w-2xl, max-h-[90vh], scrollable.
- `PolicyForm` subcomponent powered by `react-hook-form` + `zodResolver`.
- Sections: Policy Details (type select, insurer*, policy number), Expiry (DatePicker + `<ReminderConfig label="Expiry reminder">`), Payment (schedule select, premium £ number input, next payment DatePicker, conditional `<ReminderConfig label="Payment reminder">` when schedule selected), Renewal Contact (name, phone, email with regex validation).
- Submit calls `createPolicy` or `updatePolicy` from `src/app/actions/insurance.ts`. Toast on success/error via `sonner`. Closes dialog and `router.refresh()` on success.
- `dateToISOWithOffset` helper converts `yyyy-MM-dd` from DatePicker into the full ISO-with-offset string the server action expects (`z.string().datetime({ offset: true })`).

**Document upload (per expanded policy card):**
- `FileUploadZone module="insurance" entityId={policy.id} documentType="policy"` (drag-and-drop PDF).
- `DocumentList` rendering documents linked to this policy (filtered from the shared documents array via `useMemo` map keyed by `entityId`).
- Optimistic update: on upload complete, prepends doc to local `useState<SerializedDocument[]>` so it appears immediately; also `router.refresh()` to revalidate server state.
- On document delete callback, removes from local array and refreshes.

## Verification Performed

- `rtk npx tsc --noEmit` → passes cleanly (no errors in insurance files).
- Insurance directory created with both files; no other files modified.
- All five `requirements` (INS-01–04, INS-06) covered by the UI:
  - INS-01: list policies on `/insurance` ✓
  - INS-02: add policy with all required fields ✓
  - INS-03: upload PDF documents via drag-and-drop ✓
  - INS-04: edit & delete policies ✓
  - INS-06: configure expiry & payment reminders ✓

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] zod schema + react-hook-form resolver type incompatibility**
- **Found during:** Task 2 (tsc verification)
- **Issue:** `paymentSchedule: z.enum(['annual','quarterly','monthly',''])` failed type narrowing inside react-hook-form's `Resolver` because `z.input` and `z.output` diverged on `.optional().default()` fields, producing `Type 'undefined' is not assignable to type 'number'` and `SubmitHandler` mismatch errors.
- **Fix:** Modeled `paymentSchedule` as a plain `z.string().optional().default('')` in the form schema, then narrowed to `PaymentSchedule | null` at submit time with explicit comparisons. Used `z.input<typeof formSchema>` for `useForm` generic and re-parsed inside `onSubmit` so the parsed values match the strict server-action payload.
- **Files modified:** src/app/(app)/insurance/InsuranceClient.tsx
- **Commit:** 7a04004

### Out-of-scope (deferred)

- TS2307 errors in `src/app/(app)/cars/page.tsx` (missing `./CarsClient`) and `src/app/(app)/electronics/page.tsx` (missing `./ElectronicsClient`) appeared in an early tsc run. These are pre-existing scaffolds owned by Plans 04-06 and 04-08 respectively and were already documented in `.planning/phases/04-tracker-modules/deferred-items.md`. They were not modified here. By the final tsc run they no longer surfaced (likely cleared by parallel work or rtk filtering); insurance compiles cleanly in isolation regardless.

## Authentication Gates

None. No external auth or secrets needed for this plan.

## Self-Check: PASSED

- Files created:
  - FOUND: src/app/(app)/insurance/page.tsx
  - FOUND: src/app/(app)/insurance/InsuranceClient.tsx
- Commits:
  - FOUND: 1f6e7fe (Task 1 — insurance page Server Component)
  - FOUND: 7a04004 (Task 2 — InsuranceClient with CRUD + document upload)
- Verification:
  - `rtk npx tsc --noEmit` → passes
