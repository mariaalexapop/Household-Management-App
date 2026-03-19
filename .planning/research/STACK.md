# Tech Stack

**Domain:** AI-powered household management web app
**Researched:** 2026-03-19
**Confidence:** HIGH for framework/BaaS choices; MEDIUM for open banking provider (depends on target geography)

---

## Recommended Stack

### Core Framework

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| Framework | **Next.js** | 15.x | HIGH | App Router + RSC for performance; API routes for backend; single repo; Vercel deployment; industry standard for full-stack TypeScript apps |
| Runtime | **React** | 19.x | HIGH | Ships with Next.js 15; concurrent features; useOptimistic for real-time UX |
| Language | **TypeScript** | 5.x | HIGH | Non-negotiable for multi-person household data models; catches category/type errors at compile time |
| Package manager | **pnpm** | 9.x | HIGH | Faster installs, strict dependency resolution, workspace support for future monorepo |

**What NOT to use:**
- Remix — smaller ecosystem, less mature deployment story than Next.js
- SvelteKit — excellent but smaller hiring pool; React ecosystem preferred for this feature set
- Create React App — deprecated

---

### Database & Backend-as-a-Service

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| BaaS | **Supabase** | latest | HIGH | Postgres + Auth + Realtime + Storage + Edge Functions in one platform. Replaces 4 separate services. Row-Level Security (RLS) is the correct primitive for multi-tenant household isolation. |
| Database | **PostgreSQL** (via Supabase) | 15+ | HIGH | ACID transactions critical for financial data; JSONB for flexible AI-parsed document data; pg_cron for scheduled reminders |
| ORM | **Drizzle ORM** | 0.30+ | HIGH | Type-safe SQL; better than Prisma for Supabase edge functions; migrations as code; excellent TypeScript inference |
| Auth | **Supabase Auth** | latest | HIGH | Email/password + OAuth out of the box; JWT-based; integrates with RLS automatically |

**What NOT to use:**
- Prisma — heavy for edge runtime; schema push workflow less predictable for financial schemas
- Firebase — NoSQL makes financial query patterns painful; Google vendor lock-in
- PlanetScale — MySQL doesn't support RLS; PostgreSQL superior for this use case
- MongoDB — schema flexibility is a liability for financial data, not an asset

---

### AI & LLM

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| LLM provider | **Anthropic Claude API** | claude-sonnet-4-6 | HIGH | Superior instruction following for structured data extraction (receipts, warranties); lower hallucination rate on financial queries vs. alternatives |
| AI SDK | **Vercel AI SDK** | 4.x | HIGH | Streaming responses; unified provider interface; tool-use/function-calling; React hooks (useChat, useCompletion); works seamlessly with Next.js |
| OCR | **Claude Vision** (primary) | claude-sonnet-4-6 | HIGH | Receipt + document parsing via multimodal API — avoids separate OCR service. Single API call: image → structured JSON |
| Image preprocessing | **Sharp** | 0.33+ | HIGH | Resize, normalise, convert images before sending to Claude Vision; reduces token costs; runs in Node.js/Edge |
| Embeddings (future) | **OpenAI text-embedding-3-small** OR Supabase pgvector | — | MEDIUM | For semantic search over household documents in v2; defer until needed |

**What NOT to use:**
- OpenAI GPT-4o as primary — Claude outperforms on structured extraction; Claude is already the session model
- Google Vision API — separate OCR service adds complexity; Claude Vision handles it
- Tesseract.js — client-side OCR; poor accuracy on receipts; no LLM parsing
- LangChain — heavy abstraction layer; Vercel AI SDK is sufficient and lighter

---

### Real-Time Sync

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Real-time | **Supabase Realtime** | HIGH | PostgreSQL change streams over WebSocket; no additional service; scales to household use case; integrates with RLS so users only receive their household's changes |
| Client subscription | Supabase JS client (`supabase.channel()`) | HIGH | Built into Supabase SDK; handles reconnection; presence for "online members" |

**What NOT to use:**
- Pusher — adds cost and complexity; Supabase Realtime covers the use case
- Socket.io — requires a separate stateful server; incompatible with serverless/edge
- Ably — redundant given Supabase

---

### File & Document Storage

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Storage | **Supabase Storage** | HIGH | S3-compatible; direct uploads from browser; signed URLs for secure access; RLS policies for household isolation; CDN built in |
| Image handling | Next.js Image Optimization + Sharp | HIGH | Resize receipt images before storage; reduce Claude Vision token costs |

---

### Open Banking

| Layer | Choice | Geography | Confidence | Rationale |
|-------|--------|-----------|-----------|-----------|
| Primary provider | **TrueLayer** | UK / EU | HIGH | PSD2-compliant; broad UK/EU bank coverage; webhook-based transaction sync; good DX |
| Secondary provider | **Plaid** | US / Canada | HIGH | Market standard in North America; if targeting US users |
| Fallback | Manual CSV import | All | HIGH | CSV import from bank statements as no-integration fallback; reduces provider dependency |

**Important:** Open banking requires FCA registration (UK) or equivalent. Defer full integration to a dedicated phase with regulatory review. Start with manual entry + OCR; add bank sync in a later phase.

**What NOT to use:**
- Salt Edge — less developer-friendly than TrueLayer for UK
- Yodlee — legacy; worse DX; higher cost

---

### UI & Styling

| Layer | Choice | Version | Confidence | Rationale |
|-------|--------|---------|-----------|-----------|
| CSS framework | **Tailwind CSS** | 4.x | HIGH | Utility-first; fast iteration; no runtime CSS; excellent with shadcn/ui |
| Component library | **shadcn/ui** | latest | HIGH | Copy-paste components; fully customisable; Radix UI primitives; accessible; TypeScript; integrates with Tailwind 4 |
| Icons | **Lucide React** | latest | HIGH | Ships with shadcn/ui; consistent icon set |
| Charts | **Recharts** | 2.x | HIGH | React-native charting for expense dashboards; good Tailwind integration |
| Date handling | **date-fns** | 3.x | HIGH | Tree-shakeable; no Moment.js baggage; excellent TypeScript types |
| Form management | **React Hook Form** + **Zod** | RHF 7.x, Zod 3.x | HIGH | Type-safe forms; Zod schema validation shared between client and server |

**What NOT to use:**
- Material UI — heavy bundle; design language fights custom branding
- Ant Design — React 19 compatibility lags; heavy
- Moment.js — deprecated; bloated
- Formik — slower than React Hook Form; less TypeScript-friendly

---

### State Management

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Server state | **React Server Components** (Next.js 15) | HIGH | Fetch data server-side by default; reduces client bundle; no useEffect data fetching |
| Client state | **Zustand** | HIGH | Minimal; TypeScript-friendly; for UI state (chat window open, selected household member filters) |
| Optimistic updates | **React `useOptimistic`** | HIGH | Native React 19 primitive; for task completion, expense creation — instant UI feedback |
| Server mutations | **Next.js Server Actions** | HIGH | Type-safe form submissions; pairs with useOptimistic for real-time feel |

**What NOT to use:**
- Redux — massively over-engineered for this use case
- React Query / TanStack Query — redundant when using RSC + Server Actions + Supabase Realtime
- Recoil / Jotai — unnecessary complexity; Zustand is sufficient

---

### Notifications

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Push notifications | **Web Push API** (browser) | HIGH | No app store; works on mobile web (Chrome/Edge/Firefox/Safari 16.4+); Supabase Edge Functions for server-side push |
| In-app notifications | Supabase Realtime + UI toast | HIGH | Real-time notification delivery; shadcn/ui Sonner for toast display |
| Scheduled triggers | **pg_cron** (PostgreSQL) | HIGH | Cron jobs in Postgres; triggers bill reminders, maintenance reminders; no separate job queue needed at v1 scale |
| Email notifications | **Resend** | HIGH | Developer-friendly; React Email for templates; generous free tier |

**What NOT to use:**
- OneSignal — external dependency; Web Push API is sufficient for web-first
- Bull/BullMQ — Redis-based job queue; pg_cron covers v1 needs; introduce if volume demands it

---

### Background Processing

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| AI processing jobs | **Supabase Edge Functions** | HIGH | Serverless; runs close to database; handles OCR pipeline (receive image → call Claude → write structured data) |
| Scheduled jobs | **pg_cron** | HIGH | Bill reminder checks, maintenance due checks, spend anomaly detection run as scheduled Postgres functions |
| Webhook handling | Next.js API routes | HIGH | TrueLayer/Plaid transaction webhooks; simple enough for API routes at v1 |

---

### Testing

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Unit/integration | **Vitest** | HIGH | Fast; native TypeScript; ESM-compatible; replaces Jest |
| Component testing | **React Testing Library** | HIGH | Behaviour-driven component tests |
| E2E | **Playwright** | HIGH | Cross-browser; mobile viewport testing critical for OCR flows; good CI integration |
| API mocking | **MSW** (Mock Service Worker) | HIGH | Intercept network requests in tests; mock Claude API responses |

---

### Deployment & Infrastructure

| Layer | Choice | Confidence | Rationale |
|-------|--------|-----------|-----------|
| Hosting | **Vercel** | HIGH | Zero-config Next.js deployment; Edge Network; preview URLs per PR; generous free tier |
| Database | **Supabase** (managed) | HIGH | Fully managed Postgres; automatic backups; point-in-time recovery (critical for financial data) |
| CI/CD | **GitHub Actions** | HIGH | Standard; Vercel and Supabase both have official Actions |
| Monitoring | **Sentry** | HIGH | Error tracking; performance monitoring; source map support for Next.js |
| Analytics | **PostHog** | HIGH | Product analytics; session recording; feature flags; self-hostable; GDPR-friendly |

---

## Version Summary (install reference)

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "drizzle-orm": "^0.30.0",
  "drizzle-kit": "^0.20.0",
  "@anthropic-ai/sdk": "^0.36.0",
  "ai": "^4.0.0",
  "sharp": "^0.33.0",
  "tailwindcss": "^4.0.0",
  "@radix-ui/react-*": "latest (via shadcn)",
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

---

## Architecture Alignment

This stack is designed for:
1. **Supabase-native multi-tenancy** — RLS policies enforce household data isolation at the database level
2. **AI-first pipeline** — Claude handles both OCR and LLM in one API, reducing provider count
3. **Edge-ready** — Next.js App Router + Supabase Edge Functions; no long-running servers needed
4. **Mobile-first web** — PWA patterns + Web Push; no App Store needed for v1
5. **Future mobile expansion** — React Native / Expo can reuse Supabase SDK, Zod schemas, and API layer when native apps are built

---

## Sources

- Next.js 15 release notes (fetched during research)
- Supabase documentation (knowledge cutoff August 2025)
- Vercel AI SDK documentation (knowledge cutoff August 2025)
- Industry patterns from comparable SaaS products as of knowledge cutoff
