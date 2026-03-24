# Household Management App

## What This Is

A modular family command centre — you set up your household once, pick the modules you need, and get a personalised dashboard. Each module tracks a specific domain of family life. An AI chatbot runs across all modules, answers questions using your uploaded documents, and can turn document procedures into actionable tasks. Web-first, with iOS/Android to follow in v2.

## Core Value

One place for families to track everything they own, owe, and need to do — with an AI chatbot that answers questions and turns documents into actionable tasks.

## The 5 Modules

| Module | What it tracks |
|--------|---------------|
| **Home Chores** | Tasks, recurring chores, assignments, due date reminders |
| **Car Maintenance** | Multiple cars, service history, MOT/tax/service key date reminders, costs |
| **Insurance Management** | Policies, uploaded PDFs, premium schedules, expiry reminders, renewal contacts |
| **Electronics Management** | Appliance registry, warranties, user manuals (PDF), warranty expiry reminders |
| **Kids Activities** | Child profiles (no accounts), activities, calendar, reminders per responsible parent |

## Onboarding Model

At setup, the user:
1. Selects **household type**: couple / family with kids / flatmates / single-living
2. **Activates modules** (multi-select from the 5 above)
3. Lands on a **personalised dashboard** built from their selections

Modules can be added or removed from settings at any time.

## Household Model

- The user who creates the household becomes the **admin**
- Admin invites other members by email or shareable link
- Invited members create an account and join the household
- Admin can remove members
- All members have **equal access to content** across all modules
- Children are tracked as **named profiles** (no accounts) — managed by parents

## AI Model

A single chatbot accessible from any section:
- **RAG-powered**: queries uploaded documents (pgvector similarity search) before answering — no hallucinated policy details or manual instructions
- **Document → tasks**: extracts step-by-step procedures from insurance/warranty documents and offers to create the steps as tasks in a chosen section
- **Live data queries**: answers questions about household state (upcoming reminders, warranty expiries, task status)
- **Async processing**: documents are embedded in the background (Inngest); user is notified when ready
- **Conversation history**: persisted per household

## What's Not in v1

- Receipt OCR / scanning → v2
- Bank / Revolut integrations → v2
- Spending dashboards from transactions → v2
- Model number → auto-fetch user manuals → v2 (Phase 1 = manual PDF upload)
- Ambient AI dashboard cards → v2
- Native mobile apps → v2

## Constraints

- **GDPR**: All data stored in EU infrastructure from day one. Cannot migrate regions later without data movement.
- **RLS from day one**: Row-Level Security on every Supabase table from Phase 1. Not safely retrofittable.
- **AI async**: Claude P99 latency (10–30s) exceeds Vercel's default timeout. All AI processing via Inngest workers.
- **RAG cost control**: Documents embedded once on upload (OpenAI `text-embedding-3-small`), queried via pgvector. Avoids per-question full-document API calls.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Modular onboarding | Different households have different needs; a family with 3 kids and 2 cars doesn't need to see the same dashboard as a single person renting |
| Children as profiles, not accounts | Parents plan kids' activities; children don't need app access in v1 |
| Single admin role only | Admin manages household membership; all content access is fully equal |
| RAG via pgvector (Supabase built-in) | No extra service needed; embeddings stored alongside data; cost-effective for static documents |
| Defer receipt OCR and bank sync | Validates core tracking value before adding complexity; OCR + open banking require significant infrastructure and cost |
| Unified calendar in Phase 4 | Calendar is only useful once multiple modules are populated; building it earlier would show an empty shell |
| Task creation from chatbot | The AI should reduce friction, not just answer questions — turning an insurance procedure into a checklist is the clearest demonstration of value |

## Stack

**Next.js 15** (App Router) + **TypeScript 5** + **Supabase** (Postgres, Auth, Realtime, Storage, pgvector) + **Drizzle ORM** + **Vercel AI SDK** + **Anthropic Claude** + **OpenAI embeddings** (text-embedding-3-small) + **Inngest** + **Tailwind CSS 4** + **shadcn/ui**

See `.planning/research/STACK.md` for full stack rationale and `.planning/research/ARCHITECTURE.md` for system architecture.

---

*Last updated: 2026-03-24 — full concept revision*
*Original project initialised: 2026-03-19*
