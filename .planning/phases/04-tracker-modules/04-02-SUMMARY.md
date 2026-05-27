---
phase: 04-tracker-modules
plan: 02
subsystem: document-actions-shared-components
tags: [server-actions, supabase-storage, upload, components, cost-format]
dependency_graph:
  requires: [04-01]
  provides: [getUploadUrl, confirmUpload, getDownloadUrl, deleteDocument, FileUploadZone, DocumentList, ReminderConfig, formatCostFromCents, centsToPounds, poundsToCents]
  affects: [04-03, 04-04, 04-05, 04-06, 04-07, 04-08, 04-09]
tech_stack:
  added: []
  patterns: [signed-url-upload, drag-and-drop-file-zone, cost-cents-formatting]
key_files:
  created:
    - src/app/actions/documents.ts
    - src/lib/format.ts
    - src/components/tracker/FileUploadZone.tsx
    - src/components/tracker/DocumentList.tsx
    - src/components/tracker/ReminderConfig.tsx
  modified: []
decisions:
  - "Redefine ActionResult and getMemberRow locally in documents.ts (same pattern as kids.ts, avoids cross-action coupling)"
  - "FileUploadZone uses browser Supabase client for direct-to-storage upload via signed URL"
metrics:
  duration_seconds: 155
  completed: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 0
requirements: [INS-02, ELEC-02, ELEC-04, COST-01]
---

# Phase 4 Plan 02: Shared Document Actions and Tracker Components Summary

Signed-URL document upload server actions (getUploadUrl, confirmUpload, getDownloadUrl, deleteDocument), drag-and-drop FileUploadZone, DocumentList with download/delete, ReminderConfig days-before picker, and GBP cost formatting utilities for integer cents.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Document server actions and cost format utility | 9cb3279 | src/app/actions/documents.ts, src/lib/format.ts |
| 2 | Shared tracker UI components | ca9d723 | src/components/tracker/FileUploadZone.tsx, DocumentList.tsx, ReminderConfig.tsx |

## What Was Built

### Document Server Actions (src/app/actions/documents.ts)
Four server actions following the kids.ts pattern (auth check, getMemberRow, Zod validation):
- **getUploadUrl** -- validates module/entityId/fileName/fileSizeBytes, creates signed upload URL with storage path convention `{householdId}/{module}/{entityId}/{fileName}`
- **confirmUpload** -- inserts document row in DB after client-side upload completes, revalidates module path
- **getDownloadUrl** -- looks up document, verifies household membership, creates 1-hour signed download URL
- **deleteDocument** -- deletes from both Supabase Storage and DB, verifies household membership

### Cost Format Utility (src/lib/format.ts)
- **formatCostFromCents** -- converts integer cents to GBP display string (e.g., 1500 -> "15.00 GBP"), returns '--' for null
- **centsToPounds** -- cents to pounds number conversion
- **poundsToCents** -- pounds to cents with Math.round for safe integer conversion

### FileUploadZone Component
Drag-and-drop PDF upload zone with:
- HTML5 native drag events + hidden file input
- PDF-only validation (application/pdf MIME type)
- 10 MB max file size validation
- Three-step upload flow: getUploadUrl -> browser upload via Supabase client -> confirmUpload
- Loading spinner during upload, error toasts via sonner
- Miro design: dashed border, rounded-xl, kinship surface tokens

### DocumentList Component
Document row list with download and delete actions:
- FileText icon, file name, document type badge, formatted date
- Download: calls getDownloadUrl, opens in new tab
- Delete: calls deleteDocument, shows success toast, calls onDelete callback
- Empty state text when no documents
- Miro design: ring-miro rounded-xl cards, font-body text

### ReminderConfig Component
Labeled select dropdown for reminder days-before:
- Options: 7, 14, 30, 60, 90 days
- Controlled component with value/onChange props
- Miro design: rounded-lg border, kinship tokens, font-body

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation: PASSED (tsc --noEmit clean)
- All 4 server actions export from documents.ts: CONFIRMED
- All 3 components export from their files: CONFIRMED
- Cost format utility exports from format.ts: CONFIRMED

## Self-Check: PASSED

- src/app/actions/documents.ts: FOUND
- src/lib/format.ts: FOUND
- src/components/tracker/FileUploadZone.tsx: FOUND
- src/components/tracker/DocumentList.tsx: FOUND
- src/components/tracker/ReminderConfig.tsx: FOUND
- Commit 9cb3279: FOUND
- Commit ca9d723: FOUND
