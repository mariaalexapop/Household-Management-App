# Architecture Patterns

**Domain:** Family household command centre with AI chatbot and RAG
**Researched:** 2026-03-19
**Last updated:** 2026-03-24 — significant revision; new domain tables, RAG data flow, corrected build order, admin model, v2 items noted
**Confidence:** HIGH for patterns confirmed by Phase 1 research (01-RESEARCH.md); MEDIUM for v2 items not yet researched

---

## Recommended Architecture

### System Overview

A layered architecture with three primary tiers: a React/Next.js frontend, a Next.js API layer (Server Actions + route handlers), and a Supabase backend (PostgreSQL + Realtime + Storage + pgvector + Auth). An async worker (Inngest) handles all long-running AI, notification, and document processing workloads out of band from the request cycle.

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER / PWA                     │
│   React (Next.js App Router) — dashboard, modules, │
│   calendar, chat, document uploads                  │
└───────────────┬─────────────────────────────────────┘
                │ HTTPS / WebSocket
┌───────────────▼─────────────────────────────────────┐
│              NEXT.JS API LAYER                       │
│  Server Actions (mutations) + Route Handlers (API)  │
│  /api/household  /api/invite  /api/documents         │
│  /api/ai/chat   /api/inngest (webhook receiver)      │
└──────┬───────────────────────┬──────────────────────┘
       │                       │ enqueue jobs
┌──────▼──────────┐   ┌────────▼────────────────────┐
│  SUPABASE       │   │   ASYNC WORKER (Inngest)     │
│  - PostgreSQL   │   │                             │
│  - Auth (JWT)   │   │   • Document embedding       │
│  - Realtime     │   │     (PDF → chunks → pgvector)│
│  - Storage      │   │   • Reminder scheduler       │
│    (PDFs,docs)  │   │     (MOT, insurance, warranty│
│  - pgvector     │   │      kids activities)        │
│    (embeddings) │   │   • Email notifications      │
└──────┬──────────┘   └────────────┬────────────────┘
       │                           │
       │              ┌────────────▼────────────────┐
       │              │   EXTERNAL SERVICES          │
       │              │   • Anthropic Claude API     │
       │              │     (chat + extraction)      │
       │              │   • OpenAI Embeddings API    │
       │              │     (text-embedding-3-small) │
       │              │   • Resend (email)           │
       │              └─────────────────────────────┘
       │ Realtime subscription
┌──────▼──────────────────────────────────────────────┐
│     BROWSER (Supabase Realtime channel)              │
│     household:{id} — push delta events              │
└─────────────────────────────────────────────────────┘
```

**v2 additions to this diagram:** OCR pipeline (Claude Vision + Sharp), open banking (TrueLayer/Plaid webhook receiver + bank sync worker).

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Next.js Frontend | UI, camera capture (v2), Realtime subscription, optimistic updates | API Layer (HTTP/Server Actions), Supabase Realtime (WS) |
| Next.js API Layer | Auth enforcement, CRUD, job enqueueing, invite management | Supabase DB, Inngest, Supabase Storage |
| Supabase Auth | JWT issuance, OAuth (Google), session management | API Layer, RLS (passes user_id claim) |
| Supabase PostgreSQL | All persistent state | API Layer, Inngest worker, Realtime (change feed) |
| Supabase Realtime | Broadcasts row-level changes to household members | PostgreSQL (logical replication), Browser (WS) |
| Supabase Storage | Raw file storage (insurance PDFs, user manuals, warranty docs) | API Layer (presigned URLs), Inngest worker (read for embedding) |
| pgvector (Supabase) | Stores and queries document embeddings for RAG | Inngest (write), API Layer (read for chatbot) |
| Async Worker (Inngest) | Document embedding, reminder scheduling, email sending | Supabase DB, Claude API, OpenAI Embeddings API, Resend |
| Claude API | Chatbot responses, procedure extraction, task suggestions | API Layer (streaming chat), Inngest (extraction) |
| OpenAI Embeddings API | Text → vector embeddings for RAG | Inngest (called on document upload) |

---

## Data Model

### Core Tables

```sql
-- Households & Members
households            — id, name, created_at
household_members     — id, household_id, user_id, role (admin|member), display_name,
                        avatar_url, joined_at
                        NOTE: role is admin for household creator; member for invited users.
                        Role controls membership management only — all content is equally accessible.
household_settings    — id, household_id, household_type (couple|family|flatmates|single),
                        active_modules (text[]), created_at, updated_at
                        NOTE: active_modules drives dashboard rendering and reminder job activation.
household_invites     — id, household_id, token (uuid), email (nullable — null for link invites),
                        invited_by, expires_at, claimed_at, claimed_by

-- Activity Feed
activity_feed         — id, household_id, actor_id, event_type, entity_type,
                        entity_id, metadata (jsonb), created_at
                        NOTE: append-only. Never modified. Drives "who did what" UI.

-- Home Chores
tasks                 — id, household_id, title, description, category, assigned_to,
                        due_date, completed_at, recurrence_rule (RRULE string), created_by, created_at

-- Children (no accounts — parent-managed profiles)
children              — id, household_id, name, date_of_birth, created_at

-- Kids Activities
kids_activities       — id, household_id, child_id, title, category
                        (school|medical|sport|hobby|social), date_time, location,
                        recurrence_rule (RRULE), responsible_parent_id, created_by, created_at

-- Cars
cars                  — id, household_id, make, model, year, plate, colour,
                        notes, created_by, created_at
car_service_records   — id, car_id, household_id, date, service_type, mileage,
                        garage, cost (numeric, nullable), notes, created_by, created_at
car_key_dates         — id, car_id, household_id, date_type (mot|tax|service|other),
                        due_date, reminder_days_before, notes, created_at

-- Insurance
insurance_policies    — id, household_id, policy_type (home|car|health|life|travel|other),
                        insurer, policy_number, expiry_date,
                        renewal_contact_name, renewal_contact_phone, renewal_contact_email,
                        reminder_days_before, created_by, created_at
insurance_documents   — id, policy_id, household_id, storage_path, filename,
                        file_size, uploaded_by, created_at
insurance_costs       — id, policy_id, household_id, annual_premium,
                        payment_schedule (annual|quarterly|monthly),
                        next_payment_date, reminder_days_before, created_at

-- Electronics
electronics_items     — id, household_id, name, brand, model_number,
                        purchase_date, cost (numeric, nullable), created_by, created_at
electronics_documents — id, item_id, household_id, document_type (warranty|manual),
                        storage_path, filename, file_size, uploaded_by, created_at
warranties            — id, item_id, household_id, expiry_date, coverage_summary,
                        reminder_sent, created_at

-- AI / RAG
document_embeddings   — id, household_id, source_document_id, source_document_type
                        (insurance_document|electronics_document), chunk_index,
                        content (text), embedding (vector(1536)), metadata (jsonb), created_at
                        NOTE: source_document_type disambiguates which table source_document_id
                        references. Queries filter by household_id and optionally document_type.
chat_messages         — id, household_id, user_id, role (user|assistant),
                        content, tool_calls (jsonb, nullable), created_at
```

### Multi-Tenant Isolation Pattern (RLS)

```sql
-- Pattern repeats for every household-scoped table.
-- household_members is the single source of truth for membership.

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_member_read" ON tasks
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household_member_write" ON tasks
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Admin-only policies (for household management operations):
CREATE POLICY "admin_only_delete_member" ON household_members
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Drizzle RLS pattern (preferred over raw SQL):**
```typescript
// Source: Drizzle ORM official docs
import { pgPolicy, authenticatedRole, authUid } from 'drizzle-orm/pg-core'

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull(),
  // ... other fields
}, (table) => [
  pgPolicy('household_member_read', {
    for: 'select',
    to: authenticatedRole,
    using: sql`${table.householdId} IN (
      SELECT household_id FROM household_members WHERE user_id = ${authUid()}
    )`,
  }),
])
```

---

## Data Flows

### Flow 1: Onboarding → Personalised Dashboard (v1)

```
1. User completes onboarding (household type + module selection)
2. API writes household_settings: { household_type, active_modules: ['chores', 'cars'] }
3. Dashboard server component reads household_settings
4. Renders only activated module sections — inactive modules hidden
5. Supabase Realtime: any member updating active_modules triggers dashboard re-render for all members
```

### Flow 2: Document Upload → RAG Ready (v1 Phase 5)

```
1. User uploads PDF (insurance policy or user manual)
2. File uploads direct to Supabase Storage via presigned PUT URL (file never transits API)
3. API creates insurance_documents / electronics_documents record: { status: "processing" }
4. API enqueues Inngest job: { type: "embed_document", document_id, storage_path, household_id }
5. Inngest worker:
   a. Fetch PDF from Supabase Storage
   b. Extract text (pdf-parse for text PDFs; Claude Vision for scanned PDFs)
   c. Chunk text (~512 tokens, 50-token overlap)
   d. Embed each chunk via OpenAI text-embedding-3-small
   e. Write chunks to document_embeddings (with household_id, source references)
   f. Update document record: { status: "ready" }
6. Supabase Realtime fires → user receives notification: "Document ready for questions"
```

### Flow 3: Chatbot Query → RAG Response (v1 Phase 5)

```
1. User sends message: "What do I do if my boiler leaks?"
2. POST /api/ai/chat (streaming)
3. API: authenticate → resolve household → determine query intent (document RAG vs live data)
4a. Document query path (RAG):
   - Embed user question via OpenAI text-embedding-3-small
   - pgvector similarity search: top-5 chunks, scoped to household_id
   - Retrieved chunks + question → Claude (streaming)
   - Response cites source document + section
4b. Live data query path (tool-calling):
   - Claude invokes tool (e.g., get_insurance_policies, get_car_key_dates)
   - Tool executes SQL query scoped to household_id
   - Query result injected into Claude context → response generated
5. Stream response to user via SSE
6. Store exchange in chat_messages
```

### Flow 4: Chatbot Procedure Extraction → Tasks (v1 Phase 5)

```
1. User: "What steps should I take after a burst pipe?"
2. Claude queries insurance documents via RAG (Flow 3)
3. Claude identifies a procedure (numbered/bulleted steps)
4. Claude responds with steps + asks: "Would you like me to create tasks for these steps?"
5. User selects which steps to add → confirms target section (default: Chores)
6. API creates task records in tasks table, assigned to requesting user
7. Supabase Realtime fires → tasks appear in Chores section for all household members
8. User sees tasks in Chores module ready to edit/assign
```

### Flow 5: Reminder Scheduling (v1 Phases 2-4)

```
1. User sets a reminder (MOT due date, insurance expiry, warranty expiry, kids activity)
2. API writes the record (car_key_dates, insurance_policies, warranties, kids_activities)
3. API enqueues Inngest delayed function: fire X days before due_date
4. Inngest fires at the scheduled time:
   a. Check if household still has this module active (household_settings)
   b. Check if reminder hasn't been dismissed
   c. Send in-app notification (Supabase Realtime) + push notification (Web Push API)
   d. Send email notification via Resend if configured
```

### v2 Data Flows (deferred)

- **Receipt OCR → Expense:** image upload → Inngest OCR worker → Claude Vision extraction → review screen → expense record
- **Bank webhook → Transaction import:** TrueLayer/Plaid webhook → Inngest sync worker → categorisation → expense records

---

## Async Worker (Inngest) — v1 Job Types

| Job Type | Trigger | Target SLA |
|----------|---------|------------|
| `embed_document` | Document upload (PDF) | < 60s |
| `reminder_task_due` | Delayed (set when task due date saved) | < 5s |
| `reminder_insurance_expiry` | Delayed (set when policy expiry saved) | < 5s |
| `reminder_insurance_payment` | Delayed (set when payment schedule saved) | < 5s |
| `reminder_warranty_expiry` | Delayed (set when warranty expiry saved) | < 5s |
| `reminder_car_key_date` | Delayed (set when key date saved) | < 5s |
| `reminder_kids_activity` | Delayed (set when activity date saved) | < 5s |
| `send_invite_email` | Household invite created | < 10s |

---

## Key Architectural Patterns

**Async command for document processing.** Document uploads return `{ status: "processing" }` immediately. Embedding result arrives via Realtime notification. Never hold an HTTP connection open for document processing.

**Household context injection for LLM.** All Claude prompts receive targeted context — never raw table dumps. For RAG: top-k pgvector results. For live data queries: aggregated SQL query results via tool-calling. Controls token cost.

**Tool-calling for factual queries.** The chatbot must never recall factual household data from LLM memory. All queries about car dates, insurance policies, warranties, kids activities route through Vercel AI SDK tool-calling to execute scoped SQL queries.

**Module-aware job activation.** Before firing any reminder job, Inngest worker checks `household_settings.active_modules`. If the relevant module is disabled, the reminder is skipped (not deleted — so it resumes if the module is re-enabled).

**Activity feed as append-only event log.** All significant mutations append to `activity_feed`. Never modify existing entries. Drives "who did what" UI.

**Idempotent job processing.** Every Inngest job is safe to retry. Use unique constraints and upsert semantics. Reminder jobs check whether they've already fired before sending notifications.

**Realtime publication management.** Tables must be explicitly added to the `supabase_realtime` publication. Missing this is a common silent failure where real-time events never fire.

---

## Anti-Patterns to Avoid

**Synchronous LLM in API route handlers.** Vercel timeout is 10s default; Claude P99 is 10-30s. All non-chat AI processing must use Inngest. Chat uses streaming SSE to stay within timeout.

**Full table dumps in LLM context.** Sending raw table rows to Claude scales linearly with data. Use pgvector similarity search (RAG) for documents; use aggregated SQL query results for live data.

**User-scoped tables for shared household data.** Key all shared entities by `household_id` from day one. User identity appears only as `created_by`, `actor_id`, `responsible_parent_id`.

**Skipping Realtime publication setup.** Adding a table to RLS is not enough for Realtime — the table must also be in the `supabase_realtime` publication. Verify per table.

**Module preferences as client-only state.** Active modules must be stored in `household_settings` in the database — not in local storage or client state — so all household members see the same module configuration.

**Using `getSession()` in server contexts.** Always use `getUser()` from `@supabase/ssr` — it validates the JWT server-side. `getSession()` trusts the client-provided token, which is a security gap.

---

## Build Order (v1 phases)

```
Phase 1: Foundation & Onboarding
  Supabase setup (EU region), Auth (@supabase/ssr 0.9+), households + household_members
  (with role column) + household_settings + household_invites tables, RLS on ALL tables,
  onboarding wizard (type + module selection), modular dashboard skeleton, Realtime
  subscription, GDPR (EU region confirmed, right-to-erasure endpoint)
  UNLOCKS: everything — all subsequent phases depend on household isolation and module system

Phase 2: Home Chores
  tasks table + RLS, CRUD, RRULE recurrence, Inngest reminder jobs (first Inngest worker),
  in-app + push notifications, notification permission ask UX
  UNLOCKS: proves Inngest + Realtime + notification stack before adding document complexity

Phase 3: Kids Activities
  children table + RLS, kids_activities table + RLS, activity CRUD, RRULE recurrence,
  Inngest reminder jobs (reuses Phase 2 pattern), calendar view (kids only)
  UNLOCKS: second domain module; notification infra reused

Phase 4: Tracker Modules & Calendar
  Car: cars + car_service_records + car_key_dates tables + RLS + CRUD + reminders
  Insurance: insurance_policies + insurance_documents + insurance_costs + RLS + CRUD +
    reminders + PDF upload to Supabase Storage
  Electronics: electronics_items + electronics_documents + warranties + RLS + CRUD +
    expiry reminders + PDF upload
  Costs: optional cost fields on car_service_records + insurance_costs + electronics_items,
    costs dashboard (aggregated query)
  Calendar: unified calendar aggregating all date-typed records, colour-coded by module
  UNLOCKS: all documents uploaded and available for RAG in Phase 5

Phase 5: AI Chatbot & RAG
  pgvector extension enabled, document_embeddings table + RLS, chat_messages table + RLS,
  Inngest embed_document job (PDF → text → chunks → OpenAI embeddings → pgvector),
  chatbot API route (streaming, tool-calling for live data + RAG for documents),
  procedure extraction → task creation flow
  DEPENDS ON: Phases 1-4 (documents in Storage, modules populated with data)
  UNLOCKS: AI differentiator; makes uploaded documents queryable

Phase 6: Platform & Polish
  Mobile responsiveness audit, PWA manifest + service worker,
  camera access prep (for v2 OCR), Playwright mobile E2E, Sentry, PostHog
  DEPENDS ON: all prior phases
```

---

## Confidence Assessment

| Claim | Confidence | Basis |
|-------|-----------|-------|
| Supabase RLS for multi-tenant isolation | HIGH | Phase 1 research verified against official Drizzle + Supabase docs (2026-03-24) |
| @supabase/ssr 0.9 getUser() pattern | HIGH | Phase 1 research verified against official Supabase SSR docs (2026-03-24) |
| Supabase Realtime respects RLS | HIGH | Phase 1 research verified against Supabase Realtime Authorization docs (2026-03-24) |
| pgvector for RAG (Supabase built-in) | HIGH | Phase 1 research verified (2026-03-24) |
| Inngest for all async work | HIGH | Project decision documented in PROJECT.md |
| OpenAI text-embedding-3-small for embeddings | HIGH | Phase 1 research verified against npm registry (2026-03-24) |
| PDF parsing approach for RAG | MEDIUM | pdf-parse + pdf2pic pattern is standard; verify at Phase 5 implementation |
| Drizzle native RLS (pgPolicy) | HIGH | Phase 1 research verified against official Drizzle docs (2026-03-24) |

---

## Sources

- Phase 1 research (01-RESEARCH.md, 2026-03-24) — primary source for verified patterns
- Supabase official docs — Auth SSR, Realtime Authorization, pgvector
- Drizzle ORM official docs — pgPolicy, Supabase tutorial
- Training knowledge (cutoff Aug 2025) — async patterns, data flow design
