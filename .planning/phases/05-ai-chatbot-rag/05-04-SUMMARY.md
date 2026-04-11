---
phase: 05-ai-chatbot-rag
plan: 04
subsystem: ai-chatbot-rag
tags: [inngest, rag, embeddings, pdf, notifications]
requires:
  - 05-01 (document_chunks + readyForRag schema)
  - 05-02 (embedBatch helper + gte-small Edge Function)
  - Phase 4 documents schema + Supabase Storage bucket
provides:
  - processDocument Inngest function (full ingestion pipeline)
  - documents/uploaded event emission from confirmUpload
  - document_ready in-app notification type rendered in dropdown
affects:
  - src/lib/inngest/functions/process-document.ts
  - src/app/api/inngest/route.ts
  - src/app/actions/documents.ts
  - src/components/notifications/NotificationDropdown.tsx
  - src/components/realtime/RealtimeProvider.tsx
tech_stack:
  added: []
  patterns:
    - dynamic-import-pdf-parse-worker-before-main
    - per-step-retry-isolation-in-inngest
    - admin-client-inside-inngest-to-bypass-rls
    - base64-pdf-payload-between-step.run-boundaries
key_files:
  created:
    - src/lib/inngest/functions/process-document.ts
  modified:
    - src/app/api/inngest/route.ts
    - src/app/actions/documents.ts
    - src/components/notifications/NotificationDropdown.tsx
    - src/components/realtime/RealtimeProvider.tsx
decisions:
  - Use pdf-parse v2 named `PDFParse` class (not `.default`) with `new PDFParse({ data }).getText()` after dynamic import
  - Pass PDF bytes between step.run boundaries as base64 (JSON-serialisable); Buffers are not
  - Every pipeline phase = its own step.run so embedding-batch failures don't re-download/re-parse
  - Widen NotificationItem.type union (with `(string & {})` fallback) instead of a brittle exhaustive enum
metrics:
  duration_minutes: ~12
  completed: 2026-04-11
requirements: [AI-03, INS-07, INS-08, ELEC-05]
---

# Phase 5 Plan 04: Document Processing Pipeline Summary

Asynchronous RAG ingestion: upload triggers an Inngest fan-out that downloads the PDF, extracts text with pdf-parse v2, chunks at 1000/200 overlap, embeds each batch via the gte-small Edge Function, inserts into `document_chunks`, marks the document `ready_for_rag=true`, and fires a `document_ready` notification — all inside isolated step.run() blocks for per-phase retry.

## What was built

### Task 1 — `processDocument` Inngest function + registration
- **File:** `src/lib/inngest/functions/process-document.ts` (new, ~180 LOC)
- **Trigger:** `documents/uploaded` (via `triggers: [{ event }]` — matches project pattern in `generate-recurrence.ts` and `send-warranty-reminder.ts`, not the bare `{ event }` form in the plan example)
- **Config:** `retries: 3`, `concurrency: { limit: 5 }`
- **Pipeline steps (each a separate `step.run`):**
  1. `download-pdf` — `createAdminClient().storage.from('documents').download(storagePath)`; returns PDF as base64 string (Buffers are not JSON-serialisable across step boundaries)
  2. `extract-text` — dynamic `await import('pdf-parse/worker')` (side-effect, must be first) then `await import('pdf-parse')` to get the named `PDFParse` class; `new PDFParse({ data }).getText()`; `destroy()` in a `finally`
  3. `chunk-text` — sliding-window char chunker, collapses whitespace, 1000 chars / 200 overlap
  4. `embed-batch-${i}` — one step per 32-chunk batch; admin Supabase client → `embedBatch` → `db.insert(documentChunks)` with contiguous `chunkIndex` offsets
  5. `mark-ready-and-notify` — `documents.readyForRag = true` + `notifications` insert with `type: 'document_ready'`
- **Empty-text fallback:** `mark-empty-doc-ready` branch for scanned/image-only PDFs — still marks ready and notifies so the user isn't left watching a spinner
- **Registration:** added `import { processDocument }` to `src/app/api/inngest/route.ts` and appended to the `functions: [...]` array passed to `serve()`

### Task 2 — Emit event + render notification
- **`src/app/actions/documents.ts`:** added `import { inngest } from '@/lib/inngest/client'` and, inside `confirmUpload`, a `try/catch`-wrapped `inngest.send({ name: 'documents/uploaded', data: { documentId, householdId, storagePath, uploadedBy } })` after the DB insert and before `revalidatePath`. On bus failure we log and still return `success: true` — the document row exists, reprocessing can be triggered out-of-band.
- **`src/components/notifications/NotificationDropdown.tsx`:** introduced a `getNotificationMeta(type)` helper returning `{ label, Icon, iconClass }` for each supported notification type. `document_ready` uses `Sparkles` from lucide-react with the primary colour. Row layout now renders an icon column + display-font label above the message body without breaking existing `task_reminder` / `warranty_reminder` etc. types.
- **`src/components/realtime/RealtimeProvider.tsx`:** widened `NotificationItem.type` from `'task_assigned' | 'task_reminder'` to cover all in-app notification types currently inserted by Inngest jobs (`warranty_reminder`, `insurance_expiry_reminder`, `insurance_payment_reminder`, `activity_reminder`, `car_reminder`, `document_ready`) plus a `(string & {})` fallback so new types can be added without a schema-wide type bump.

## Verification

- `rtk pnpm tsc --noEmit` — zero errors in any file touched by this plan
- `grep -c "step.run" src/lib/inngest/functions/process-document.ts` → 6 (>= 5 required)
- `grep -q "processDocument" src/app/api/inngest/route.ts` → yes (import + functions array)
- `grep -q "documents/uploaded" src/app/actions/documents.ts` → yes
- `grep -q "document_ready" src/components/notifications/NotificationDropdown.tsx` → yes

The only remaining tsc error in the repo is `src/app/api/chat/route.ts(110,5)` — a pre-existing bug in Plan 05-05 territory (untracked file, `Promise<ModelMessage[]>` not awaited). Out of scope here; logged to `deferred-items.md`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] pdf-parse v2 API shape**
- **Found during:** Task 1, first tsc run
- **Issue:** Plan example used `(await import('pdf-parse')).default` and `pdfParse(buffer)`. pdf-parse@2.4.5's ESM entry exports a named `PDFParse` class, no default export.
- **Fix:** `const { PDFParse } = await import('pdf-parse')` then `new PDFParse({ data: buffer }).getText()` with `destroy()` in `finally`
- **Files modified:** `src/lib/inngest/functions/process-document.ts`
- **Commit:** d6b6161

**2. [Rule 1 — Bug] Inngest `createFunction` handler signature**
- **Found during:** Task 1, first tsc run
- **Issue:** Plan example passed the event trigger as the second argument to `createFunction({cfg}, {event}, handler)`. This project's inngest version uses `createFunction({cfg with triggers: [...]}, handler)` — same pattern as `generate-recurrence.ts` and `send-warranty-reminder.ts`. The 3-arg form does not exist, producing `TS2554`.
- **Fix:** Moved trigger into `triggers: [{ event: 'documents/uploaded' }]` inside the config object; handler is now the single second argument. Added explicit handler type annotation `{ event: { data: {...} }; step: any }` matching the project's convention.
- **Files modified:** `src/lib/inngest/functions/process-document.ts`
- **Commit:** d6b6161

**3. [Rule 1 — Bug] `chunks` typed as `unknown[]` through step.run boundary**
- **Found during:** Task 1, first tsc run
- **Issue:** `step.run(...)` returns inferred `unknown` without explicit generics in this inngest version, which propagated into `documentChunks` insert values and blew up Drizzle's overload resolution (`content: unknown`).
- **Fix:** Annotated the three step.run outputs explicitly: `const pdfBase64: string`, `const fullText: string`, `const chunks: string[]`. Chunker body is synchronous but wrapped in an `async` fn to satisfy step.run's Promise return shape.
- **Files modified:** `src/lib/inngest/functions/process-document.ts`
- **Commit:** d6b6161

**4. [Rule 2 — Missing critical functionality] `NotificationItem.type` too narrow**
- **Found during:** Task 2, NotificationDropdown edit
- **Issue:** `NotificationItem.type` was still the Phase 2 initial union `'task_assigned' | 'task_reminder'`, but Inngest functions have been inserting `warranty_reminder`, `insurance_*_reminder`, `activity_reminder`, `car_reminder` rows for several plans already. Adding only `'document_ready'` would have required touching a type file anyway, so the correct fix is one widening pass that covers everything already inserted in the codebase.
- **Fix:** Widened the union and added a `(string & {})` escape hatch for forward-compatibility.
- **Files modified:** `src/components/realtime/RealtimeProvider.tsx`
- **Commit:** 12388f9

### Authentication gates
None.

## Deferred Issues
- `src/app/api/chat/route.ts(110)` TS2740 — pre-existing, Plan 05-05 territory. Logged in `.planning/phases/05-ai-chatbot-rag/deferred-items.md`.

## Commits
- **d6b6161** — `feat(05-04): add processDocument Inngest pipeline and register it` (Task 1)
- **12388f9** — `feat(05-04): emit documents/uploaded + render document_ready notifications` (Task 2)

Both pushed to `origin/main`.

## Self-Check: PASSED

Verified files exist:
- FOUND: src/lib/inngest/functions/process-document.ts
- FOUND: src/app/api/inngest/route.ts (processDocument registered)
- FOUND: src/app/actions/documents.ts (documents/uploaded emitted)
- FOUND: src/components/notifications/NotificationDropdown.tsx (document_ready branch)
- FOUND: src/components/realtime/RealtimeProvider.tsx (widened type)

Verified commits exist:
- FOUND: d6b6161
- FOUND: 12388f9
