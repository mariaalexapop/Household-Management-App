---
phase: 05-ai-chatbot-rag
plan: 02
subsystem: ai-rag
tags: [ai, embeddings, rag, supabase-edge-functions, drizzle, pgvector]
requires:
  - 05-01 (document_chunks table with vector(384) + HNSW index)
provides:
  - embed Edge Function (gte-small, 384 dims)
  - embedText / embedBatch helpers
  - retrieveTopChunks (HNSW-backed cosine search)
affects:
  - next.config.ts (serverExternalPackages)
  - package.json (ai@6, @ai-sdk/anthropic@3, @ai-sdk/react@3, pdf-parse@2)
tech-stack:
  added:
    - ai@6.0.158
    - "@ai-sdk/anthropic@3.0.69"
    - "@ai-sdk/react@3.0.160"
    - pdf-parse@2.4.5
  patterns:
    - Supabase Edge Function wrapping Supabase.ai.Session for embeddings
    - Optional SupabaseClient injection so Inngest can pass admin client
    - Drizzle cosineDistance() with asc() ORDER BY for HNSW index use
key-files:
  created:
    - supabase/functions/embed/index.ts
    - src/lib/ai/embed.ts
    - src/lib/ai/rag.ts
  modified:
    - next.config.ts
    - package.json
    - pnpm-lock.yaml
decisions:
  - "Raw cosineDistance ASC in ORDER BY (not 1 - distance DESC) so the HNSW vector_cosine_ops index is used at query time"
  - "Sanitize inputs (collapse whitespace, cap at 8000 chars) in embed.ts so indexing and retrieval use identical preprocessing — avoids 'embedding mismatch' pitfall"
  - "Both embedText and embedBatch accept an optional SupabaseClient so Inngest jobs (Plan 05-04) can pass the admin client and bypass cookies/RLS"
  - "Edge Function deployment deferred: Supabase CLI not authenticated on this machine; function file is committed and ready to deploy via `pnpm dlx supabase functions deploy embed --no-verify-jwt` once SUPABASE_ACCESS_TOKEN is provided"
metrics:
  duration: "~6 minutes"
  completed: "2026-04-11"
  tasks: "2/2"
---

# Phase 5 Plan 02: Embeddings + RAG Primitives Summary

Installed AI SDK v6 + pdf-parse, wired `pdf-parse`/`pdfjs-dist` into `serverExternalPackages`, created the Supabase `embed` Edge Function, and shipped the two helper modules (`embedText`/`embedBatch` and `retrieveTopChunks`) that every downstream Phase 5 plan imports.

## What Was Built

### Dependencies
- `ai@6.0.158`, `@ai-sdk/anthropic@3.0.69`, `@ai-sdk/react@3.0.160`, `pdf-parse@2.4.5`
- All four versions are what the Vercel AI SDK v6 + Anthropic provider pipeline expects for Plan 05-05's chat route and Plan 05-04's indexing job.

### `next.config.ts`
Added:
```ts
serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
```
Without this Next.js tries to bundle `pdf-parse`'s worker and canvas resolution, which breaks in the Vercel serverless runtime (Pitfall 1 in the Phase 5 research). These packages must remain external so their node-only deps are resolved at runtime.

### `supabase/functions/embed/index.ts`
Deno Edge Function that wraps `Supabase.ai.Session('gte-small')`:
- Accepts `{ input: string }` → returns `{ embedding: number[] }` (384 dims)
- Accepts `{ input: string[] }` → returns `{ embeddings: number[][] }` (batch)
- Uses `mean_pool: true, normalize: true` so embeddings are unit-length and directly usable with cosine similarity

The function is intended to be deployed with `--no-verify-jwt` because it's only called from server-side code (route handlers + Inngest steps) via the Supabase client — never from the browser.

### `src/lib/ai/embed.ts`
```ts
export async function embedText(text: string, client?: SupabaseClient): Promise<number[]>
export async function embedBatch(texts: string[], client?: SupabaseClient): Promise<number[][]>
```
- Sanitizes inputs: collapses whitespace and caps at 8000 chars so indexing and retrieval use identical preprocessing. Avoids the "embedding mismatch" pitfall from research.
- Accepts an optional `SupabaseClient` — when omitted uses the request-scoped server client (`@/lib/supabase/server`). Inngest jobs in Plan 05-04 will pass the admin client (`createAdminClient()`) to bypass cookies/RLS.
- Throws with a descriptive message on Edge Function error or when no embedding is returned.

### `src/lib/ai/rag.ts`
```ts
export interface RetrievedChunk {
  id: string; content: string; documentId: string; distance: number
}
export async function retrieveTopChunks(args: {
  householdId: string; query: string; k: number; documentId?: string
}): Promise<RetrievedChunk[]>
```
- Embeds the query via `embedText`, then runs a Drizzle `cosineDistance(documentChunks.embedding, queryEmbedding)` nearest-neighbour search.
- **ORDER BY uses the raw `cosineDistance` expression in `asc()`** — this is the form Postgres matches against the HNSW `vector_cosine_ops` index. Using `1 - distance DESC` would disable the index and force a sequential scan (Pitfall 2).
- Supports an optional `documentId` filter so the chatbot can ground a follow-up question in a specific document.
- `distance` is exposed on a typed `sql<number>` wrapper because Drizzle types the `cosineDistance` expression as `unknown` in the SELECT column.

## Verification

- `pnpm exec tsc --noEmit` passes with zero errors.
- `grep -q "pdf-parse" next.config.ts` passes.
- `grep -q "gte-small" supabase/functions/embed/index.ts` passes.
- `grep -n "cosineDistance" src/lib/ai/rag.ts` shows usage in both the SELECT distance expression and the ORDER BY (via `distanceExpr`).
- `grep -n "serverExternalPackages" next.config.ts` confirms both `pdf-parse` and `pdfjs-dist` present.

Edge Function smoke test was **not** run: Supabase CLI is available via `pnpm dlx` (version 2.89.1) but `SUPABASE_ACCESS_TOKEN` / `supabase login` is not configured on this machine. The function file is committed and ready to deploy via:
```bash
pnpm dlx supabase functions deploy embed --no-verify-jwt
```
This should be run before executing Plan 05-04 (indexing) or Plan 05-05 (chat route) end-to-end.

## Deviations from Plan

**None affecting Rules 1–4.** Two minor adjustments made while implementing:

1. **[Rule 1 — Bug] Drizzle `cosineDistance` return type is `unknown`**
   - **Found during:** Task 2 (`tsc --noEmit`)
   - **Issue:** `.select({ distance: cosineDistance(...) })` produced `distance: unknown`, which doesn't satisfy the `RetrievedChunk.distance: number` contract.
   - **Fix:** Keep the raw `cosineDistance(...)` expression for `orderBy(asc(distanceExpr))` (HNSW-critical), and wrap it in `sql<number>\`${distanceExpr}\`` for the SELECT column. The SQL emitted is identical; only the TypeScript return type is tightened.
   - **Files modified:** `src/lib/ai/rag.ts`
   - **Commit:** `1764400`

2. **Edge Function deployment deferred (not a Rule 4 architectural change — a pre-existing environment gap)**
   - Supabase CLI not authenticated on this machine. Per the user's explicit fallback rule and the plan's "If CLI not authenticated" note, the function file was created and committed; deployment is to be run once `SUPABASE_ACCESS_TOKEN` is configured. Documented in the verification section and in the `decisions` frontmatter.

## Authentication Gates

None blocked during Task execution. The Supabase CLI auth gap is documented above and does not block Plans 05-03 (chat tools) or any non-RAG Phase 5 work, because `embedText` / `embedBatch` / `retrieveTopChunks` compile and type-check against the deployed Edge Function interface.

## Commits

| # | Hash      | Message                                                                  |
|---|-----------|--------------------------------------------------------------------------|
| 1 | `8f410f8` | feat(05-02): install AI SDK + configure serverExternalPackages + add embed Edge Function |
| 2 | `1764400` | feat(05-02): add embedText/embedBatch + retrieveTopChunks helpers        |

Both commits pushed to `origin/main`.

## Next Steps

- Plan 05-03: Chat tools layer (household_context, list_tasks, list_activities, etc.).
- Plan 05-04: Inngest indexing pipeline — will call `embedBatch(chunks, adminClient)` and insert into `document_chunks`.
- Plan 05-05: `/api/chat` route — will call `retrieveTopChunks` and stream Claude responses via `streamText` + `@ai-sdk/anthropic`.
- Before running Plan 05-04/05 end-to-end: `pnpm dlx supabase functions deploy embed --no-verify-jwt`.

## Self-Check: PASSED

- FOUND: `next.config.ts` (modified with `serverExternalPackages`)
- FOUND: `supabase/functions/embed/index.ts`
- FOUND: `src/lib/ai/embed.ts`
- FOUND: `src/lib/ai/rag.ts`
- FOUND commit: `8f410f8`
- FOUND commit: `1764400`
- `pnpm exec tsc --noEmit` exit code 0
