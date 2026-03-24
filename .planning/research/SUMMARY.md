# Research Summary

**Project:** Family household command centre with AI chatbot and RAG
**Synthesized:** 2026-03-19
**Last updated:** 2026-03-24 — full rewrite for revised concept
**Source files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, phases/01-foundation-onboarding/01-RESEARCH.md

---

## Executive Summary

This is a modular, AI-assisted family management product. The target audience is families with children and multiple assets (cars, home, electronics, insurance policies) who are currently duct-taping together Google Calendar, spreadsheets, phone reminders, and physical files to track obligations across multiple life domains. No competitor combines home chores + car maintenance + insurance management + electronics/warranty tracking + kids activity planning in one place with an AI chatbot that understands your specific household's documents.

The core v1 proposition is: set up your household once, activate the modules you need, and get a personalised dashboard that becomes the single source of truth for everything your family owns, owes, and needs to do. The AI chatbot differentiator — powered by RAG over your uploaded insurance policies and product manuals — lets you ask "what do I do if my boiler leaks?" and get an answer from your actual policy, not a generic LLM response. The chatbot can also turn a document procedure into an actionable task checklist.

The recommended architecture is Supabase-native: PostgreSQL with RLS enforces multi-tenant isolation, pgvector handles RAG embeddings (no extra service), Realtime provides live sync, and Storage handles document uploads. Next.js 15 (App Router + Server Actions) handles the full-stack layer, Drizzle ORM with native `pgPolicy` provides type-safe RLS-aware queries, and the Vercel AI SDK wraps Claude for chat and OpenAI's text-embedding-3-small for embeddings. All async work (document embedding, reminder scheduling) runs via Inngest.

The two most critical v1 constraints: RLS and EU data residency must be locked in during Phase 1 — they cannot be retrofitted. The most critical v1 AI constraint: the chatbot must use tool-calling for all factual queries about household data — never LLM recall.

Receipt scanning, bank integrations, and spending dashboards are deliberately deferred to v2 to validate core tracking value first.

---

## Recommended Stack

Next.js 15 (App Router) + TypeScript 5, deployed on Vercel. Supabase provides Postgres, Auth, Realtime, Storage, and pgvector as a single managed platform — EU region mandatory from day one. Drizzle ORM with native `pgPolicy` for RLS. Claude (claude-sonnet-4-6) via Vercel AI SDK for chat. OpenAI text-embedding-3-small for document embeddings. Inngest for all async work. Tailwind CSS 4 + shadcn/ui.

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| BaaS / DB | Supabase (PostgreSQL, EU region) | latest |
| Auth | Supabase Auth via @supabase/ssr | 0.9.0+ |
| ORM | Drizzle ORM (with pgPolicy for RLS) | 0.36+ |
| Vector store | Supabase pgvector (built-in) | — |
| Chat LLM | Anthropic Claude | claude-sonnet-4-6 |
| AI SDK | Vercel AI SDK | 4.x |
| Embeddings | OpenAI text-embedding-3-small | latest |
| Async jobs | Inngest | latest |
| CSS | Tailwind CSS | 4.x |
| Components | shadcn/ui (Radix) | latest |
| Forms | React Hook Form + Zod | RHF 7.x, Zod 3.x |
| Email | Resend | latest |
| Monitoring | Sentry + PostHog | latest |

**Do not use:** Prisma, Firebase, Redux, LangChain, separate vector databases (pgvector covers it), pg_cron for job scheduling (Inngest covers it), @supabase/auth-helpers-nextjs (deprecated).

**v2 additions:** Sharp (image preprocessing for OCR), TrueLayer/Plaid (open banking).

---

## The 5 Modules

| Module | Core Data | Key Feature |
|--------|-----------|-------------|
| **Home Chores** | Tasks, recurring chores, categories | Assignment + due date reminders |
| **Car Maintenance** | Cars, service history, key dates | Multiple cars; MOT/tax/service reminders |
| **Insurance Management** | Policies, PDF documents, premium costs | Expiry/payment reminders; chatbot queries uploaded policies |
| **Electronics Management** | Items, warranties, user manuals (PDF) | Warranty expiry reminders; chatbot answers manual questions |
| **Kids Activities** | Children profiles, activities, calendar | Per-activity reminders; unified calendar view |

**Onboarding:** User selects household type (couple / family / flatmates / single) + activates modules. Dashboard is generated from selections. Modules can be toggled in settings.

---

## Key Architecture Decisions

**Multi-tenant isolation via RLS.** Every table is scoped by `household_id`. Drizzle `pgPolicy` inline with schema definitions enforces household data isolation at the database layer. `household_members` is the single source of truth for membership. Must be in place from Phase 1 — not safely retrofittable.

**Admin model.** `household_members.role` is `admin` (creator) or `member` (invited). Admin controls membership management only (invite, remove members). All content access is fully equal across both roles.

**Async document processing via Inngest.** Document uploads return immediately with `status: "processing"`. Inngest worker handles PDF text extraction → chunking → OpenAI embedding → pgvector storage. User notified via Realtime when document is ready for chatbot queries.

**RAG over uploaded documents.** Documents embedded once at upload; queried many times via pgvector similarity search. Cost profile: one-time embedding (~$0.001/document) + per-query Claude call (only triggered by user questions). No per-page-load AI costs.

**Tool-calling for factual queries.** Chatbot uses Vercel AI SDK tool-calling for all queries about live household data (upcoming reminders, expiry dates, task status). The LLM never recalls facts from memory — always from SQL queries.

**Module-aware reminders.** Inngest reminder jobs check `household_settings.active_modules` before firing. Disabled module → reminder skipped. Re-enabled module → reminder resumes.

**Activity feed as append-only event log.** All significant mutations append to `activity_feed`. Never modified. Drives "who did what" UI.

---

## Data Model Summary

```
Core:
  households, household_members (role: admin|member), household_settings (active_modules[]),
  household_invites, activity_feed

Chores:
  tasks (RRULE recurrence, due_date, assigned_to)

Kids:
  children (name, dob — no accounts), kids_activities (child_id, RRULE, responsible_parent_id)

Cars:
  cars (multiple per household), car_service_records (cost optional),
  car_key_dates (mot|tax|service — reminder_days_before)

Insurance:
  insurance_policies (type, expiry_date, renewal_contact), insurance_documents (PDF storage),
  insurance_costs (payment_schedule, next_payment_date)

Electronics:
  electronics_items (model_number, cost optional), electronics_documents (warranty|manual PDFs),
  warranties (expiry_date)

AI/RAG:
  document_embeddings (vector(1536), source_document_id, household_id),
  chat_messages (tool_calls jsonb)
```

**Key schema decisions:**
- `household_members.role` column exists (admin for creator; member for invited) — role controls membership management only
- `household_settings.active_modules` is `text[]` — drives dashboard rendering and reminder job activation
- `children` table has no `user_id` — children have profiles, not accounts
- `household_invites.email` is nullable — null for shareable link invites
- All cost fields (`car_service_records.cost`, `electronics_items.cost`, `insurance_costs.annual_premium`) are `numeric`, nullable
- `document_embeddings.source_document_type` disambiguates whether `source_document_id` points to `insurance_documents` or `electronics_documents`

---

## Watch Out For

These are the pitfalls most likely to break the product. Full detail in PITFALLS.md.

### 1. Multi-Tenant Data Isolation Bug (Critical — GDPR)
Missing `household_id` filter or RLS policy error exposes one family's data to another.
**Required:** RLS on every table from Phase 1. Integration tests that explicitly attempt cross-household access. Never add RLS retroactively.

### 2. GDPR Data Residency Violation (Critical — legal)
Family data stored on US-region servers violates GDPR.
**Required:** EU region chosen at Supabase project creation. Already decided. Cannot migrate later.

### 3. LLM Hallucination on Household Data (Critical)
Chatbot generates plausible-sounding insurance expiry date rather than querying the database.
**Required:** All factual queries use tool-calling. Never allow LLM to recall household facts from memory.

### 4. RAG Document Quality (Critical for Phase 5)
Scanned or low-quality PDFs produce garbled embeddings → chatbot gives confidently wrong answers.
**Required:** PDF quality detection. Fallback for scanned PDFs. Source attribution in every chatbot response.

### 5. LLM Cost Spiralling (Critical — business viability)
Uncontrolled Claude API calls at scale destroy unit economics.
**Required:** RAG is the right architecture (embed once, query cheaply). Tag every API call. Set per-household budgets.

**Additional pitfalls:** Household invite race condition (use atomic token claim), module stale state (check active_modules before firing reminders), WebSocket reconnection on mobile, push notification permission fatigue.

---

## Build Order (v1)

| Phase | Focus | Critical Constraints |
|-------|-------|---------------------|
| **Phase 1** | Foundation & Onboarding | RLS on all tables; EU region; @supabase/ssr getUser(); atomic invite claim |
| **Phase 2** | Home Chores | First Inngest worker; notification permission ask UX; idempotent task completion |
| **Phase 3** | Kids Activities | Reuse Phase 2 notification pattern; child profiles (no accounts) |
| **Phase 4** | Tracker Modules & Calendar | PDF upload to Storage; module-aware reminders; date-range indexed calendar queries |
| **Phase 5** | AI Chatbot & RAG | Tool-calling for live data; RAG for documents; PDF quality detection; cost tagging |
| **Phase 6** | Platform & Polish | Mobile PWA; camera access prep; E2E tests |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (core) | HIGH | Verified against npm registry and official docs (Phase 1 research, 2026-03-24) |
| Auth patterns | HIGH | @supabase/ssr 0.9 verified against official Supabase SSR docs |
| Drizzle RLS (pgPolicy) | HIGH | Verified against official Drizzle docs |
| Supabase Realtime RLS | HIGH | Verified against Supabase Realtime Authorization docs |
| RAG architecture | HIGH | pgvector + OpenAI embeddings pattern well-established |
| PDF parsing approach | MEDIUM | pdf-parse is standard; verify scanned PDF handling at Phase 5 |
| Competitive analysis | MEDIUM | Training knowledge (Aug 2025); re-verify with live research before v2 roadmap |

---

*Last updated: 2026-03-24*
*Replaces summary from 2026-03-19 — full concept revision*
