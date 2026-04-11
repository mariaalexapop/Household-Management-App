# Phase 5: AI Chatbot & RAG - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a household AI chatbot powered by Claude Sonnet 4.6 that can:
1. Answer questions about uploaded insurance policies, warranty documents, and user manuals via RAG (pgvector similarity search)
2. Query live household data via tool use (upcoming chores, activities, warranty expiries, etc.)
3. Extract step-by-step procedures from documents and convert them to user-editable tasks
4. Persist conversation history per household
5. Process documents asynchronously with user notification when ready for querying

Requirements: AI-01 through AI-07, INS-07, INS-08, INS-09, ELEC-05

</domain>

<decisions>
## Implementation Decisions

### Chatbot Access & UI Placement
- **Global floating action button** (bottom-right) on every `/app/*` page — opens chat
- **Right-side dock panel** (420px wide, full-height overlay) with message list + composer
- **Streaming responses** via Vercel AI SDK `useChat` hook — matches existing stack
- **Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6`) — consistent with project convention

### RAG Pipeline & Document Processing
- **Vector storage:** `pgvector` extension on existing Supabase Postgres
  - Enable `vector` extension via migration
  - New `document_chunks` table: `id`, `document_id`, `chunk_index`, `content`, `embedding vector(384)`
- **Embedder:** Supabase gte-small (runs in Edge Functions, free, 384 dims, no new API key) — keeps infra single-vendor
- **PDF → chunks pipeline (Inngest background job):**
  1. Trigger on document upload via `documents/uploaded` event
  2. Download PDF from Supabase Storage
  3. Extract text with `pdf-parse`
  4. Chunk to ~1000 characters with 200-character overlap
  5. Embed each chunk via Supabase Edge Function (`gte-small`)
  6. Insert into `document_chunks` with `document_id` + `chunk_index`
  7. Mark document as `ready_for_rag = true` and fire notification
- **Retrieval strategy:** Top-k similarity (k=5) scoped to household's documents, optionally filtered by `document_id` when user is viewing a specific item

### Procedure Extraction & Task Creation
- **Trigger:** User-initiated — "Turn into tasks" button appears when chatbot detects a step list in its response
- **Extraction format:** Claude tool use with `extract_procedure` tool returning `{steps: [{title, description}]}`
- **Task creation UX:** Preview modal — user sees extracted steps as checkboxes, picks which to create, chooses target section (default: Chores), then confirms
- **Target sections:** Chores module only for MVP (per INS-09 and AI-06 default)

### Live Data Queries & Conversation History
- **Live data access:** Claude tool use with typed tools:
  - `get_upcoming_chores` — next N chore tasks
  - `get_upcoming_activities` — next N kids activities
  - `get_warranty_expiries` — electronics warranties expiring in next 90 days
  - `get_insurance_expiries` — policies expiring in next 90 days
  - `get_car_reminders` — MOT/tax/service due in next 30 days
- **Conversation persistence:**
  - New `conversations` table: `id`, `household_id`, `title`, `created_at`, `updated_at`
  - New `messages` table: `id`, `conversation_id`, `role`, `content`, `tool_calls`, `created_at`
- **Context window:** Last 20 messages per conversation sent to Claude, full history in UI via scroll
- **Document-ready notification:** Reuse existing notifications system (Phase 1 realtime + NotificationBell) — fire notification event when embedding job completes

### Claude's Discretion
- Exact chunk size / overlap tuning
- Tool schema JSON details
- System prompt wording and guardrails
- Rate limiting and abuse prevention
- Token accounting / cost tracking

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/actions/documents.ts` — existing document upload server action (signed URL flow) from Phase 4
- `src/components/tracker/FileUploadZone.tsx` — drag-drop PDF upload
- `src/components/notifications/NotificationBell.tsx` + notifications realtime system — reuse for "document ready" notifications
- Inngest setup in `src/lib/inngest/` — pattern for async jobs
- Drizzle schema in `src/lib/db/schema.ts` — `documents` table already exists from Phase 4
- `src/app/actions/tasks.ts` — `createTask` server action — call from chatbot's task-creation flow

### Established Patterns
- Server Actions in `src/app/actions/` with Zod + auth + household membership checks
- Inngest functions in `src/lib/inngest/functions/` — one per job
- Drizzle schema with inline RLS policies
- Miro design system — ring-miro, rounded-xl, Space Grotesk headings, Noto Sans body
- Blue 450 (#5b76fe) for primary interactive

### Integration Points
- `src/app/(app)/layout.tsx` — add chatbot FAB as global overlay
- `src/lib/db/schema.ts` — add `conversations`, `messages`, `document_chunks` tables + pgvector extension
- Existing `documents` table — add `ready_for_rag` boolean column
- Existing Inngest router `src/app/api/inngest/route.ts` — register new document processing + notification functions
- NotificationBell — extend with new notification type "document_ready"

</code_context>

<specifics>
## Specific Ideas

- Use Vercel AI SDK `@ai-sdk/anthropic` for streaming Claude responses
- Use `@supabase/supabase-js` Edge Functions invoker for gte-small embeddings
- Use `pdf-parse` (or `pdfjs-dist`) for PDF text extraction
- Module accent for chatbot: blue (primary) — no new pastel needed
- Chat UI follows Miro design: white bg, ring-miro panel, rounded-2xl messages, Space Grotesk for bot name, Noto Sans for message body

</specifics>

<deferred>
## Deferred Ideas

- Multi-language support
- Voice input / output
- Image understanding (attaching photos to chat)
- Full-text search alongside semantic search (hybrid retrieval)
- Per-message cost tracking UI
- Task creation in modules other than chores (v2)
- Custom system prompts per household
- RAG confidence scores surfaced in UI

</deferred>
