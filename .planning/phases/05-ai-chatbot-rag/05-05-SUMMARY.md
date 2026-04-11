---
phase: 05-ai-chatbot-rag
plan: 05
subsystem: ai-chat
tags: [ai-sdk-v6, anthropic, claude-sonnet-4-6, rag, streaming, tools, route-handler]
one_liner: "POST /api/chat streams Claude Sonnet 4.6 via AI SDK v6 with RAG-injected system prompt, five live-data tools + client-facing extract_procedure, and message persistence."
requires:
  - 05-01
  - 05-02
  - 05-03
provides:
  - "POST /api/chat endpoint speaking the AI SDK UIMessage streaming protocol"
  - "buildSystemPrompt({ householdId, chunks }) helper"
  - "buildTools({ householdId, userId }) tool-map factory"
affects:
  - src/lib/ai/system-prompt.ts
  - src/lib/ai/tools.ts
  - src/app/api/chat/route.ts
  - .env.example
tech-stack:
  added:
    - "@ai-sdk/anthropic (already installed, first real usage)"
  patterns:
    - "AI SDK v6 tool() + zod inputSchema with execute()"
    - "Client-facing tool (no execute) surfacing via UIMessage tool part"
    - "streamText → toUIMessageStreamResponse for useChat-compatible streaming"
    - "RAG chunks injected into request-scoped system prompt"
key-files:
  created:
    - src/lib/ai/system-prompt.ts
    - src/lib/ai/tools.ts
    - src/app/api/chat/route.ts
  modified:
    - .env.example
decisions:
  - "Aggregate text + toolCalls across all steps (not just the last) so assistant replies emitted around tool calls are fully persisted."
  - "Persist user message BEFORE streamText so a mid-stream crash never loses the turn."
  - "Updated .env.example (the real file) instead of creating .env.local.example — project already standardises on .env.example."
metrics:
  duration-minutes: ~20
  tasks-completed: 2
  tasks-total: 2
  files-created: 3
  files-modified: 1
  commits: 2
  completed: 2026-04-11
requirements:
  - AI-01
  - AI-02
  - AI-04
  - AI-05
  - AI-07
  - INS-07
  - INS-08
  - ELEC-05
---

# Phase 5 Plan 05: AI Chat Route Handler + Tools + System Prompt — Summary

## One-liner

`POST /api/chat` streams Claude Sonnet 4.6 responses via AI SDK v6
(`streamText → toUIMessageStreamResponse`), injecting retrieved document
chunks into the system prompt and exposing five server-side live-data tools
plus a client-facing `extract_procedure` tool.

## What was built

### Task 1 — System prompt + tools (`1fb2245`)

`src/lib/ai/system-prompt.ts`
- `buildSystemPrompt({ householdId, chunks })` returns a household-aware
  assistant instruction string with retrieved RAG chunks rendered as
  `[[chunk N doc=<id>]]` blocks (or a no-results fallback).
- Rules baked in: never fabricate data, keep responses short, always end
  with a text summary (so the client can finalise the stream), only call
  `extract_procedure` when the user explicitly asks to turn guidance into
  tasks.

`src/lib/ai/tools.ts`
- `buildTools({ householdId, userId })` returns the six-tool map consumed
  by `streamText`. Each tool uses `ai.tool()` + a zod `inputSchema`.
- **Server tools (five)** — all filter by `householdId` and serialise every
  `Date` field to an ISO string before returning (Pitfall 7 in the Phase 5
  research notes):
  - `get_upcoming_chores(limit=5)` → `tasks` rows where `starts_at >= now`
    ordered ascending.
  - `get_upcoming_activities(limit=5)` → `kid_activities` rows ordered by
    `starts_at`.
  - `get_warranty_expiries(withinDays=90)` → `electronics` rows with
    `warranty_expiry_date <= now + withinDays`.
  - `get_insurance_expiries(withinDays=90)` → `insurance_policies` rows
    with `expiry_date <= now + withinDays`.
  - `get_car_reminders(withinDays=30)` → `cars` rows with any of
    `mot_due_date`/`tax_due_date`/`next_service_date` inside the window
    (filtered in JS because Drizzle can't easily OR on nullable columns).
- **Client-facing tool** — `extract_procedure` takes `{ title, steps[] }`
  and deliberately has **no `execute` function**, so the AI SDK surfaces
  the tool call as a UIMessage tool part that the client can render as a
  preview modal.

### Task 2 — Route handler + env docs (`26e8fad`)

`src/app/api/chat/route.ts`
- `export const maxDuration = 60` (Vercel serverless cap).
- Parses `{ messages: UIMessage[], conversationId, documentId? }` from the
  JSON body; returns 400 on bad shape.
- Supabase auth → 401 if unsigned; resolves `householdId` from
  `household_members` → 403 if the user has no household.
- Extracts the last user text from `messages[i].parts` (typed, no cast
  gymnastics), runs `retrieveTopChunks({ k: 5, documentId? })`, and calls
  `saveUserMessage` **before** streaming (so the user turn survives a
  mid-stream crash).
- Calls `streamText({ model: anthropic('claude-sonnet-4-6'), system,
  messages: convertToModelMessages(messages.slice(-20)), tools, stopWhen:
  stepCountIs(5) })`. The `convertToModelMessages` call is `await`ed
  because in AI SDK v6 it returns `Promise<ModelMessage[]>` (fixed below).
- `onFinish` aggregates text **and** toolCalls across all `event.steps`
  (not just the final step) so assistant replies that emit text around
  tool calls are fully persisted. Falls back to `event.text` if the
  aggregation is empty.
- Returns `result.toUIMessageStreamResponse()` — the protocol
  `useChat` + `DefaultChatTransport` expect on the client side.

`.env.example`
- Appended `ANTHROPIC_API_KEY=` with a comment noting it is used by
  `/api/chat`. The plan specified `.env.local.example`, but the project
  already standardises on `.env.example`, so I updated the real file
  rather than creating a parallel one — see Deviations below.

## Verification

| Check                                                      | Result                                  |
| ---------------------------------------------------------- | --------------------------------------- |
| `rtk pnpm tsc --noEmit`                                    | PASS — exit 0, no errors                |
| `grep -c "toUIMessageStreamResponse" src/app/api/chat/route.ts` | 2 (import + call site)             |
| `grep -c "claude-sonnet-4-6" src/app/api/chat/route.ts`    | 1                                       |
| `grep execute src/lib/ai/tools.ts`                         | 5 execute functions, 0 on `extract_procedure` |
| Files compile cleanly                                      | Yes                                     |

## Deviations from Plan

### [Rule 1 — Bug] Missing `await` on `convertToModelMessages`

- **Found during:** Task 2 verification (first `tsc --noEmit` run)
- **Issue:** The plan snippet used `messages: convertToModelMessages(...)`
  directly, but AI SDK v6 types this helper as
  `Promise<ModelMessage[]>`. TypeScript flagged it:
  `Type 'Promise<ModelMessage[]>' is missing properties from 'ModelMessage[]'`.
- **Fix:** Extracted to a local `const modelMessages = await
  convertToModelMessages(history)` and passed that into `streamText`.
- **Files modified:** `src/app/api/chat/route.ts`
- **Commit:** `26e8fad` (included in the Task 2 commit, not a separate fix)

### [Rule 3 — Blocking / Docs-mismatch] `.env.local.example` vs `.env.example`

- **Found during:** Task 2
- **Issue:** The plan says "append to `.env.local.example` (create if
  missing)". The project already has a `.env.example` tracked in git and
  no `.env.local.example`. Creating a new parallel file would fragment
  env-var documentation.
- **Fix:** Updated `.env.example` (the existing tracked file) with the
  `ANTHROPIC_API_KEY` entry.
- **Files modified:** `.env.example`
- **Commit:** `26e8fad`

## Auth gates / human action needed

None encountered during execution. The user will need to set
`ANTHROPIC_API_KEY` in `.env.local` before end-to-end smoke testing the
chat endpoint, but this does not block Plan 05-05 completion (it is
handled by the UI plan 05-06 or a manual verification pass later).

## Deferred issues (out of scope)

Pre-existing TypeScript errors in
`src/lib/inngest/functions/process-document.ts` were surfaced by the
first `tsc --noEmit` run but are **out of scope** for this plan — they
belong to Plan 05-02/05-04 (Inngest document processing). Logged to
`.planning/phases/05-ai-chatbot-rag/deferred-items.md`. Per the file's
own notes, these were subsequently resolved as part of Plan 05-04, and
the final `tsc --noEmit` run used to verify this plan came back clean
(exit 0).

## Commits

| Hash      | Message                                                           |
| --------- | ----------------------------------------------------------------- |
| `1fb2245` | feat(05-05): add buildSystemPrompt and buildTools for AI chat     |
| `26e8fad` | feat(05-05): add POST /api/chat route with streaming + RAG + persistence |

Both pushed to `origin/main`.

## Success criteria

- [x] `/api/chat` streams Claude Sonnet 4.6 responses using UIMessage protocol
- [x] RAG retrieves k=5 chunks per call and injects them into the system prompt
- [x] All five live-data tools are callable and return ISO-string dates
- [x] `extract_procedure` surfaces to the client (no server execute)
- [x] User + assistant messages are persisted via server actions
- [x] `ANTHROPIC_API_KEY` documented in `.env.example`
- [x] `tsc --noEmit` passes

## Self-Check: PASSED

- FOUND: src/lib/ai/system-prompt.ts
- FOUND: src/lib/ai/tools.ts
- FOUND: src/app/api/chat/route.ts
- FOUND: .env.example (ANTHROPIC_API_KEY added)
- FOUND: commit 1fb2245
- FOUND: commit 26e8fad
- tsc --noEmit: PASS (exit 0)
