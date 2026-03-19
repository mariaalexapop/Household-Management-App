# Architecture Patterns

**Domain:** AI-powered household management web app
**Researched:** 2026-03-19
**Confidence:** MEDIUM (training knowledge; web verification unavailable — flag for validation before implementation)

---

## Recommended Architecture

### System Overview

A layered architecture with three primary tiers: a React/Next.js frontend, a Next.js API layer (REST endpoints + SSR), and a Supabase backend (PostgreSQL + Realtime + Storage + Auth). A dedicated async worker handles all long-running AI and webhook workloads out of band from the request cycle.

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER / PWA                     │
│   React (Next.js) — dashboard, chat, camera OCR     │
└───────────────┬─────────────────────────────────────┘
                │ HTTPS / WebSocket
┌───────────────▼─────────────────────────────────────┐
│              NEXT.JS API LAYER                       │
│  /api/auth   /api/households   /api/expenses         │
│  /api/tasks  /api/ai/chat      /api/documents        │
│  /api/banking  (webhook receiver)                    │
└──────┬───────────────────────┬──────────────────────┘
       │                       │ enqueue jobs
┌──────▼──────────┐   ┌────────▼────────────────────┐
│  SUPABASE       │   │   ASYNC WORKER (Inngest)     │
│  - PostgreSQL   │   │                             │
│  - Auth (JWT)   │   │   • OCR pipeline             │
│  - Realtime     │   │   • LLM extraction           │
│  - Storage      │   │   • AI suggestions gen       │
│    (S3-compat)  │   │   • Banking webhook proc     │
└──────┬──────────┘   │   • Warranty/reminder sched  │
       │              └────────────┬────────────────┘
       │                           │
       │              ┌────────────▼────────────────┐
       │              │   EXTERNAL SERVICES          │
       │              │   • Anthropic Claude API     │
       │              │   • TrueLayer (UK/EU)        │
       │              │     or Plaid (US)            │
       │              └─────────────────────────────┘
       │ Realtime subscription
┌──────▼──────────────────────────────────────────────┐
│     BROWSER (Supabase Realtime channel)              │
│     household:{id} — push delta events               │
└─────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Next.js Frontend | UI, camera capture, Realtime subscription, optimistic updates | API Layer (HTTP), Supabase Realtime (WS) |
| Next.js API Layer | Auth enforcement, CRUD, job enqueueing, webhook reception | Supabase DB, Worker queue, Supabase Storage |
| Supabase Auth | JWT issuance, OAuth, session management | API Layer, RLS (passes user_id claim) |
| Supabase PostgreSQL | All persistent state | API Layer, Worker, Realtime (change feed) |
| Supabase Realtime | Broadcasts row-level changes to household members | PostgreSQL (logical replication), Browser (WS) |
| Supabase Storage | Raw file storage (receipts, warranty docs) | API Layer (presigned URLs), Worker (read for OCR), Browser (download) |
| Async Worker (Inngest) | OCR, LLM extraction, banking webhooks, scheduled reminders | Supabase DB, Claude API, TrueLayer/Plaid |
| Claude API | Image OCR + structured extraction, chat responses, suggestions | Worker (extraction), API Layer (chat) |
| Open Banking | Transaction feeds, webhooks | Worker (inbound webhook), API Layer (OAuth init) |

---

## Data Flow

### Flow 1: Receipt OCR to Expense Record

```
1. User taps "Scan receipt" — browser opens camera
2. Image uploaded direct to Supabase Storage via presigned PUT URL
   (file never transits API server)
3. API creates pending document record: { status: "processing", type: "receipt" }
4. API enqueues job: { type: "ocr_receipt", document_id, storage_path }
5. Worker:
   a. Fetch image from Storage
   b. POST to Claude Vision: "Extract receipt as JSON: { merchant, date, total, line_items }"
   c. Validate + sanitise response
   d. Write expense record(s) to DB
   e. Update document: { status: "complete", parsed_data: {...} }
6. Supabase Realtime fires change on expenses table — household channel
7. All members' browsers update without refresh
```

### Flow 2: Warranty Document to Tracked Warranty

```
1-4. Same as Flow 1 (upload → pending doc → enqueue job)
5. Worker: Claude Vision extraction → write warranty record → schedule reminder job
   at (expiry_date - 30 days)
6. Realtime pushes new warranty card to dashboard
```

### Flow 3: Open Banking Webhook to Transaction Import

```
1. User connects bank — API redirects to TrueLayer/Plaid OAuth
2. Access token stored encrypted in DB
3. Provider fires webhook POST to /api/banking/webhook
4. API validates signature — enqueues bank_sync job
5. Worker: fetch transactions → deduplicate (external_id) → categorise via Claude → write expenses
6. Realtime pushes new expenses to household
```

### Flow 4: LLM Chat (Synchronous / Streaming)

```
1. User query — POST /api/ai/chat (NOT queued — latency-sensitive)
2. API: authenticate → resolve household → build targeted context snapshot via SQL
3. Claude prompt (streaming): system context + tool definitions + user query
4. Stream response via SSE directly to requesting user
5. Store exchange in conversation_messages
```

### Flow 5: Ambient AI Suggestions

```
1. Triggered: daily cron + on significant data change
2. Worker: aggregate context (spend trends, upcoming bills, overdue tasks, expiring warranties)
3. Claude: generate 3-5 JSON suggestions
4. Upsert ai_suggestions table
5. Realtime pushes updated cards to all household members' dashboards
```

---

## Data Model

### Core Tables

```sql
households            — id, name, invite_code, created_at
household_members     — id, household_id, user_id, display_name, joined_at
                        (no role column in v1 — full equality model)

expenses              — id, household_id, created_by, attributed_to, amount, currency,
                        category_id, merchant, date, source, external_id, document_id

expense_categories    — id, household_id, name, icon, is_default
                        (stored in DB table — not a hardcoded enum)

bills                 — id, household_id, name, amount, frequency,
                        next_due_date, is_paid, reminder_days_before

tasks                 — id, household_id, title, assigned_to, due_date,
                        completed_at, recurrence_rule (RRULE), created_by

documents             — id, household_id, uploaded_by, storage_path, mime_type,
                        status (pending/processing/complete/failed),
                        document_type, parsed_data (jsonb)

warranties            — id, household_id, document_id, product_name, brand,
                        model_number, purchase_date, expiry_date,
                        coverage_summary, reminder_sent

banking_connections   — id, household_id, provider, access_token_encrypted,
                        refresh_token_encrypted, account_ids, last_synced_at, status

ai_suggestions        — id, household_id, type, title, body, action_link,
                        generated_at, dismissed_at, expires_at

conversation_messages — id, household_id, user_id, role (user/assistant),
                        content, created_at

activity_feed         — id, household_id, actor_id, event_type,
                        entity_type, entity_id, metadata (jsonb), created_at
```

### Multi-Tenant Isolation Pattern

```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_member_read" ON expenses
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household_member_write" ON expenses
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
```

This pattern repeats for every household-scoped table. `household_members` is the single source of truth for membership.

---

## Async Worker (Inngest)

Inngest is preferred over BullMQ because it works natively with Next.js serverless (no Redis required), has built-in step functions and delayed scheduling (needed for warranty reminders), and provides managed observability.

| Job Type | Trigger | Target SLA |
|----------|---------|------------|
| `ocr_receipt` | Document upload | < 30s |
| `ocr_warranty` | Document upload | < 30s |
| `generate_suggestions` | Daily cron + data change | < 60s |
| `bank_sync` | Provider webhook | < 60s |
| `bill_reminder` | Cron | < 5s |
| `warranty_reminder` | Delayed (set at record creation) | < 5s |

---

## Key Architectural Patterns

**Async command for AI pipelines.** Write operations triggering AI return `{ status: "processing" }` immediately. Result arrives via Realtime. Never hold an HTTP connection open for LLM latency.

**Household context injection.** All Claude prompts receive a compact aggregated context snapshot from a `HouseholdContextBuilder` — never raw table rows. Controls token cost and prevents context window overflow at scale.

**Idempotent job processing.** Every worker job is safe to retry. Use `external_id` unique constraints and upsert semantics throughout. Webhooks re-deliver; duplicate expense records destroy trust.

**Activity feed as append-only event log.** All significant mutations append to `activity_feed`. Never modify, only append. Drives both the "who did what" UI and provides structured data for AI suggestion generation.

---

## Anti-Patterns to Avoid

**Synchronous LLM in request handlers.** Vercel timeout is 10s default; Claude P99 is 10-30s. Always use the async worker. Return pending status, push result via Realtime.

**Full table dumps in LLM context.** Sending raw expense rows scales linearly with household data size. Send aggregated summaries only.

**User-scoped tables for shared data.** Key all shared entities by `household_id` from day one. User identity appears only as `created_by` / `actor_id`.

**Banking tokens in plaintext.** Encrypt at rest with application-layer AES-256-GCM before writing. Key in environment secret, never in DB.

**Polling for real-time sync.** Use Supabase Realtime WebSocket subscriptions. Polling is acceptable only as connection-drop fallback.

---

## Build Order (Phase Dependencies)

```
Phase 1: Auth + Household Core
  Supabase setup, Auth, households + household_members tables + RLS, invite flow
  UNLOCKS: everything — all subsequent phases depend on household isolation

Phase 2: Tasks + Bills
  CRUD for tasks and bills, first Realtime subscription, first Worker job (bill reminders)
  UNLOCKS: proves Realtime + Worker stack before adding AI complexity

Phase 3: Manual Expenses + Financial Views
  expenses table (manual only), category taxonomy, spending views
  UNLOCKS: financial foundation; AI augments these records later

Phase 4: OCR Pipeline + Document Intelligence
  Storage setup, presigned uploads, Worker OCR + Claude extraction, warranties table
  DEPENDS ON: Phases 1-3 (RLS, Worker, expenses table)
  UNLOCKS: core AI differentiator

Phase 5: Open Banking
  banking_connections, OAuth flow, webhook receiver, Worker transaction import
  DEPENDS ON: Phase 2 (Worker), Phase 3 (expenses)
  NOTE: requires provider account + regulatory check before starting

Phase 6: AI Assistant (Chat + Ambient Suggestions)
  Streaming chat API, ai_suggestions, Worker suggestion generation, dashboard cards
  DEPENDS ON: all prior phases (needs full data model for meaningful context)

Phase 7: Polish + Mobile Readiness
  Push notifications, PWA manifest, camera UX polish, performance audit
  DEPENDS ON: all prior phases
```

---

## Confidence Assessment

| Claim | Confidence | Basis |
|-------|-----------|-------|
| Supabase RLS for multi-tenant isolation | HIGH | Well-documented standard pattern |
| Async worker (Inngest) for AI pipelines | HIGH | Established Next.js pattern |
| Presigned upload (no API transit) | HIGH | Standard S3 pattern |
| Supabase Realtime respects RLS | MEDIUM | Documented as of Aug 2025 — verify current docs |
| Inngest delayed steps for reminders | MEDIUM | Verify current Inngest API |
| TrueLayer webhook signature format | LOW | Implementation detail — verify TrueLayer docs |
| Claude Vision as primary OCR | MEDIUM | Needs cost/accuracy benchmarking for receipts |

---

## Sources

WebSearch and WebFetch were unavailable during this research session. All findings are from training knowledge (cutoff Aug 2025). All external service implementation details (Supabase Realtime RLS behaviour, Inngest step API, TrueLayer webhook format, Plaid API shape) must be verified against current official documentation before implementation.
