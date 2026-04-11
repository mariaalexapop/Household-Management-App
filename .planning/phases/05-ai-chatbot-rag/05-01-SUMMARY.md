---
phase: 05-ai-chatbot-rag
plan: 01
subsystem: database
tags: [drizzle, pgvector, rag, supabase, rls, schema]
requires:
  - households, documents, household_members (Phase 1)
  - drizzle-orm@^0.45.1 vector() + index() helpers
  - Supabase pgvector extension (enabled in this plan)
provides:
  - documentChunks table with vector(384) + HNSW cosine index
  - conversations table (household-scoped chat sessions)
  - messages table (role + content + tool_calls, household-denormalised)
  - documents.ready_for_rag boolean column
affects:
  - src/lib/db/schema.ts (extended — did not remove existing exports)
  - Supabase Postgres (pgvector extension now enabled)
tech-stack:
  added:
    - pgvector extension (version: extensions schema)
  patterns:
    - HNSW index using vector_cosine_ops for 384-dim embeddings
    - Household-denormalised messages table for single-key RLS matching
    - Cross-schema FK to auth.users(id) manually appended to migration SQL
key-files:
  created:
    - src/lib/db/migrations/0004_phase5_rag.sql
    - src/lib/db/migrations/meta/0004_snapshot.json
  modified:
    - src/lib/db/schema.ts
    - src/lib/db/migrations/meta/_journal.json
decisions:
  - Used idx 0004 (not 0005 as planned) — only 0000-0003 existed; sequential numbering required
  - Applied migration directly via postgres client (not drizzle-kit migrate) — DB has prior manual migrations not tracked in __drizzle_migrations, so drizzle-kit migrate was stuck retrying 0003
  - embedding dimensions = 384 (matches Xenova/bge-small-en-v1.5 used in Plan 02)
metrics:
  duration: ~15 minutes
  completed: 2026-04-11
  tasks: 2
  files_created: 2
  files_modified: 2
---

# Phase 5 Plan 01: RAG Database Foundation Summary

Added the database foundation for Phase 5 RAG and chatbot — pgvector extension, `document_chunks` with HNSW cosine index on 384-dim embeddings, household-scoped `conversations` and `messages` tables, and a `ready_for_rag` boolean on the existing `documents` table. All new tables have RLS enabled with the standard household-membership policy.

## What Was Built

### Task 1: Drizzle Schema Extensions (`src/lib/db/schema.ts`)

- Imported `vector` and `index` from `drizzle-orm/pg-core`
- Added `readyForRag: boolean('ready_for_rag').notNull().default(false)` to the existing `documents` table
- Added three new exported tables: `documentChunks`, `conversations`, `messages`
- `document_chunks.embedding` uses `vector('embedding', { dimensions: 384 })` with two indexes:
  - `document_chunks_embedding_idx` using `hnsw` on `t.embedding.op('vector_cosine_ops')`
  - `document_chunks_document_id_idx` on `document_id` (btree, for per-document cleanup/lookups)
- `messages.householdId` denormalised from `conversations.householdId` so the RLS policy can match the shared household-membership pattern without a join — matches existing codebase convention
- `conversations.createdBy` is a plain `uuid` column (cross-schema FK added in migration)
- All three new tables ship with a `pgPolicy('<name>_all_member', ...)` co-located in the table definition

### Task 2: Migration (`src/lib/db/migrations/0004_phase5_rag.sql`)

- Generated via `pnpm drizzle-kit generate` (initial name `0004_glamorous_rogue.sql`, renamed)
- **Prepended** `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;` — drizzle-kit does not emit extension DDL
- **Appended** cross-schema FK: `conversations.created_by` → `auth.users(id)` ON DELETE CASCADE (matches existing precedent in `0000_flaky_sage.sql`)
- Updated `meta/_journal.json` entry tag from `0004_glamorous_rogue` to `0004_phase5_rag`
- Applied directly to Supabase via `postgres` client (see deviation below)

## Verification Results

- `pnpm tsc --noEmit` — exits 0 (no type errors from `vector`, `index`, or new table definitions)
- `pnpm drizzle-kit check` — `Everything's fine`
- `grep` checks all pass: `CREATE EXTENSION IF NOT EXISTS vector`, `vector_cosine_ops`, `ready_for_rag` all present in migration SQL
- Direct DB verification (via `postgres` client):
  - `pg_extension` contains `vector` — ENABLED
  - `public.document_chunks`, `public.conversations`, `public.messages` — all present
  - `documents.ready_for_rag` column — present
  - Indexes `document_chunks_embedding_idx` (HNSW) and `document_chunks_document_id_idx` — present
  - RLS enabled on all three new tables (`relrowsecurity = true`)
  - All three `*_all_member` policies present in `pg_policies`
  - Vector cosine distance operator smoke test: `'[1,2,3]'::vector(3) <=> '[1,2,4]'::vector(3)` returned `0.00853986...` — pgvector operators fully functional

## Deviations from Plan

### [Rule 3 - Blocking Issue] Migration file named `0004_phase5_rag.sql` instead of `0005_phase5_rag.sql`

- **Found during:** Task 2, `drizzle-kit generate`
- **Issue:** Plan frontmatter and action steps reference `0005_phase5_rag.sql`, but the migrations directory only contained `0000_flaky_sage.sql` through `0003_chilly_silverclaw.sql`. drizzle-kit naturally assigns the next sequential index, which is `0004`, not `0005`. Sequential numbering is required by drizzle-kit — skipping `0004` would break future `drizzle-kit generate` runs.
- **Fix:** Renamed the generated `0004_glamorous_rogue.sql` to `0004_phase5_rag.sql` and updated the journal tag accordingly. The plan's intent (a single, clearly named Phase 5 RAG migration) is preserved.
- **Impact:** Downstream Phase 5 plans that reference the migration filename should use `0004_phase5_rag.sql`.
- **Commit:** `8e2b404`

### [Rule 3 - Blocking Issue] Migration applied via direct postgres client, not `drizzle-kit migrate`

- **Found during:** Task 2, `pnpm drizzle-kit migrate`
- **Issue:** `drizzle-kit migrate` stalled indefinitely. Investigation of `drizzle.__drizzle_migrations` showed only 3 migrations tracked (0000, 0001, 0002), but the DB schema contains all Phase 1-4 tables (including those created by `0003_chilly_silverclaw.sql`). The prior `0003` and `0002_unique_household_member.sql` migrations had been applied manually and never recorded in the drizzle migrations table. `drizzle-kit migrate` was trying to replay `0003_chilly_silverclaw.sql` first (which would fail with "relation already exists") and hanging.
- **Fix:** Wrote a small `apply_mig.mjs` script using the `postgres` client to split the 0004 SQL on `--> statement-breakpoint` and execute each of the 19 statements individually. All 19 statements succeeded. The script was deleted after use. This approach matches the existing project precedent of manually maintained migration application for edge cases.
- **Impact:** `drizzle.__drizzle_migrations` still reports only 3 tracked migrations, but the actual schema is fully up to date. Future plans that add migrations may also need to bypass `drizzle-kit migrate`. Recommend a cleanup plan later to reconcile the `__drizzle_migrations` table with the actual migration files.
- **Commit:** `8e2b404`

## Success Criteria Check

- [x] pgvector extension enabled on Supabase
- [x] `document_chunks` table exists with HNSW cosine index on `embedding`
- [x] `conversations` + `messages` tables exist with household-scoped RLS
- [x] `documents.ready_for_rag` column exists, default `false`
- [x] All Drizzle types exported from `schema.ts` and available for import in downstream plans (`documentChunks`, `conversations`, `messages`)

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `43f632f` | feat(05-01): add Phase 5 RAG tables to Drizzle schema |
| 2 | `8e2b404` | feat(05-01): add Phase 5 RAG migration (pgvector + 3 new tables) |

## Next Steps

- **Plan 02 (Inngest embedding pipeline):** Can now `INSERT INTO document_chunks` after generating 384-dim embeddings. Use `documentChunks` Drizzle export from `schema.ts`.
- **Plan 03 (Chat API):** Can now persist conversations + messages and perform cosine similarity search via `embedding <=> $query_vector`.
- **Plan 04 (Notifications):** Can now trigger off `documents.ready_for_rag = true`.

## Self-Check: PASSED

- `src/lib/db/migrations/0004_phase5_rag.sql` — FOUND
- `src/lib/db/migrations/meta/0004_snapshot.json` — FOUND
- `src/lib/db/schema.ts` — exports `documentChunks`, `conversations`, `messages` (FOUND)
- Commit `43f632f` — FOUND in git log
- Commit `8e2b404` — FOUND in git log
- pgvector extension on Supabase — VERIFIED via direct query
- HNSW cosine index — VERIFIED via `pg_indexes`
- All three RLS policies — VERIFIED via `pg_policies`
