# Research Summary

**Project:** AI-powered household management app
**Synthesized:** 2026-03-19
**Source files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

This is a full-stack, AI-first household coordination product. No existing competitor combines financials, chores, maintenance, and warranties in one place — the market is fragmented across Splitwise, Cozi, Flatastic, and manual spreadsheets. The core differentiator is AI that reduces data-entry friction (receipt OCR, warranty scanning) and surfaces ambient intelligence (contextual reminders, chat assistant) without requiring users to navigate dashboards. The product is a web-first PWA targeting couples and flatmates who want a shared OS for their home.

The recommended approach is Supabase-native: PostgreSQL with row-level security (RLS) enforces multi-tenant isolation at the database layer, Supabase Realtime provides live sync across household members, and Supabase Storage handles document uploads — replacing four separate services with one. Next.js 15 (App Router + Server Actions) handles the full-stack layer, Drizzle ORM provides type-safe database access, and the Vercel AI SDK wraps Claude (Anthropic) for all LLM and OCR workloads. All AI pipelines run asynchronously via Inngest to avoid Vercel's 10-second timeout ceiling.

The key risk cluster is around the AI layer: OCR output must never be auto-saved without a user review step, the chat assistant must use tool-calling to query real database values (never hallucinate figures), and ambient AI card generation must be cached and batched — not triggered per page load. Data isolation (RLS) and GDPR data residency (EU Supabase region) must be locked in at Foundation phase and are not safely retrofittable.

---

## Recommended Stack

Next.js 15 (App Router) with TypeScript 5, deployed on Vercel. Supabase provides Postgres, Auth, Realtime, and Storage as a single managed platform — row-level security on every table enforces household data isolation. Claude (claude-sonnet-4-6) via Vercel AI SDK handles all LLM and OCR workloads; Inngest runs async AI jobs out of band from the HTTP request cycle. UI is Tailwind CSS 4 + shadcn/ui; forms use React Hook Form + Zod.

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| BaaS / DB | Supabase (PostgreSQL) | latest |
| ORM | Drizzle ORM | 0.30+ |
| AI SDK | Vercel AI SDK | 4.x |
| LLM / OCR | Anthropic Claude | claude-sonnet-4-6 |
| Async jobs | Inngest | latest |
| CSS | Tailwind CSS | 4.x |
| Components | shadcn/ui (Radix) | latest |
| Forms | React Hook Form + Zod | RHF 7.x, Zod 3.x |
| Open banking | TrueLayer (UK/EU) / Plaid (US) | — |
| Email | Resend | latest |
| Monitoring | Sentry + PostHog | latest |

**Do not use:** Prisma (heavy for edge), Firebase (NoSQL bad fit for financial data), Redux (over-engineered), LangChain (unnecessary abstraction), native iOS/Android app in v1.

---

## Table Stakes Features

Users expect these from any household management app. Missing any = churn in week one.

- Auth (email/password + OAuth) and user profiles
- Household creation with email/link-based member invite
- Shared task / chore list with assignment
- Recurring chores with frequency (daily / weekly / monthly / custom RRULE)
- Push and in-app reminders for tasks and bills
- Manual expense logging (amount, category, date, payer)
- Expense categories (must be DB-stored, not hardcoded enum — see pitfall #11)
- Household spending summary / dashboard
- Bill and subscription tracking with due-date reminders
- Activity feed (who did what)
- Real-time sync across household members (Supabase Realtime WebSocket)
- Mobile-responsive web with camera access (PWA, no app store)

---

## Key Differentiators

### AI-Powered (highest value, highest build cost)

| Feature | Differentiator Value | Confidence |
|---------|---------------------|------------|
| Receipt OCR + AI parsing | Eliminates #1 manual entry friction; no competitor has this | HIGH |
| Chat assistant (NL queries over household data) | "How much on food last month?" — no dashboard navigation | HIGH |
| Ambient AI dashboard cards | Passive contextual prompts without user action | HIGH |
| Warranty document scanning + expiry reminders | Huge pain point; warranties get lost; AI extraction is novel | HIGH |
| Proactive AI reminders (cross-linked data) | Warranty expiring → schedule a maintenance check | HIGH |
| Document intelligence (any document type) | Generalises receipt/warranty pipeline to arbitrary household docs | HIGH |
| Spend pattern anomaly alerts | "£120 over usual grocery spend" — requires 30+ day baseline | HIGH |
| Model number → user manual retrieval | HIGH value but HIGH feasibility risk — needs dedicated spike | MEDIUM |

### Non-AI Differentiators

| Feature | Differentiator Value |
|---------|---------------------|
| Bank / card sync (open banking) | Eliminates manual entry entirely; strong vs. Flatastic/OurHome |
| Maintenance scheduling with full history | Combined with AI cross-linking is unique |
| Full equality multi-user model (no admin/member roles) | Deliberate UX choice for couples/flatmates |
| Unified household OS | The integration is the differentiator — no single competitor covers all domains |

### Explicitly Deferred to v2+

Expense settlement / debt tracking, native iOS/Android apps, role-based permissions, grocery list with retailer integration, gamification, multi-household support per user, budget forecasting, smart home integrations.

---

## Architecture Highlights

**Multi-tenant isolation via RLS.** Every table is scoped by `household_id`. Supabase row-level security policies enforce that users can only access data belonging to households they are a member of. `household_members` is the single source of truth for membership. This must be in place from day one — retrofitting RLS is extremely dangerous with live financial data.

**Async AI pipeline.** All AI workloads (OCR, suggestion generation, bank sync) run in Inngest background jobs, not in HTTP request handlers. Write operations that trigger AI return `{ status: "processing" }` immediately; results arrive via Supabase Realtime WebSocket push. This is mandatory because Claude P99 latency (10-30s) exceeds Vercel's default 10s timeout.

**Direct file uploads.** Receipt and document images upload directly from the browser to Supabase Storage via presigned PUT URL — the file never transits the API server. The API only creates a pending document record and enqueues the OCR job.

**Household context injection for LLM.** All Claude prompts receive an aggregated context snapshot from a `HouseholdContextBuilder`, never raw table rows. This controls token cost and prevents context window overflow as household data grows.

**Chat assistant uses tool-calling.** Financial queries must never rely on LLM memory. The chat assistant uses Vercel AI SDK tool-use to query the database and include actual results in the LLM's context before generating a response. This is the single most important AI safety constraint in the system.

**Activity feed as append-only event log.** All significant mutations append to `activity_feed` — never modified, only appended. Drives both the "who did what" UI and structured input for AI suggestion generation.

**Data model key decisions:**
- `expense_categories` stored as a DB table (not enum) with household-level customisation
- `tasks` use RRULE strings for recurrence — not a custom recurrence schema
- `documents` table tracks processing status (pending / processing / complete / failed) for async OCR
- `banking_connections` store tokens encrypted with AES-256-GCM at the application layer, not plaintext in DB
- No `role` column on `household_members` in v1 — full equality model

---

## Watch Out For

These are the top pitfalls that can break the product or destroy user trust. Each has a required prevention action.

### 1. OCR Output Auto-Saved Without Review (Critical)
AI extracts £10.00 from a receipt; actual amount was £100.00. App silently writes wrong financial data. Trust destroyed after one incident.
**Required:** Always show a confirmation screen after OCR parsing. Never auto-save parsed financial data. Highlight low-confidence fields.

### 2. LLM Hallucination on Financial Queries (Critical)
Chat assistant generates a plausible-sounding spend figure rather than querying the database. User makes decisions on wrong numbers.
**Required:** Chat assistant must use tool-calling / function-calling for all financial queries. Never allow the LLM to recall financial figures from "memory."

### 3. Multi-Tenant Data Isolation Bug (Critical — GDPR)
A missing `household_id` filter or RLS policy error exposes Household A's data to Household B. Financial data breach. Immediate shutdown risk.
**Required:** RLS enabled on every table from day one. Integration tests that explicitly attempt cross-household access and assert rejection. Never add RLS retroactively.

### 4. LLM Cost Spiralling (Critical — business viability)
Ambient AI cards computed per page load = thousands of Claude API calls per day before launch. Costs exceed revenue.
**Required:** Cache AI suggestions aggressively. Regenerate on data change, not on page load. Use pg_cron for batch generation. Tag every Claude API call with feature name and monitor cost per feature.

### 5. GDPR Data Residency for Financial Data (Critical — legal)
Bank transaction data stored on US-region servers violates GDPR/TrueLayer requirements for EU users.
**Required:** Choose EU region in Supabase at project creation (cannot migrate later without data movement). Verify Vercel DPAs. Implement right-to-erasure from day one.

**Additional pitfalls to design around:**
- Open banking re-auth UX failure (PSD2 forces 90-day re-authentication — must surface clearly in UI)
- OCR latency on mobile (show pending state immediately; never block UI on Claude response)
- Push notification permission fatigue (never ask on first load; earn it by showing value first)
- Warranty OCR is harder than receipt OCR (PDFs, multi-page, legal boilerplate — treat as separate pipeline)
- Category taxonomy lock-in (store as DB table from day one, not hardcoded enum)

---

## Build Order

Phases are sequenced by architectural dependency. Each phase unlocks the next.

### Phase 1: Foundation
**Auth + Household Core + RLS**
Supabase project (EU region), Auth, `households` + `household_members` tables, RLS policies on all tables, invite flow, Realtime subscription skeleton.
UNLOCKS: everything — all subsequent phases depend on household isolation being correct.
MUST DO: cross-tenant access tests, EU data residency, activity feed schema designed for groupability.
Research needed: No — standard Supabase patterns.

### Phase 2: Chores + Tasks
**Task CRUD, recurring schedules, notification infrastructure**
Task CRUD with RRULE recurrence, first Inngest worker job (reminder notifications), Web Push permission ask (after user adds first chore, not on signup).
UNLOCKS: proves the Realtime + Inngest stack before AI complexity is added.
MUST DO: idempotent task completion, permission-ask UX, reconnection handling for Realtime on mobile.
Research needed: No — standard patterns.

### Phase 3: Financials Core
**Manual expenses, bills, categories, dashboard**
Expenses table (manual entry), DB-stored category taxonomy with household customisation, bill tracking with due-date reminders, spending summary dashboard.
UNLOCKS: financial foundation that AI augments in Phase 4. Spend anomaly detection requires 30+ days baseline from this data.
MUST DO: categories as DB table (not enum), optimistic locking for concurrent edits.
Research needed: No — standard patterns.

### Phase 4: AI Layer 1 — Document Intelligence
**Receipt OCR, warranty scanning, document pipeline**
Supabase Storage setup, presigned upload flow, Inngest OCR worker, Claude Vision extraction, review-before-save confirmation screen, warranties table, warranty expiry reminders.
DEPENDS ON: Phases 1-3 (RLS, Inngest, expenses table, notification infra).
UNLOCKS: primary AI differentiator; reusable document pipeline for Phase 6.
MUST DO: async pipeline (never sync), review screen (never auto-save), cost tagging on all Claude calls, PDF-to-image conversion for warranty docs, separate pipeline from receipt OCR.
Research needed: YES — OCR prompt engineering, confidence scoring approach, cost benchmarking.

### Phase 5: AI Layer 2 — Chat + Ambient Intelligence
**Chat assistant, ambient dashboard cards, spend alerts**
Streaming chat API with tool-calling for financial queries, `ai_suggestions` table, pg_cron batch generation for ambient cards, spend anomaly detection.
DEPENDS ON: all prior phases (needs full data model for meaningful context, 30+ days financial data for anomaly baseline).
MUST DO: tool-use for all financial queries (no LLM recall), suggestion caching (never per-page-load), cost-per-household budgeting and throttling.
Research needed: YES — LLM context window design, tool-use schema, anomaly detection approach.

### Phase 6: Open Banking
**Bank/card sync via TrueLayer (UK/EU) or Plaid (US)**
Banking OAuth flow, webhook receiver, Inngest bank sync worker, transaction deduplication, re-auth health indicator UI.
DEPENDS ON: Phase 3 (expenses), Phase 1 (Inngest).
NOTE: requires provider account, FCA/regulatory review, and cost modelling before starting. Validate demand via OCR first.
MUST DO: re-auth expiry handling, health indicator UI, push notification on auth failure, AES-256-GCM token encryption.
Research needed: YES — provider selection (geography), regulatory requirements, cost modelling.

### Phase 7: Maintenance + Warranties
**Appliance registry, maintenance scheduling, AI cross-linking**
Full warranty → maintenance → reminder chain, model number lookup feasibility spike, AI cross-linking of warranty expiry to maintenance schedule.
DEPENDS ON: Phase 4 (warranty document pipeline already built).
MUST DO: feasibility spike for model number → manual retrieval before committing to full implementation.
Research needed: YES — manual retrieval feasibility, search API options (Bing/Brave).

### Phase 8: Polish + Mobile Readiness
**PWA, push notification polish, performance audit**
PWA manifest, camera UX polish for OCR, Sentry performance monitoring, Playwright mobile viewport E2E, notification bundling ("3 things due tomorrow").
DEPENDS ON: all prior phases.
Research needed: No — standard patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major choices are industry-standard, well-documented as of Aug 2025 |
| Features | HIGH (categorisation), MEDIUM (competitive analysis) | Competitive analysis from training knowledge — re-verify live sources before roadmap finalisation |
| Architecture | HIGH (patterns), MEDIUM (specific service APIs) | Supabase Realtime RLS behaviour, Inngest step API, TrueLayer webhook format must be verified against current docs before implementation |
| Pitfalls | HIGH | Pitfalls derived from product structure and established patterns; not dependent on live sources |

**Gaps requiring attention during planning:**
- Competitive feature claims should be re-verified with live product research (WebSearch was unavailable during research)
- Inngest delayed step API should be verified before committing reminder scheduling design
- Claude Vision OCR cost/accuracy on receipts should be benchmarked against real samples before AI Layer 1 phase begins
- Model number → user manual retrieval feasibility requires a dedicated spike (do not estimate before research)
- Open banking regulatory requirements (FCA registration) need legal review before Phase 6 begins

---

## Sources

- STACK.md: Next.js 15 release notes, Supabase documentation, Vercel AI SDK documentation (training knowledge, cutoff Aug 2025)
- FEATURES.md: Competitor feature analysis (Flatastic, OurHome, Cozi, Splitwise, Centriq — training knowledge, cutoff Aug 2025). WebSearch unavailable during research.
- ARCHITECTURE.md: Training knowledge (cutoff Aug 2025). WebSearch unavailable. All external service implementation details must be verified against current official documentation.
- PITFALLS.md: Product structure analysis and established industry patterns.
