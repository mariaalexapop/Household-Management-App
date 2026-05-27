---
phase: 04-tracker-modules
plan: 03
subsystem: cars
tags: [server-actions, inngest, reminders, crud]
dependency_graph:
  requires: [04-01]
  provides: [car-server-actions, car-inngest-reminder]
  affects: [cars-ui, calendar]
tech_stack:
  added: []
  patterns: [server-actions-crud, inngest-sleep-recheck]
key_files:
  created:
    - src/app/actions/cars.ts
    - src/lib/inngest/functions/send-car-reminder.ts
  modified:
    - src/app/api/inngest/route.ts
decisions:
  - Batch Inngest events via inngest.send(array) for multiple key dates on car create/update
  - Stale reminder strategy: fire new events on update; Inngest function re-checks DB dates before sending
metrics:
  duration_seconds: 142
  completed: "2026-04-09T15:57:35Z"
---

# Phase 4 Plan 03: Car Server Actions + Inngest Reminders Summary

Car CRUD server actions (6 total) with Zod validation and Inngest key-date reminder function that re-checks DB before firing notifications.

## What Was Built

### Server Actions (src/app/actions/cars.ts)

6 server actions following the kids.ts pattern exactly:

1. **createCar** -- Validates input, inserts car, fires Inngest reminder events for non-null MOT/tax/service dates
2. **updateCar** -- Validates, verifies household ownership, updates car, fires fresh reminder events for changed dates
3. **deleteCar** -- Validates, verifies ownership, deletes car (cascade deletes service records via FK)
4. **createServiceRecord** -- Validates, verifies car belongs to household, inserts service record
5. **updateServiceRecord** -- Validates, verifies record belongs to household, updates service record
6. **deleteServiceRecord** -- Validates, verifies ownership, deletes service record

All actions: auth check via Supabase getUser(), household membership via getMemberRow(), Zod validation, revalidatePath for /cars and /calendar.

### Inngest Reminder (src/lib/inngest/functions/send-car-reminder.ts)

- Triggered by `car/reminder.scheduled` event
- Sleeps until dueDate minus reminderDays
- **CRITICAL: Re-checks car dates from DB before sending** -- handles updates/deletes since event was fired
- Compares stored date with event date; skips if changed
- Inserts notification row (type: 'car_reminder')
- Sends email via Resend with link to /cars

### Zod Schemas

- `createCarSchema`: make, model, year (1900-2100), plate, colour, 3 date fields, 3 reminder-days fields with defaults
- `updateCarSchema`: extends create with id (uuid)
- `createServiceRecordSchema`: carId, serviceDate, serviceType enum (full_service/mot/repair/tyre/other), mileage, garage, costCents, notes
- `updateServiceRecordSchema`: extends create with id (uuid)

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Batch Inngest events**: Used `inngest.send(array)` to send multiple reminder events in one call when a car has multiple key dates set.
2. **Stale reminder strategy**: On update, new events are fired unconditionally. The Inngest function compares the event's dueDate against the current DB value and skips if they differ -- making stale reminders harmless.

## Verification

- TypeScript compiles cleanly (`tsc --noEmit` passes)
- 6 server actions export from cars.ts
- sendCarReminder exports from send-car-reminder.ts
- sendCarReminder registered in Inngest serve handler

## Commits

| Hash | Description |
|------|-------------|
| 4c83a1d | feat(04-03): add car server actions (CRUD for cars and service records) |
| b7ac1cc | feat(04-03): add Inngest car reminder function with DB re-check |
