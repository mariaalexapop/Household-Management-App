---
phase: 04-tracker-modules
plan: 01
subsystem: database-schema
tags: [drizzle, schema, migration, rls, storage]
dependency_graph:
  requires: []
  provides: [cars, serviceRecords, insurancePolicies, electronics, documents]
  affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07, 04-08, 04-09]
tech_stack:
  added: []
  patterns: [polymorphic-documents-table, integer-cents-for-costs, storage-bucket-rls]
key_files:
  created:
    - src/lib/db/migrations/0003_chilly_silverclaw.sql
    - src/lib/db/migrations/meta/0003_snapshot.json
    - drizzle/migrations/phase4_tracker_tables.sql
  modified:
    - src/lib/db/schema.ts
decisions:
  - "Polymorphic documents table with module + entityId columns (not per-module document tables)"
  - "Storage bucket RLS uses folder path convention: {householdId}/... for file scoping"
  - "Cost fields use integer cents (costCents, premiumCents) per COST-01 requirement"
metrics:
  duration_seconds: 129
  completed: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
requirements: [CAR-01, CAR-02, CAR-03, INS-01, INS-02, INS-03, ELEC-01, ELEC-02, COST-01]
---

# Phase 4 Plan 01: Tracker Module Schema and Migration Summary

Drizzle schema with 5 new tables (cars, service_records, insurance_policies, electronics, documents) plus Supabase Storage bucket for PDF uploads -- all with RLS policies restricting access to household members.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add 5 tracker tables to schema.ts | df6a84d | src/lib/db/schema.ts |
| 2 | Generate and apply migration with Storage bucket | 753dfca | src/lib/db/migrations/0003_chilly_silverclaw.sql, drizzle/migrations/phase4_tracker_tables.sql |

## What Was Built

### Cars Table
Vehicle tracking with make, model, year, plate, colour. Includes MOT due date, tax due date, and next service date with configurable reminder day offsets (30/30/14 defaults).

### Service Records Table
Service history linked to cars via FK. Tracks service date, type (full_service/mot/repair/tyre/other), mileage, garage, and cost in integer cents.

### Insurance Policies Table
Policy tracking with type (home/car/health/life/travel/other), insurer, policy number, expiry date. Payment schedule (annual/quarterly/monthly) with premium in integer cents. Configurable expiry (30 days) and payment (7 days) reminder offsets.

### Electronics Table
Device inventory with name, brand, model number, purchase date, cost in cents, warranty expiry date, and free-text coverage summary.

### Documents Table (Polymorphic)
Shared PDF upload references. Module field ('insurance' | 'electronics') plus entityId point to the parent record. Stores fileName, storagePath (Supabase Storage path), and fileSizeBytes.

### Supabase Storage Bucket
Private 'documents' bucket with 10MB file size limit and PDF-only MIME restriction. RLS policy scopes access by household folder path.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation: PASSED (tsc --noEmit clean)
- All 5 table exports present in schema.ts: CONFIRMED
- drizzle-kit push to Supabase: PASSED (changes applied)
- Migration file generated and committed: CONFIRMED

## Self-Check: PASSED

- All 4 expected files exist on disk
- All 3 commits (df6a84d, 753dfca, 5a5094e) verified in git log
- All 5 table exports confirmed in schema.ts
