# Tech Stack

**Domain:** Family household command centre with AI chatbot and RAG
**Researched:** 2026-03-19
**Last updated:** 2026-03-24 — revised to reflect new concept (5 modules, RAG v1, OCR/banking v2)
**Confidence:** HIGH for framework/BaaS/RAG choices; v2 items noted explicitly

---

## Recommended Stack

### Core Framework

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| Framework | **Next.js** | 15.x | HIGH | App Router + RSC for performance; API routes for backend; single repo; Vercel deployment; industry standard for full-stack TypeScript apps |
| Runtime | **React** | 19.x | HIGH | Ships with Next.js 15; concurrent features; useOptimistic for real-time UX |
| Language | **TypeScript** | 5.x | HIGH | Non-negotiable for multi-domain household data models; catches type errors at compile time |
| Package manager | **pnpm** | 9.x | HIGH | Faster installs, strict dependency resolution, workspace support for future monorepo |

**What NOT to use:**
- Remix — smaller ecosystem, less mature deployment story than Next.js
- SvelteKit — excellent but smaller hiring pool; React ecosystem preferred
- Create React App — deprecated

---

### Database & Backend-as-a-Service

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| BaaS | **Supabase** | latest | HIGH | Postgres + Auth + Realtime + Storage + pgvector in one platform. Replaces 4 separate services. RLS is the correct primitive for multi-tenant household isolation. |
| Database | **PostgreSQL** (via Supabase) | 15+ | HIGH | ACID transactions; JSONB for flexible AI-extracted metadata; native pgvector for RAG embeddings |
| Vector extension | **pgvector** (via Supabase) | latest | HIGH | Supabase ships pgvector built-in; no extra service needed for RAG embedding storage and similarity search |
| ORM | **Drizzle ORM** | 0.36+ | HIGH | Type-safe SQL; native RLS policy support (`pgPolicy` inline with schema); migrations as code; excellent TypeScript inference |
| Auth | **Supabase Auth** (via `@supabase/ssr`) | 0.9.0+ | HIGH | Email/password + OAuth out of the box; JWT-based; integrates with RLS automatically. **Use `@supabase/ssr` not deprecated `auth-helpers-nextjs`** |

**Critical auth note:** Always use `getUser()` (validates JWT server-side), never `getSession()` in server contexts — `getSession()` is a security gap.

**What NOT to use:**
- Prisma — heavy for edge runtime; RLS integration less clean than Drizzle's native `pgPolicy`
- Firebase — NoSQL makes relational household queries painful; no RLS equivalent
- PlanetScale — MySQL doesn't support RLS; PostgreSQL superior
- Separate vector databases (Pinecone, Weaviate) — pgvector is built into Supabase, no extra service needed

---

### AI & LLM

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| LLM provider | **Anthropic Claude API** | claude-sonnet-4-6 | HIGH | Superior instruction following; strong for structured extraction and conversation; lower hallucination on household data queries |
| AI SDK | **Vercel AI SDK** | 4.x | HIGH | Streaming responses; unified provider interface; tool-use/function-calling; React hooks (useChat); works seamlessly with Next.js |
| Embeddings | **Voyage AI `voyage-3-lite`** | latest | HIGH | Anthropic's official recommended embeddings partner; optimised for retrieval with Claude; ~$0.02/1M tokens; 512 dimensions; documents embedded once at upload, queried many times via pgvector; keeps stack in one ecosystem (no OpenAI account needed) |
| RAG store | **Supabase pgvector** | built-in | HIGH | Embeddings stored alongside data in Postgres; similarity search with RLS-scoped queries; no extra service |

**v2 only (not in MVP):**
- Claude Vision for OCR — receipt scanning and document OCR deferred to Phase 2
- Sharp for image preprocessing — deferred with OCR to Phase 2

**What NOT to use:**
- LangChain — heavy abstraction layer; Vercel AI SDK is sufficient and lighter
- Separate vector databases (Pinecone, Weaviate) — pgvector covers the use case
- OpenAI for embeddings — Voyage AI is Anthropic's recommended partner and keeps the stack in one ecosystem
- OpenAI GPT-4o as primary LLM — Claude is already the session model and excels at structured extraction

---

### RAG Architecture

The RAG pipeline for Phase 5 (AI Chatbot & RAG):

```
Upload PDF (insurance policy / user manual / warranty doc)
  → API creates document record + enqueues Inngest job
  → Inngest worker:
      a. Fetch PDF from Supabase Storage
      b. Extract text (pdf-parse or pdf2pic + Claude for scanned PDFs)
      c. Chunk text (~512-token chunks, 50-token overlap)
      d. Embed each chunk via Voyage AI voyage-3-lite (512 dimensions)
      e. Store embeddings in pgvector with metadata (household_id, document_id, module_type)
  → User notified: "Document ready for questions"

Chatbot query:
  → Embed user question via Voyage AI voyage-3-lite
  → pgvector similarity search (cosine distance, top-k=5, scoped by household_id)
  → Retrieved chunks + question → Claude (claude-sonnet-4-6)
  → Stream response to user
```

Cost profile: document embedding is a one-time cost (~$0.001/document); queries cost only the final Claude call, not re-reading the full document.

**Why Voyage AI over OpenAI embeddings:**
- Anthropic's official recommended embeddings partner for Claude-based RAG
- Retrieval quality optimised specifically for use with Claude as the generation model
- Same price tier as OpenAI text-embedding-3-small (~$0.02/1M tokens)
- Keeps the AI stack in one ecosystem — no OpenAI account required
- Upgrade path: `voyage-3` (1024 dimensions) for higher retrieval quality if needed

---

### Real-Time Sync

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Real-time | **Supabase Realtime** | HIGH | PostgreSQL change streams over WebSocket; no additional service; RLS-aware (users only receive their household's changes — verified against official Supabase Realtime Authorization docs) |
| Client subscription | Supabase JS client (`supabase.channel()`) | HIGH | Built into Supabase SDK; handles reconnection; presence for "online members" |

**Important:** Tables must be explicitly added to the `supabase_realtime` publication or events will never fire (common silent failure). Verify per table during Phase 1.

---

### File & Document Storage

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Storage | **Supabase Storage** | HIGH | S3-compatible; direct browser uploads via signed URLs; RLS policies for household isolation; CDN built in |
| PDF processing | **pdf-parse** (text PDFs) + **pdf2pic** (scanned PDFs) | MEDIUM | Phase 5 dependency — verify during RAG implementation |

---

### Background Processing

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Primary async worker | **Inngest** | HIGH | Serverless-compatible (no Redis); step functions for multi-step AI jobs; delayed scheduling for warranty/insurance reminders; managed observability; native Next.js integration |
| Scheduled reminders | **Inngest** (delayed steps + scheduled functions) | HIGH | Reminder jobs (warranty expiry, insurance renewal, MOT due, kids activities) use Inngest `step.sleep` or scheduled functions — not pg_cron |

**Note:** Previous research mentioned pg_cron and Supabase Edge Functions as the background processing approach. The project has standardised on **Inngest for all async and scheduled work** (documented in PROJECT.md). Do not use pg_cron or Supabase Edge Functions for job processing.

**What NOT to use:**
- pg_cron — requires Postgres-level access for job management; Inngest provides better observability and step retries
- BullMQ — Redis-based; incompatible with serverless
- Supabase Edge Functions as primary worker — less observability than Inngest; use for lightweight Supabase-native tasks only

---

### UI & Styling

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| CSS framework | **Tailwind CSS** | 4.x | HIGH | CSS-first paradigm (no tailwind.config.ts — theme lives in `globals.css` under `@theme inline {}`); `tw-animate-css` replaces `tailwindcss-animate` |
| Component library | **shadcn/ui** | latest | HIGH | Fully migrated to Tailwind v4; `npx shadcn@latest init` handles v4 setup; copy-paste components; Radix UI primitives; accessible |
| Icons | **Lucide React** | latest | HIGH | Ships with shadcn/ui |
| Charts | **Recharts** | 2.x | HIGH | For costs dashboard; React-native; good Tailwind integration |
| Date handling | **date-fns** | 3.x | HIGH | Tree-shakeable; excellent TypeScript types; handles RRULE recurrence calculations |
| Calendar UI | **react-big-calendar** or shadcn-style custom | MEDIUM | For unified calendar (Phase 4) — evaluate at implementation time |
| Form management | **React Hook Form** + **Zod** | RHF 7.x, Zod 3.x | HIGH | Type-safe forms; Zod schemas shared between client and server |

---

### State Management

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Server state | **React Server Components** (Next.js 15) | HIGH | Fetch data server-side by default; reduces client bundle |
| Client state | **Zustand** | HIGH | Minimal; TypeScript-friendly; for UI state (active module, sidebar open, chat window) |
| Optimistic updates | **React `useOptimistic`** | HIGH | Native React 19; for task completion, item creation — instant UI feedback |
| Server mutations | **Next.js Server Actions** | HIGH | Type-safe form submissions; pairs with useOptimistic |

---

### Notifications

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Push notifications | **Web Push API** (browser) | HIGH | No app store; works on mobile web (Chrome/Edge/Firefox/Safari 16.4+) |
| In-app notifications | Supabase Realtime + shadcn/ui Sonner | HIGH | Real-time toast delivery |
| Email notifications | **Resend** | HIGH | Developer-friendly; React Email templates; used for household invites + reminders |

---

### Testing

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Unit/integration | **Vitest** | HIGH | Fast; native TypeScript; ESM-compatible |
| Component testing | **React Testing Library** | HIGH | Behaviour-driven component tests |
| E2E | **Playwright** | HIGH | Cross-browser; mobile viewport testing |
| API mocking | **MSW** (Mock Service Worker) | HIGH | Mock Supabase and Claude API responses in tests |

---

### Deployment & Infrastructure

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Hosting | **Vercel** | HIGH | Zero-config Next.js; Edge Network; preview URLs per PR |
| Database | **Supabase** (EU region — mandatory) | HIGH | EU region chosen at project creation for GDPR compliance; cannot migrate later |
| CI/CD | **GitHub Actions** | HIGH | Vercel and Supabase both have official Actions |
| Monitoring | **Sentry** | HIGH | Error tracking; performance monitoring |
| Analytics | **PostHog** | HIGH | Product analytics; GDPR-friendly; session recording |

---

## Version Summary (install reference)

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@supabase/ssr": "^0.9.0",
  "drizzle-orm": "^0.36.0",
  "drizzle-kit": "^0.30.0",
  "ai": "^4.0.0",
  "@anthropic-ai/sdk": "latest",
  "voyageai": "^0.0.4",
  "inngest": "latest",
  "tailwindcss": "^4.0.0",
  "tw-animate-css": "latest",
  "lucide-react": "latest",
  "recharts": "^2.0.0",
  "date-fns": "^3.0.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "zustand": "^4.0.0",
  "resend": "^3.0.0",
  "vitest": "^1.0.0",
  "@playwright/test": "^1.40.0"
}
```

**v2 additions (not installed in MVP):**
```json
{
  "sharp": "^0.33.0"
}
```

---

## v2 Stack Additions

These are explicitly deferred and should NOT be added in v1:

| Addition | When | Reason for Deferral |
|----------|------|---------------------|
| Sharp (image processing) | v2 Phase 1 | Required for receipt OCR preprocessing; OCR is v2 |
| TrueLayer / Plaid | v2 Phase 2 | Open banking integration; regulatory complexity |
| pdf2pic / OCR pipeline | v2 Phase 1 | Receipt scanning is v2 |

---

## Sources

- Phase 1 research (01-RESEARCH.md, 2026-03-24) — verified current package versions via npm registry
- Supabase official docs — `@supabase/ssr`, pgvector, Realtime Authorization
- Drizzle ORM official docs — RLS (`pgPolicy`) patterns
- shadcn/ui official docs — Tailwind v4 migration
- Next.js official docs — App Router, Vitest setup
- Training knowledge (cutoff Aug 2025) — architecture patterns
