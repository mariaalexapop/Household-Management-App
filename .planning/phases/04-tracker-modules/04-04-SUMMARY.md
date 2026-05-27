---
phase: 04-tracker-modules
plan: 04
subsystem: insurance-backend
tags: [server-actions, inngest, insurance, reminders, zod]
dependency_graph:
  requires: [04-01]
  provides: [createPolicy, updatePolicy, deletePolicy, sendInsuranceExpiryReminder, sendInsurancePaymentReminder]
  affects: [04-07, 04-08, 04-09]
tech_stack:
  added: []
  patterns: [payment-schedule-reminders, storage-cleanup-on-delete, db-recheck-before-notification]
key_files:
  created:
    - src/app/actions/insurance.ts
    - src/lib/inngest/functions/send-insurance-reminder.ts
  modified:
    - src/app/api/inngest/route.ts
decisions:
  - "Inngest fires separate events for expiry vs payment reminders (not a single combined event)"
  - "deletePolicy cleans up Storage files + document rows before removing the policy to avoid orphaned files"
  - "Update only fires new Inngest events when dates actually change (avoids duplicate reminders)"
metrics:
  duration_seconds: 135
  completed: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
requirements: [INS-01, INS-03, INS-04, INS-05, INS-06]
---

# Phase 4 Plan 04: Insurance Server Actions and Reminders Summary

Insurance CRUD server actions with Zod validation, payment schedule support (annual/quarterly/monthly), Supabase Storage cleanup on delete, and two Inngest reminder functions (expiry + payment) that re-check DB dates before firing notifications.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create insurance server actions | 4c83a1d | src/app/actions/insurance.ts |
| 2 | Create Inngest insurance reminder functions | 89c27c6 | src/lib/inngest/functions/send-insurance-reminder.ts, src/app/api/inngest/route.ts |

## Implementation Details

### Task 1: Insurance Server Actions

Three server actions following the kids.ts pattern:

- **createPolicy**: Validates with Zod (policy type enum, payment schedule enum, premium in cents), inserts into insurancePolicies, fires `insurance/expiry.reminder.scheduled` event, conditionally fires `insurance/payment.reminder.scheduled` if nextPaymentDate set.
- **updatePolicy**: Verifies household ownership, updates policy, fires new Inngest events only when dates change.
- **deletePolicy**: Queries linked documents (module='insurance'), removes files from Supabase Storage bucket, deletes document DB rows, then deletes the policy. Prevents orphaned files (Pitfall 3).

### Task 2: Inngest Insurance Reminder Functions

Two Inngest functions in a single file:

- **sendInsuranceExpiryReminder**: Sleeps until expiryDate - reminderDays * days. Re-checks DB to confirm policy exists and expiry date unchanged. Inserts notification + sends email via Resend.
- **sendInsurancePaymentReminder**: Sleeps until nextPaymentDate - reminderDays * days. Re-checks DB to confirm policy exists and payment date unchanged. Inserts notification + sends email via Resend.

Both registered in the Inngest serve handler at `src/app/api/inngest/route.ts`.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation (`tsc --noEmit`) passes on both tasks
- insurance.ts exports 3 server actions (createPolicy, updatePolicy, deletePolicy)
- send-insurance-reminder.ts exports 2 Inngest functions (sendInsuranceExpiryReminder, sendInsurancePaymentReminder)
- Both functions registered in serve handler
