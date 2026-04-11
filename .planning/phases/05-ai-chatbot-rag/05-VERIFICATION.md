---
phase: 05-ai-chatbot-rag
verified: 2026-04-11T00:00:00Z
status: human_needed
score: 6/6 automated must-haves verified; 6/6 success criteria require human smoke test
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Ask about uploaded insurance policy (SC1, INS-07)"
    expected: "Upload an insurance PDF via /insurance, wait for document_ready notification, open chatbot and ask a question answerable from the policy — receive a grounded answer citing retrieved chunks."
    why_human: "Requires live Anthropic API call, deployed Supabase embed Edge Function, and user judgement on answer accuracy."
  - test: "Ask about an appliance manual (SC2, ELEC-05)"
    expected: "Upload an appliance manual via /electronics (or tracker), ask a usage question, receive a grounded answer."
    why_human: "Same as above — requires live RAG pipeline and answer-quality judgement."
  - test: "Extract procedure → create tasks (SC3, INS-08, INS-09, AI-05, AI-06)"
    expected: "Ask chatbot to 'turn these steps into tasks' — ProcedurePreviewModal opens with checkbox list, deselect one step, confirm, tasks appear in /chores with staggered start dates."
    why_human: "Requires live tool-use round-trip and visual modal behaviour; extract_procedure deduplication must be observed working."
  - test: "Live data tool use (SC4, AI-04)"
    expected: "Ask 'what are my upcoming chores?' and 'when does my car tax expire?' — chatbot invokes get_upcoming_chores / get_car_reminders and returns actual DB rows."
    why_human: "Requires live model to decide on tool invocation."
  - test: "Conversation persistence (SC5, AI-07)"
    expected: "Send a few messages, close dock, reopen — historical bubbles reload from loadHistory."
    why_human: "Visual check of bubble reflow and ordering."
  - test: "Async document processing + notification (SC6, AI-03)"
    expected: "Upload a PDF → Inngest runs processDocument → document_ready notification appears in NotificationBell → chatbot can now answer questions about it."
    why_human: "Requires running Inngest dev server (`pnpm dlx inngest-cli@latest dev`) AND deployed Supabase embed Edge Function. Deployment explicitly deferred in Plan 05-02 because SUPABASE_ACCESS_TOKEN was not configured."
  - test: "Deploy Supabase embed Edge Function"
    expected: "Run `pnpm dlx supabase functions deploy embed --no-verify-jwt` — function responds with 384-dim embeddings on /embed."
    why_human: "Requires user to provide SUPABASE_ACCESS_TOKEN (documented auth gate in Plan 05-02). Without this, all RAG queries and document processing will fail at runtime."
  - test: "Set ANTHROPIC_API_KEY"
    expected: "Add ANTHROPIC_API_KEY to .env.local — /api/chat streams Claude Sonnet 4.6 responses."
    why_human: "Auth gate — documented in .env.example but user must provide the secret."
---

# Phase 5: AI Chatbot & RAG — Verification Report

**Phase Goal:** Household AI chatbot powered by Claude Sonnet 4.6 that answers questions about uploaded documents via RAG (pgvector), queries live household data via tool use, extracts procedures to tasks, and persists conversations.

**Verified:** 2026-04-11
**Status:** HUMAN_NEEDED (all code verified; runtime smoke test + two auth gates remain)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Success Criterion | Code Status | Runtime Status |
|---|-------------------|-------------|----------------|
| 1 | User can ask about uploaded insurance policy and get accurate answer | VERIFIED (code) | HUMAN NEEDED |
| 2 | User can ask about an appliance using its manual | VERIFIED (code) | HUMAN NEEDED |
| 3 | Chatbot extracts procedures, presents them, creates tasks | VERIFIED (code) | HUMAN NEEDED |
| 4 | Chatbot answers live-household-data questions | VERIFIED (code) | HUMAN NEEDED |
| 5 | Conversation history persists per household | VERIFIED (code) | HUMAN NEEDED |
| 6 | Documents processed async, user notified when ready | VERIFIED (code) | HUMAN NEEDED |

Every success criterion has all supporting code in place. None can be proved to work end-to-end without a live runtime smoke test plus deployment of the Supabase embed Edge Function and an ANTHROPIC_API_KEY.

**Automated score:** 6/6 code artifacts exist, compile, and are wired.
**Runtime score:** 0/6 — requires human smoke test (blocked by two auth gates).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/migrations/0004_phase5_rag.sql` | pgvector + document_chunks + conversations + messages + ready_for_rag | VERIFIED | 3975 bytes; CREATE EXTENSION vector, HNSW vector_cosine_ops, RLS policies all present; applied to Supabase DB per Plan 05-01 deviation note |
| `src/lib/db/schema.ts` | Exports documentChunks, conversations, messages, readyForRag | VERIFIED | `vector('embedding', { dimensions: 384 })`, `hnsw` index on `vector_cosine_ops`, `pgPolicy('*_all_member')` all present (lines 573–678) |
| `supabase/functions/embed/index.ts` | gte-small Edge Function | VERIFIED (code) / DEFERRED (deploy) | 31 lines, wraps `Supabase.ai.Session('gte-small')` with mean_pool+normalize; NOT deployed to Supabase (Plan 05-02 auth gate) |
| `src/lib/ai/embed.ts` | embedText / embedBatch helpers | VERIFIED | 59 lines; sanitizes input, calls supabase.functions.invoke('embed'), accepts optional admin client |
| `src/lib/ai/rag.ts` | retrieveTopChunks (HNSW cosine) | VERIFIED | 62 lines; uses raw `cosineDistance` in `asc()` ORDER BY (HNSW-compatible), optional documentId filter, household-scoped |
| `src/lib/ai/system-prompt.ts` | buildSystemPrompt with RAG chunks injected | VERIFIED | 35 lines; per-request rebuild, chunks rendered as `[[chunk N doc=<id>]]` blocks |
| `src/lib/ai/tools.ts` | 5 server tools + extract_procedure client tool | VERIFIED | 227 lines; 5 tools have `execute` (get_upcoming_chores/activities, get_warranty/insurance_expiries, get_car_reminders), all filter by householdId and serialise Dates to ISO; `extract_procedure` has NO execute (client-surface) |
| `src/app/actions/chat.ts` | createConversation, listConversations, loadHistory, saveUserMessage, saveAssistantMessage, deleteConversation | VERIFIED | 309 lines; 6 exported server actions; 6 calls to `getMemberRow`; household-scoped RLS + Zod validation + `assertConversationInHousehold` helper |
| `src/app/api/chat/route.ts` | POST /api/chat streaming endpoint | VERIFIED | 167 lines; auth → RAG retrieve (k=5) → saveUserMessage → streamText(claude-sonnet-4-6) → toUIMessageStreamResponse; onFinish aggregates text + toolCalls across all steps → saveAssistantMessage; stopWhen stepCountIs(5); convertToModelMessages properly awaited |
| `src/lib/inngest/functions/process-document.ts` | Async PDF → chunks → embeddings → notification | VERIFIED | 182 lines; 6 step.run blocks (download-pdf, extract-text, chunk-text, embed-batch-*, mark-ready-and-notify, mark-empty-doc-ready); pdf-parse v2 PDFParse class + dynamic import; empty-text fallback branch; document_ready notification inserted |
| `src/app/api/inngest/route.ts` | processDocument registered | VERIFIED | Imported and appended to `functions: [...]` array |
| `src/app/actions/documents.ts` | Emit documents/uploaded on confirmUpload | VERIFIED | try/catch wrapped `inngest.send({ name: 'documents/uploaded', data: { documentId, householdId, storagePath, uploadedBy } })` |
| `src/components/chatbot/ChatbotProvider.tsx` | Open/close context | VERIFIED | 43 lines; isOpen, open, close, toggle, conversationId, setConversationId |
| `src/components/chatbot/ChatbotFab.tsx` | Floating action button | VERIFIED | 24 lines; fixed bottom-right, blue-450, lucide MessageCircle, a11y labels |
| `src/components/chatbot/ChatbotDock.tsx` | 420px dock with useChat wiring | VERIFIED | 127 lines; createConversation on first open, loadHistory on id change, useChat + DefaultChatTransport → /api/chat, mobile backdrop |
| `src/components/chatbot/MessageList.tsx` | Historical + live messages + procedure detection | VERIFIED | 187 lines; detects tool-extract_procedure parts with useRef dedup; renders text + tool-use indicators |
| `src/components/chatbot/MessageInput.tsx` | Textarea + send | VERIFIED | 64 lines; Enter submits, Shift+Enter newline; disabled until ready+conversationId |
| `src/components/chatbot/ProcedurePreviewModal.tsx` | Extract procedure → createTask loop | VERIFIED | 169 lines; checkbox list, sequential createTask loop, staggered start dates, sonner toast, per-step error tracking; targets Chores (INS-09) |
| `src/app/(app)/layout.tsx` | Global mount of ChatbotProvider/Fab/Dock | VERIFIED | ChatbotProvider wraps children with ChatbotFab + ChatbotDock inside |
| `src/components/notifications/NotificationDropdown.tsx` | Renders document_ready | VERIFIED (per Plan 05-04) | Added getNotificationMeta helper with Sparkles icon for document_ready |
| `src/components/realtime/RealtimeProvider.tsx` | Widened type union | VERIFIED (per Plan 05-04) | Type union widened to include document_ready + (string & {}) escape hatch |
| `.env.example` | ANTHROPIC_API_KEY documented | VERIFIED | Appended per Plan 05-05 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Global layout | Chatbot UI | `<ChatbotProvider>` + `<ChatbotFab/>` + `<ChatbotDock/>` | WIRED | Imports + JSX mounts verified in layout.tsx lines 10–62 |
| ChatbotDock | /api/chat | useChat + DefaultChatTransport({ api: '/api/chat', body: { conversationId } }) | WIRED | Transport construction verified at lines 61–66 |
| ChatbotDock | chat server actions | createConversation + loadHistory imported + awaited | WIRED | Both imported from @/app/actions/chat and invoked in effects |
| /api/chat | Claude Sonnet 4.6 | streamText({ model: anthropic('claude-sonnet-4-6') }) | WIRED | Literal model ID present at line 109; import from @ai-sdk/anthropic |
| /api/chat | RAG | retrieveTopChunks({ householdId, query, k: 5, documentId }) | WIRED | Invoked unconditionally when lastUserText exists; chunks injected into system prompt |
| /api/chat | saveUserMessage | Pre-stream persistence | WIRED | Called BEFORE streamText so user turn survives crashes |
| /api/chat | saveAssistantMessage | onFinish callback | WIRED | Aggregates text + toolCalls across ALL event.steps, not just final |
| retrieveTopChunks | pgvector HNSW index | cosineDistance + asc() ORDER BY | WIRED | Raw expression in ORDER BY (not `1 - distance DESC`) — Pitfall 2 avoided |
| embedText | Supabase embed Edge Function | supabase.functions.invoke('embed') | WIRED (code) / DEFERRED (deploy) | Edge Function file committed but NOT deployed to Supabase |
| confirmUpload | processDocument | inngest.send('documents/uploaded') | WIRED | try/catch wrapped emission after DB insert |
| processDocument | document_chunks | embedBatch → db.insert(documentChunks) | WIRED | Per-batch step.run with admin client |
| processDocument | documents.readyForRag | db.update → set readyForRag=true | WIRED | Both in mark-ready-and-notify and mark-empty-doc-ready branches |
| processDocument | document_ready notification | db.insert(notifications, type:'document_ready') | WIRED | Both branches insert the notification row |
| MessageList | ProcedurePreviewModal | onProcedure prop + useRef dedup | WIRED | Detects tool-extract_procedure parts, dedups via seenProcedureKeysRef, calls onProcedure |
| ProcedurePreviewModal | createTask | Sequential loop with per-step error tracking | WIRED | Imports createTask from @/app/actions/tasks; passes {title, notes, startsAt ISO} |
| tools (server-side) | Drizzle DB | Direct db.select filtered by householdId | WIRED | All 5 server tools filter by householdId and serialise Dates |
| tools (extract_procedure) | Client UI | No execute → surfaces as UIMessage tool part | WIRED | Verified: 5 execute functions, 0 on extract_procedure |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|-------------|--------|----------|
| AI-01 | 05-06 | Chat accessible from any section | CODE SATISFIED | ChatbotFab + ChatbotDock globally mounted in `(app)/layout.tsx` |
| AI-02 | 05-05 | Chatbot queries uploaded documents via RAG (pgvector) | CODE SATISFIED | retrieveTopChunks with HNSW vector_cosine_ops + system prompt injection |
| AI-03 | 05-04 | Async document processing + notification | CODE SATISFIED | processDocument Inngest function + document_ready notification |
| AI-04 | 05-05 | Live household data queries | CODE SATISFIED | 5 server-side tools (chores, activities, warranty, insurance, car reminders) |
| AI-05 | 05-05, 05-06 | Chatbot presents extracted procedure steps | CODE SATISFIED | extract_procedure client tool + MessageList detection + ProcedurePreviewModal |
| AI-06 | 05-06 | User selects steps, picks target, tasks appear | CODE SATISFIED | Checkbox list + sequential createTask loop targeting Chores |
| AI-07 | 05-03, 05-05 | Conversation history persisted per household | CODE SATISFIED | conversations + messages tables with household-scoped RLS + saveUser/Assistant actions |
| INS-07 | 05-05 | Chatbot answers policy questions via RAG | CODE SATISFIED | Same as AI-02 (retrieval pipeline covers all document types) |
| INS-08 | 05-04, 05-05 | Extract step-by-step procedure from policy doc | CODE SATISFIED | extract_procedure tool + ProcedurePreviewModal |
| INS-09 | 05-06 | Select steps, confirm Chores target, tasks appear | CODE SATISFIED | ProcedurePreviewModal shows "These will be added to Chores" + createTask loop |
| ELEC-05 | 05-04 | Chatbot answers appliance questions via manual | CODE SATISFIED | Same pipeline as INS-07 (generic document RAG) |

**Note on status:** All 11 requirements are CODE SATISFIED — every code path required to implement them is present, wired, type-checks (per Plan 05-04/05/06 tsc --noEmit = 0), and builds (Plan 05-06 `next build` succeeds, 34 routes generated). None are RUNTIME SATISFIED because live smoke testing has not been performed and two auth gates (Supabase Edge Function deployment + ANTHROPIC_API_KEY) remain open.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | No TODO/FIXME/PLACEHOLDER/HACK/XXX markers found in any phase 5 file. The only `placeholder` match is the JSX `placeholder=` attribute on the chatbot textarea. |

One soft concern (informational only): Plan 05-01 noted `drizzle.__drizzle_migrations` is out of sync with the actual applied migrations because 0002/0003/0004 were applied manually. This is a documented tech-debt item, not a Phase 5 gap — it pre-exists.

### Human Verification Required

See `human_verification` in frontmatter. The eight items collapse into two categories:

1. **Two auth gates blocking runtime** (must be resolved before smoke test):
   - Deploy `supabase/functions/embed/index.ts` — `pnpm dlx supabase functions deploy embed --no-verify-jwt` (requires SUPABASE_ACCESS_TOKEN)
   - Set `ANTHROPIC_API_KEY` in `.env.local`

2. **Six success-criterion smoke tests** (can be run together during a single Plan 05-06 Task 3 session with `pnpm dev` + `pnpm dlx inngest-cli@latest dev`):
   - SC1: Upload insurance PDF → wait for document_ready → ask policy question → grounded answer
   - SC2: Upload appliance manual → ask usage question → grounded answer
   - SC3: "Turn these steps into tasks" → modal → confirm → tasks in /chores
   - SC4: "What are my upcoming chores?" → live tool use
   - SC5: Close+reopen dock → history persists
   - SC6: Document upload → document_ready notification fires

### Gaps Summary

**No code gaps.** Every artifact listed in the phase context exists in the codebase, is substantive (not a stub), and is wired into the rest of the system at the import/usage level. Type checks and the Next.js build both pass per the six plan summaries.

**What's missing is runtime validation, not code:**

- The Supabase `embed` Edge Function is committed but not deployed. Without deployment, every call to `embedText` / `embedBatch` will fail at runtime, which breaks both the document-processing Inngest pipeline (embed-batch-* step.run blocks) and the live RAG retrieval inside POST /api/chat.
- `ANTHROPIC_API_KEY` is not set. Without it, `streamText({ model: anthropic('claude-sonnet-4-6') })` will fail with a 401.
- No end-to-end smoke test has been performed. Plan 05-06 explicitly marks Task 3 as a `checkpoint:human-verify` — it was never executed.

**Recommendation:** Mark Phase 5 as **code-complete / runtime-pending**. Resolve the two auth gates, then walk the 9-step smoke-test checklist in Plan 05-06 Task 3 (which covers all six success criteria). If all nine steps pass, Phase 5 is done. If any step fails, run `/gsd:plan-phase --gaps` against the failing truths.

---

_Verified: 2026-04-11_
_Verifier: Claude (gsd-verifier)_
