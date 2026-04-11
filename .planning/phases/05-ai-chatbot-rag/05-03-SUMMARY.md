---
phase: 05-ai-chatbot-rag
plan: 03
subsystem: ai-chatbot
tags: [server-actions, chat, conversations, messages, rls, auth]
requires:
  - 05-01 (conversations + messages tables)
provides:
  - createConversation server action
  - listConversations server action
  - loadHistory server action
  - saveUserMessage server action
  - saveAssistantMessage server action
  - deleteConversation server action
affects:
  - Future chat API route (05-05) — will call saveUserMessage + saveAssistantMessage
  - Future chatbot UI panel — will call list/create/load/delete
tech-stack:
  added: []
  patterns:
    - Zod-validated server actions
    - Supabase auth + household membership gate
    - Drizzle ORM household-scoped queries
    - ActionResult<T> shape
key-files:
  created:
    - src/app/actions/chat.ts
  modified: []
decisions:
  - Denormalised householdId on every message insert (from memberRow, never caller) so RLS and queries match the shared household-membership pattern without joins
  - Skipped revalidatePath — chat panel owns its own refresh lifecycle
  - deleteConversation relies on FK cascade (conversations → messages) rather than explicit DELETE
  - saveUserMessage / saveAssistantMessage bump conversations.updatedAt so list ordering reflects last activity
metrics:
  duration: ~3 minutes
  tasks: 1
  files: 1
  commits: 1
  completed: 2026-04-11
requirements:
  - AI-07
---

# Phase 5 Plan 03: Chat Server Actions Summary

One-liner: Household-scoped server actions (create/list/load/save user/save assistant/delete) for persisting AI chatbot conversations and messages, reusing the Supabase-auth + Zod + household-membership pattern established in Phase 1–3.

## What Was Built

`src/app/actions/chat.ts` (309 lines) exposing six server actions backed by the `conversations` and `messages` tables introduced in Plan 05-01:

| Action | Input | Returns | Notes |
| --- | --- | --- | --- |
| `createConversation` | `{ title? }` | `{ id }` | `createdBy = user.id`, `householdId` from memberRow |
| `listConversations` | `()` | `ConversationSummary[]` (≤50) | Ordered by `updatedAt DESC` |
| `loadHistory` | `{ conversationId }` | `MessageRow[]` | Ordered by `createdAt ASC`, guarded by AND(id, householdId) |
| `saveUserMessage` | `{ conversationId, content }` | `{ id }` | Inserts `role:'user'`, bumps conversation `updatedAt` |
| `saveAssistantMessage` | `{ conversationId, content, toolCalls? }` | `{ id }` | Inserts `role:'assistant'`, serialises `toolCalls` into JSONB, bumps `updatedAt` |
| `deleteConversation` | `{ conversationId }` | `void` | FK cascade removes child messages |

### Defence-in-depth

1. **Auth check** — `supabase.auth.getUser()` on every action, returns `Not authenticated` on failure
2. **Household membership** — `getMemberRow(user.id)` on every action, returns `No household found` on null
3. **Household scoping** — `householdId` is always taken from `memberRow.householdId`, never from caller input
4. **Conversation ownership** — `assertConversationInHousehold` helper guards every mutation / read on a specific conversation
5. **Zod validation** — all four mutating actions use dedicated schemas (title length, uuid, content size limits)
6. **RLS policies** — `conversations` and `messages` tables both carry `*_all_member` policies (see `schema.ts`) so even a bypass of the service-layer checks would still be blocked at the DB level

### Shared helpers

- `getMemberRow(userId)` — mirrors the exact pattern from `kids.ts` / `documents.ts`
- `assertConversationInHousehold(conversationId, householdId)` — new helper introduced here because every mutating/reading action needs the same AND(id, householdId) guard

## Tasks Completed

| # | Task | Commit | Files |
| --- | --- | --- | --- |
| 1 | Implement chat server actions (create/list/load/save/delete) | `b8b4533` | `src/app/actions/chat.ts` |

## Verification

- `rtk pnpm exec tsc --noEmit` — passed (no output)
- `grep -c "await getMemberRow" src/app/actions/chat.ts` — **6** (one per action, as required)
- `grep -c "'use server'" src/app/actions/chat.ts` — **1**
- `grep "^export async function"` — all six function names present: `createConversation`, `listConversations`, `loadHistory`, `saveUserMessage`, `saveAssistantMessage`, `deleteConversation`

## Deviations from Plan

None — plan executed exactly as written. Two minor additions both in line with the plan's spirit:

1. Added a private `assertConversationInHousehold` helper to DRY up the AND(id, householdId) guard used by loadHistory / saveUserMessage / saveAssistantMessage / deleteConversation. The plan listed the guard inline for each action; extracting it did not change behaviour.
2. Exported `ConversationSummary` and `MessageRow` interfaces to give the future chat panel (Plan 05-05/06) a typed contract for list/history return values without duplicating the shape.

## Integration Notes for Downstream Plans

- **Plan 05-05 (chat API route)** can import `saveUserMessage` / `saveAssistantMessage` directly from this file. Server actions work inside route handlers because `@/lib/supabase/server` resolves request cookies the same way.
- **Assistant message persistence** should be wired into `streamText`'s `onFinish` callback with the full accumulated text + tool-call array.
- **Tool-call shape** accepted here is `{ name, input?, output? }[]` and is stored as JSONB — matches the Vercel AI SDK tool-call shape closely enough that minor adapter logic in 05-05 will suffice.
- **Cascade behaviour**: deleting a conversation removes all its messages via FK cascade on `messages.conversation_id`. Deleting a household removes conversations → messages transitively.

## Deferred Issues

None.

## Self-Check: PASSED

- FOUND: src/app/actions/chat.ts
- FOUND commit: b8b4533
- Verified: 6 getMemberRow calls, 1 'use server' directive, 6 exported server actions
- TypeScript clean (tsc --noEmit)
