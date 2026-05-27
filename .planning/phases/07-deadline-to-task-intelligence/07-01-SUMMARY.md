---
phase: "07"
plan: "01"
subsystem: database
tags: [schema, migration, suggestions, deadline-intelligence]
dependency_graph:
  requires: []
  provides: [suggestions-table]
  affects: [dashboard-queries, task-creation]
tech_stack:
  added: []
  patterns: [drizzle-schema, rls-policy, composite-unique-constraint]
key_files:
  created:
    - src/lib/db/migrations/0005_sharp_leech.sql
    - src/lib/db/migrations/meta/0005_snapshot.json
  modified:
    - src/lib/db/schema.ts
    - src/lib/db/migrations/meta/_journal.json
decisions:
  - "Used date type (not timestamp) for deadlineDate since only calendar date matters"
  - "suggestedOwnerId and acceptedTaskId are text (not uuid) to match plan spec"
  - "RLS uses same household-membership pattern as all other tables"
metrics:
  duration_seconds: 71
  completed: "2026-05-27T19:08:12Z"
---

# Phase 7 Plan 01: Suggestions Table Schema Summary

**One-liner:** Suggestions table with composite unique constraint and RLS for deadline-to-task intelligence pipeline.

## What Was Done

### Task 1: Add suggestions table to Drizzle schema
- Added `suggestions` table to `src/lib/db/schema.ts` following existing patterns
- 14 columns: id, householdId, sourceModule, sourceEntityId, sourceField, deadlineDate, suggestedTitle, suggestedNotes, suggestedOwnerId, status, acceptedTaskId, dismissedAt, createdAt, updatedAt
- Index on `(householdId, status)` for dashboard queries
- Unique constraint on `(householdId, sourceModule, sourceEntityId, sourceField, deadlineDate)` to prevent duplicate suggestions
- RLS policy `suggestions_all_member` using standard household-membership pattern
- **Commit:** 4a1c246

### Task 2: Generate migration
- Ran `npx drizzle-kit generate` producing `0005_sharp_leech.sql`
- Migration includes CREATE TABLE, ENABLE ROW LEVEL SECURITY, FK, index, unique constraint, and RLS policy

### Task 3: Apply migration
- Ran `npx drizzle-kit push` successfully against the database
- Changes applied without errors

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Migration generated and applied successfully
- Schema compiles without errors
- RLS policy follows existing household-membership pattern

## Self-Check: PASSED
