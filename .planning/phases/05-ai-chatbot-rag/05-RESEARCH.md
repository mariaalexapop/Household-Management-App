# Phase 5: AI Chatbot & RAG - Research

**Researched:** 2026-04-11
**Domain:** Vercel AI SDK + Anthropic Claude streaming + tool use, pgvector RAG on Supabase, Drizzle ORM vector columns, Inngest async PDF pipeline, Next.js 15 App Router
**Confidence:** HIGH (all core libraries verified via official docs / npm registry within 24h)

## Summary

Phase 5 builds a household-scoped AI chatbot with RAG over uploaded PDFs (insurance policies, warranty docs, user manuals) and tool-use over live household data. The stack aligns naturally with what the project already has installed: Next.js 16.2, Drizzle 0.45, Inngest 4.1, Supabase 2.103, Zod 4. We add `ai` v6 + `@ai-sdk/anthropic` v3 + `@ai-sdk/react` v3 for streaming chat, `pdf-parse` v2 for PDF text extraction (explicitly rewritten for serverless), and enable the `vector` Postgres extension on Supabase with a `vector(384)` column indexed by HNSW + `vector_cosine_ops`. Embeddings come free from Supabase's built-in `gte-small` model accessed via an Edge Function — no new API key.

The AI SDK v5/v6 `useChat` + `streamText` + `toUIMessageStreamResponse()` pattern is the only supported chatbot pattern and replaces the legacy `useChat`/`messages` string-based API; `stopWhen: stepCountIs(n)` replaces v4's `maxSteps`. Claude tool use is declared as typed Zod-schema tools on `streamText` — the same mechanism serves both live-data queries (`get_upcoming_chores` etc.) and procedure extraction (`extract_procedure`).

**Primary recommendation:** Build on `ai@6` + `@ai-sdk/anthropic@3` + `@ai-sdk/react@3` using the `UIMessage` / `DefaultChatTransport` pattern. Serve chat from a Route Handler (`app/api/chat/route.ts`) — not a Server Action — because the SDK's transport expects HTTP streaming. Use `pdf-parse@2` (not v1, not `pdfjs-dist` directly) with `serverExternalPackages` in `next.config.ts`. Put embeddings and Claude calls inside Inngest `step.run()` blocks so each phase retries independently. Use Drizzle's `vector()` column + `cosineDistance()` helper, with an HNSW index keyed on raw cosine distance (not `1 - cosine`) so the index is actually used.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Chatbot Access & UI Placement**
- Global floating action button (bottom-right) on every `/app/*` page — opens chat
- Right-side dock panel (420px wide, full-height overlay) with message list + composer
- Streaming responses via Vercel AI SDK `useChat` hook — matches existing stack
- Model: Claude Sonnet 4.6 (`claude-sonnet-4-6`) — consistent with project convention

**RAG Pipeline & Document Processing**
- Vector storage: `pgvector` extension on existing Supabase Postgres
  - Enable `vector` extension via migration
  - New `document_chunks` table: `id`, `document_id`, `chunk_index`, `content`, `embedding vector(384)`
- Embedder: Supabase gte-small (runs in Edge Functions, free, 384 dims, no new API key) — keeps infra single-vendor
- PDF → chunks pipeline (Inngest background job):
  1. Trigger on document upload via `documents/uploaded` event
  2. Download PDF from Supabase Storage
  3. Extract text with `pdf-parse`
  4. Chunk to ~1000 characters with 200-character overlap
  5. Embed each chunk via Supabase Edge Function (`gte-small`)
  6. Insert into `document_chunks` with `document_id` + `chunk_index`
  7. Mark document as `ready_for_rag = true` and fire notification
- Retrieval strategy: Top-k similarity (k=5) scoped to household's documents, optionally filtered by `document_id` when user is viewing a specific item

**Procedure Extraction & Task Creation**
- Trigger: User-initiated — "Turn into tasks" button appears when chatbot detects a step list in its response
- Extraction format: Claude tool use with `extract_procedure` tool returning `{steps: [{title, description}]}`
- Task creation UX: Preview modal — user sees extracted steps as checkboxes, picks which to create, chooses target section (default: Chores), then confirms
- Target sections: Chores module only for MVP (per INS-09 and AI-06 default)

**Live Data Queries & Conversation History**
- Live data access: Claude tool use with typed tools:
  - `get_upcoming_chores` — next N chore tasks
  - `get_upcoming_activities` — next N kids activities
  - `get_warranty_expiries` — electronics warranties expiring in next 90 days
  - `get_insurance_expiries` — policies expiring in next 90 days
  - `get_car_reminders` — MOT/tax/service due in next 30 days
- Conversation persistence:
  - New `conversations` table: `id`, `household_id`, `title`, `created_at`, `updated_at`
  - New `messages` table: `id`, `conversation_id`, `role`, `content`, `tool_calls`, `created_at`
- Context window: Last 20 messages per conversation sent to Claude, full history in UI via scroll
- Document-ready notification: Reuse existing notifications system (Phase 1 realtime + NotificationBell) — fire notification event when embedding job completes

### Claude's Discretion
- Exact chunk size / overlap tuning
- Tool schema JSON details
- System prompt wording and guardrails
- Rate limiting and abuse prevention
- Token accounting / cost tracking

### Deferred Ideas (OUT OF SCOPE)
- Multi-language support
- Voice input / output
- Image understanding (attaching photos to chat)
- Full-text search alongside semantic search (hybrid retrieval)
- Per-message cost tracking UI
- Task creation in modules other than chores (v2)
- Custom system prompts per household
- RAG confidence scores surfaced in UI
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | Global chatbot accessible from any section | Global FAB in `(app)/layout.tsx`, `useChat` + `DefaultChatTransport` hitting `/api/chat` |
| AI-02 | Chatbot queries uploaded documents via RAG (pgvector) | `document_chunks vector(384)` + HNSW index + `cosineDistance()` + Supabase gte-small Edge Function |
| AI-03 | Documents processed async; user notified when ready | Inngest function chained via `step.run()`: download → extract → chunk → embed → insert → mark ready → notify via existing NotificationBell realtime |
| AI-04 | Chatbot answers about live household data | AI SDK tools: `get_upcoming_chores`, `get_upcoming_activities`, `get_warranty_expiries`, `get_insurance_expiries`, `get_car_reminders` as typed Zod tools on `streamText` |
| AI-05 | Chatbot presents extracted procedure steps and offers tasks | `extract_procedure` tool with Zod schema `{steps: [{title, description}]}`; client detects tool call and renders preview modal |
| AI-06 | User selects steps → target section → tasks created | Preview modal calls existing `createTask` Server Action per selected step |
| AI-07 | Conversation history persists per household | New `conversations` + `messages` tables, loaded on panel open, last 20 sent to Claude each turn |
| INS-07 | Chatbot answers questions about a specific policy doc | Retrieval optionally filtered by `document_id` when user opens chat from a policy |
| INS-08 | Chatbot extracts procedure from policy doc | Same `extract_procedure` tool, triggered on policy-scoped queries |
| INS-09 | User selects steps, confirms target section, tasks appear | Preview modal + existing task creation path |
| ELEC-05 | Chatbot answers questions about item via uploaded manual | Same RAG path; `documents.module='electronics'` + `documentType='manual'` |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0.158 | Core streaming + tool orchestration | Vercel-maintained, de-facto standard for Next.js AI chatbots, v6 is current release line |
| `@ai-sdk/anthropic` | ^3.0.69 | Anthropic provider for `streamText` | Official provider; supports `claude-sonnet-4-6` model ID, tool streaming on by default |
| `@ai-sdk/react` | ^3.0.160 | `useChat` + `DefaultChatTransport` | Official React bindings separated from core in v5+ |
| `pdf-parse` | ^2.4.5 | PDF text extraction in Node/serverless | v2 is an explicit rewrite for Vercel/Lambda/Workers; wraps `pdfjs-dist` internally |
| `zod` | ^4.3.6 (already installed) | Tool input schemas + validation | Already the project standard; AI SDK tools accept `inputSchema: zodSchema` |
| Drizzle `vector` column | in `drizzle-orm@^0.45` (already installed) | `vector(384)` column + `cosineDistance()` helper | Native pgvector support since 0.31 |
| `inngest` | ^4.1 (already installed) | Durable async PDF pipeline | Already used for reminders; `step.run()` gives per-phase retries + state |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | ^2.103 (already installed) | Invoke Edge Function `embed`, download Storage PDF | Already in project |
| `postgres` | ^3.4 (already installed) | Drizzle Postgres driver | Already in project |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pdf-parse@2` | `unpdf` | `unpdf` is newer/cleaner and works in edge runtimes, but less battle-tested; `pdf-parse@2` is explicitly supported on Vercel and more widely used for LLM pipelines |
| `pdf-parse@2` | raw `pdfjs-dist` | Requires you to wire worker + canvas polyfills yourself in serverless — `pdf-parse@2` does this |
| Supabase `gte-small` (384 dim) | OpenAI `text-embedding-3-small` (1536 dim) | OpenAI is higher quality but adds a new paid vendor + API key. Locked by CONTEXT.md — use gte-small. |
| HNSW index | IVFFlat | HNSW is recommended by Supabase for changing data; IVFFlat needs reindexing after bulk loads |
| Route Handler `/api/chat` | Next.js Server Action | `useChat` transport expects an HTTP endpoint with streaming response; Server Actions don't cleanly support the UI message stream protocol |

**Installation:**
```bash
pnpm add ai@^6 @ai-sdk/anthropic@^3 @ai-sdk/react@^3 pdf-parse@^2
```

**Version verification (npm registry, 2026-04-11):**
- `ai` 6.0.158 — published 2026-04-11
- `@ai-sdk/anthropic` 3.0.69 — published 2026-04-11
- `@ai-sdk/react` 3.0.160 — published 2026-04-11
- `pdf-parse` 2.4.5 — published 2025-10-29
- `pdfjs-dist` 5.6.205 — published 2026-03-29 (transitively used by pdf-parse)
- `drizzle-orm` 0.45.2 (installed 0.45.1) — has `vector()` + `cosineDistance()`
- `@supabase/supabase-js` 2.103.0 (matches installed)

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Route Handler: streamText + tools
│   │   └── inngest/route.ts           # existing — register new functions here
│   ├── (app)/
│   │   ├── layout.tsx                 # ADD: <ChatbotDock /> FAB + panel
│   │   └── ...
│   └── actions/
│       ├── chat.ts                    # NEW: createConversation, listConversations, saveMessage, loadHistory
│       └── documents.ts               # existing — emit 'documents/uploaded' event after confirmUpload
├── components/
│   └── chatbot/
│       ├── ChatbotFab.tsx             # floating blue button
│       ├── ChatbotDock.tsx            # 420px right-side panel
│       ├── MessageList.tsx            # renders UIMessage.parts
│       ├── MessageInput.tsx           # composer
│       ├── ProcedurePreviewModal.tsx  # extract_procedure → task creation
│       └── ToolCallBadge.tsx          # visual indicator for tool calls
├── lib/
│   ├── ai/
│   │   ├── tools.ts                   # typed AI SDK tools (live data + extract_procedure)
│   │   ├── system-prompt.ts           # household-aware system prompt
│   │   ├── rag.ts                     # retrieveTopChunks(householdId, query, k, documentId?)
│   │   └── embed.ts                   # embedText(text) -> Float32Array(384) via Supabase Edge Fn
│   ├── inngest/
│   │   └── functions/
│   │       └── process-document.ts    # NEW: download → parse → chunk → embed → insert → notify
│   └── db/
│       └── schema.ts                  # ADD: document_chunks, conversations, messages; EDIT: documents.readyForRag
└── supabase/
    └── functions/
        └── embed/index.ts             # Deno Edge Function using Supabase.ai.Session('gte-small')
```

### Pattern 1: Route Handler + useChat (AI SDK v5/v6)

**What:** The only supported chatbot pattern in AI SDK v5+. Client uses `useChat` with a `DefaultChatTransport`; server uses `streamText` + `toUIMessageStreamResponse()`.

**When to use:** Every chat interaction in this phase.

**Example:**
```typescript
// src/app/api/chat/route.ts
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { buildTools } from '@/lib/ai/tools'
import { retrieveTopChunks } from '@/lib/ai/rag'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, conversationId, documentId }: {
    messages: UIMessage[]
    conversationId: string
    documentId?: string
  } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Resolve household + RAG context
  const householdId = await getHouseholdForUser(user.id)
  const lastUserText = extractLastUserText(messages)
  const chunks = lastUserText
    ? await retrieveTopChunks({ householdId, query: lastUserText, k: 5, documentId })
    : []

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt({ householdId, chunks }),
    messages: convertToModelMessages(messages.slice(-20)),
    tools: buildTools({ householdId, userId: user.id }),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, toolCalls }) => {
      // persist assistant message + tool calls
      await saveAssistantMessage({ conversationId, text, toolCalls })
    },
  })

  return result.toUIMessageStreamResponse()
}
```

```typescript
// src/components/chatbot/ChatbotDock.tsx
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

export function ChatbotDock({ conversationId, documentId }: Props) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId, documentId },
    }),
  })

  return (
    <aside className="fixed right-0 top-0 h-full w-[420px] bg-white ring-1 ring-miro">
      <MessageList messages={messages} />
      <MessageInput
        disabled={status !== 'ready'}
        onSend={(text) => sendMessage({ text })}
      />
    </aside>
  )
}
```

### Pattern 2: Typed AI SDK Tools with Zod

**What:** Live data + procedure extraction as typed tools declared on `streamText`. Each tool has a Zod `inputSchema` and an `execute` function that runs server-side.

**When to use:** Both live-data queries (AI-04) and procedure extraction (AI-05).

**Example:**
```typescript
// src/lib/ai/tools.ts
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { tool } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'
import { tasks, electronics, insurancePolicies, cars, kidActivities } from '@/lib/db/schema'
import { and, eq, gte, lte, asc } from 'drizzle-orm'

export function buildTools(ctx: { householdId: string; userId: string }) {
  return {
    get_upcoming_chores: tool({
      description: 'Return the next N chore tasks due in this household, soonest first.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(5),
      }),
      execute: async ({ limit }) => {
        const rows = await db
          .select({ id: tasks.id, title: tasks.title, startsAt: tasks.startsAt, status: tasks.status })
          .from(tasks)
          .where(and(eq(tasks.householdId, ctx.householdId), gte(tasks.startsAt, new Date())))
          .orderBy(asc(tasks.startsAt))
          .limit(limit)
        return { tasks: rows }
      },
    }),

    get_warranty_expiries: tool({
      description: 'List electronics whose warranty expires within the next 90 days.',
      inputSchema: z.object({ withinDays: z.number().int().min(1).max(365).default(90) }),
      execute: async ({ withinDays }) => {
        const until = new Date(Date.now() + withinDays * 864e5)
        const rows = await db
          .select({ id: electronics.id, name: electronics.name, warrantyExpiryDate: electronics.warrantyExpiryDate })
          .from(electronics)
          .where(and(
            eq(electronics.householdId, ctx.householdId),
            lte(electronics.warrantyExpiryDate, until),
          ))
        return { items: rows }
      },
    }),

    // ... get_upcoming_activities, get_insurance_expiries, get_car_reminders

    extract_procedure: tool({
      description:
        'When the user asks to turn document guidance into tasks, call this tool with the ordered step list you extracted from the retrieved document context. Do NOT create tasks directly — the client will render a preview.',
      inputSchema: z.object({
        title: z.string().describe('Short title for the procedure, e.g. "Report a burst pipe"'),
        steps: z.array(z.object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).optional(),
        })).min(1).max(20),
      }),
      // No execute — tool call is surfaced to the client which renders a modal
    }),
  }
}
```

**Key point:** Tools without an `execute` function become **client-facing tool calls** — the model emits them, the UI renders them as a preview, and nothing runs on the server. This is exactly what `extract_procedure` wants.

### Pattern 3: Drizzle pgvector column + HNSW cosine index

**What:** Schema + query pattern for RAG retrieval with index usage.

**When to use:** `document_chunks` retrieval in `retrieveTopChunks()`.

**Example:**
```typescript
// src/lib/db/schema.ts (addition)
// Source: https://orm.drizzle.team/docs/guides/vector-similarity-search
import { index, pgTable, text, integer, uuid, timestamp, vector } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'

export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id').notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 384 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    // HNSW cosine index — MUST be on raw cosineDistance, not 1 - cosine
    index('document_chunks_embedding_idx')
      .using('hnsw', t.embedding.op('vector_cosine_ops')),
    index('document_chunks_document_id_idx').on(t.documentId),
    pgPolicy('document_chunks_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
  ]
)
```

```typescript
// src/lib/ai/rag.ts
// Source: https://orm.drizzle.team/docs/guides/vector-similarity-search
import { cosineDistance, asc, and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documentChunks } from '@/lib/db/schema'
import { embedText } from './embed'

export async function retrieveTopChunks(args: {
  householdId: string
  query: string
  k: number
  documentId?: string
}) {
  const queryEmbedding = await embedText(args.query)

  // Order by raw cosineDistance ASC so the HNSW index is actually used.
  // Do NOT order by (1 - cosineDistance) DESC — that bypasses the index.
  const distance = cosineDistance(documentChunks.embedding, queryEmbedding)

  return db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      documentId: documentChunks.documentId,
      distance,
    })
    .from(documentChunks)
    .where(
      args.documentId
        ? and(eq(documentChunks.householdId, args.householdId), eq(documentChunks.documentId, args.documentId))
        : eq(documentChunks.householdId, args.householdId)
    )
    .orderBy(asc(distance))
    .limit(args.k)
}
```

**Migration SQL appended manually (after drizzle-kit generate):**
```sql
-- src/lib/db/migrations/xxxx_phase5_rag.sql (hand-edit)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
-- drizzle-generated CREATE TABLE document_chunks (...) here
-- drizzle-generated CREATE INDEX ... USING hnsw ... here
```

### Pattern 4: Supabase Edge Function `embed` (gte-small)

**What:** One Deno Edge Function that takes `{ input: string | string[] }` and returns `{ embedding: number[] }` (or `embeddings: number[][]`). Called from Next.js server code via `supabase.functions.invoke('embed', ...)` or direct `fetch`.

**When to use:** Both the Inngest chunk-embedding step and the per-query embedding in `retrieveTopChunks`.

**Example:**
```typescript
// supabase/functions/embed/index.ts
// Source: https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings
// deno-lint-ignore-file
const session = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  const { input } = await req.json() as { input: string | string[] }

  if (Array.isArray(input)) {
    const embeddings = await Promise.all(
      input.map((t) => session.run(t, { mean_pool: true, normalize: true }))
    )
    return Response.json({ embeddings })
  }

  const embedding = await session.run(input, { mean_pool: true, normalize: true })
  return Response.json({ embedding })
})
```

```typescript
// src/lib/ai/embed.ts
import { createClient } from '@/lib/supabase/server'

export async function embedText(text: string): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.functions.invoke('embed', {
    body: { input: text.replace(/\n/g, ' ').slice(0, 8000) },
  })
  if (error || !data?.embedding) throw new Error('Embedding failed')
  return data.embedding as number[]
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const supabase = await createClient()
  const { data, error } = await supabase.functions.invoke('embed', {
    body: { input: texts.map((t) => t.replace(/\n/g, ' ').slice(0, 8000)) },
  })
  if (error || !data?.embeddings) throw new Error('Batch embedding failed')
  return data.embeddings as number[][]
}
```

### Pattern 5: Inngest durable PDF pipeline

**What:** One Inngest function subscribed to `documents/uploaded`. Each phase is its own `step.run()` so failures retry just that phase and the previous state is preserved.

**Example:**
```typescript
// src/lib/inngest/functions/process-document.ts
// Source: https://www.inngest.com/docs/learn/how-functions-are-executed
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { documents, documentChunks, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedBatch } from '@/lib/ai/embed'

export const processDocument = inngest.createFunction(
  {
    id: 'process-document',
    name: 'Process Document for RAG',
    retries: 3,
    concurrency: { limit: 5 }, // cap parallel PDF jobs
    triggers: [{ event: 'documents/uploaded' }],
  },
  async ({ event, step }) => {
    const { documentId, householdId, storagePath, uploadedBy } = event.data

    // 1. Download PDF bytes (retried independently)
    const pdfBuffer = await step.run('download-pdf', async () => {
      const admin = createAdminClient()
      const { data, error } = await admin.storage.from('documents').download(storagePath)
      if (error || !data) throw new Error(`Download failed: ${error?.message}`)
      return Buffer.from(await data.arrayBuffer()).toString('base64')
    })

    // 2. Extract text via pdf-parse v2
    const fullText = await step.run('extract-text', async () => {
      // IMPORTANT: import pdf-parse/worker before pdf-parse (serverless requirement)
      await import('pdf-parse/worker')
      const { default: pdfParse } = await import('pdf-parse')
      const result = await pdfParse(Buffer.from(pdfBuffer, 'base64'))
      return result.text
    })

    // 3. Chunk 1000 chars / 200 overlap
    const chunks = await step.run('chunk-text', () => chunkText(fullText, 1000, 200))

    // 4. Batch embed (one Edge Function call per batch of ~32)
    const batches = batch(chunks, 32)
    let inserted = 0
    for (let i = 0; i < batches.length; i++) {
      await step.run(`embed-batch-${i}`, async () => {
        const embeddings = await embedBatch(batches[i])
        await db.insert(documentChunks).values(
          batches[i].map((content, j) => ({
            householdId,
            documentId,
            chunkIndex: inserted + j,
            content,
            embedding: embeddings[j],
          }))
        )
        inserted += batches[i].length
      })
    }

    // 5. Mark ready + notify uploader
    await step.run('mark-ready-and-notify', async () => {
      await db.update(documents).set({ readyForRag: true }).where(eq(documents.id, documentId))
      await db.insert(notifications).values({
        householdId,
        userId: uploadedBy,
        type: 'document_ready',
        entityId: documentId,
        message: 'Your document is ready for AI chat',
      })
    })

    return { documentId, chunks: chunks.length }
  }
)

function chunkText(text: string, size: number, overlap: number): string[] {
  const out: string[] = []
  let i = 0
  while (i < text.length) {
    out.push(text.slice(i, i + size))
    i += size - overlap
  }
  return out
}

function batch<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}
```

**Emit the event from `confirmUpload`:**
```typescript
// src/app/actions/documents.ts — addition inside confirmUpload
await inngest.send({
  name: 'documents/uploaded',
  data: {
    documentId: newDoc.id,
    householdId: memberRow.householdId,
    storagePath: parsed.data.storagePath,
    uploadedBy: user.id,
  },
})
```

### Anti-Patterns to Avoid

- **Ordering by `1 - cosineDistance(...)` DESC:** PostgreSQL will not use the HNSW cosine index. Always `ORDER BY cosineDistance(...) ASC` and compute similarity client-side if needed.
- **Using Next.js Server Actions for chat streaming:** `useChat`'s transport expects an HTTP endpoint returning a UI message stream. Use a Route Handler.
- **Bundling `pdf-parse` into the serverless function:** Add it to `serverExternalPackages` in `next.config.ts`, otherwise worker + canvas resolution breaks.
- **Calling `pdfParse()` at module top level:** Worker initialisation has side effects. Import dynamically inside the step.
- **Using `maxSteps` on `useChat`:** v5 replaced it with `stopWhen: stepCountIs(n)` on `streamText`. There's a known issue where `stopWhen` on the server doesn't propagate back to `useChat` when the final step is a server-side tool result; avoid long chains and keep `stepCountIs(5)`-ish.
- **Executing `extract_procedure` on the server:** Leave `execute` undefined so the tool call surfaces to the client as a UIMessage part. The client renders a preview modal and calls `createTask` only on user confirmation.
- **Storing 20 raw messages with full tool payloads and resending them every turn:** Trim tool-call inputs/outputs before persistence or before including in the context window. Keep assistant text + tool names + final tool result summary.
- **Running Edge Function `embed` calls one-chunk-at-a-time inside a single step:** Batch into groups (~32) and wrap each batch in its own `step.run()` for isolated retry + idempotency.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom pdfjs-dist wiring with canvas polyfills | `pdf-parse@2` | Does all serverless setup already |
| Streaming chat protocol | SSE handler + message state machine | `ai` v6 + `@ai-sdk/react` v3 | UIMessage protocol, tool-call streaming, status management |
| Tool schema validation | Hand-rolled JSON schema generation | `tool({ inputSchema: z.object(...) })` | Zod → JSON Schema automatic; type-safe `execute` |
| Text embeddings service | Self-host model, or pay OpenAI per call | Supabase `gte-small` Edge Function | Free, 384 dim, no new vendor |
| Vector similarity query | Raw SQL with manual `<=>` | Drizzle `vector()` column + `cosineDistance()` helper | Typed; handles parameter binding of vectors |
| Durable PDF pipeline | BullMQ/Redis/cron | Inngest `step.run()` chain | Already in project; durable state + independent retries |
| Conversation/message storage | JSONB blob in one table | Two tables (`conversations`, `messages`) | Supports pagination, selective loading, tool-call indexing |

**Key insight:** Every piece of this stack has a known best-practice library or primitive. The only custom code is (a) the chunker, (b) the household-aware system prompt, (c) the live-data tool bodies, and (d) the chat UI styling.

## Common Pitfalls

### Pitfall 1: `pdf-parse` fails on Vercel with "canvas" or worker errors
**What goes wrong:** Deploy works locally, breaks on Vercel with obscure module resolution or canvas errors.
**Why it happens:** Next.js tries to bundle `pdfjs-dist` into the serverless function, but it expects a worker module and a canvas factory.
**How to avoid:**
- Add to `next.config.ts`: `serverExternalPackages: ['pdf-parse', 'pdfjs-dist']`
- Import `pdf-parse/worker` **before** `pdf-parse`
- Use dynamic `import()` inside the Inngest step, not top-level
**Warning signs:** `Cannot find module 'canvas'`, `worker not initialised`, silent empty text output.

### Pitfall 2: HNSW index not used → full table scan
**What goes wrong:** Query is slow even with index; `EXPLAIN` shows `Seq Scan on document_chunks`.
**Why it happens:** Ordering by `1 - cosineDistance(...)` DESC doesn't match the index's operator; planner falls back to scan.
**How to avoid:** Always `ORDER BY cosineDistance(embedding, $1) ASC LIMIT k`. If you need a similarity score, compute `1 - distance` in the SELECT list, not the ORDER BY.
**Warning signs:** `EXPLAIN ANALYZE` on the retrieval query doesn't mention HNSW; p95 latency > 200ms at a few thousand rows.

### Pitfall 3: `stopWhen` + `useChat` step loop runaway
**What goes wrong:** Chat continues running tools past the intended stop count, hitting rate limits.
**Why it happens:** Known AI SDK v5 issue — `stopWhen` on `streamText` doesn't cleanly propagate to `useChat` when the last step is a server-side tool result. `useChat` will keep re-sending until it sees a terminal text message.
**How to avoid:**
- Keep `stepCountIs(5)` at most
- Always include a terminal text generation after tool calls (don't end on a tool result)
- For `extract_procedure` (client-facing tool), make sure the model also emits a short summary text

### Pitfall 4: Embedding mismatch between indexing and querying
**What goes wrong:** RAG returns irrelevant chunks.
**Why it happens:** Different normalisation settings between indexing and query-time embedding, or text preprocessed differently.
**How to avoid:** Use the same `embedText` helper for both indexing and querying. Both call the Edge Function with `mean_pool: true, normalize: true`. Both strip newlines and cap at 8000 chars.

### Pitfall 5: Chunks larger than gte-small's input limit
**What goes wrong:** Edge Function returns error or truncated embedding.
**Why it happens:** gte-small has a 512-token context window; 1000 characters is usually fine (~250 tokens) but edge cases (dense text, non-English) can exceed.
**How to avoid:** Hard-cap chunk size at 1000 chars and also token-count if possible; on Edge Function error, split chunk in half and retry.

### Pitfall 6: Drizzle migration doesn't emit `CREATE EXTENSION vector`
**What goes wrong:** Migration fails with "type vector does not exist".
**Why it happens:** Drizzle-kit generates the table DDL but doesn't know about the extension.
**How to avoid:** Manually prepend `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;` to the generated SQL. The project already has a precedent for manually editing migration SQL (cross-schema FKs).

### Pitfall 7: Tool result serialization breaks with Dates
**What goes wrong:** Model receives `{}` for a task row that had `startsAt: Date`.
**Why it happens:** AI SDK serializes tool results as JSON; JS Date objects serialize but round-trip as strings.
**How to avoid:** Explicitly map Dates to ISO strings in `execute` return values; don't return raw Drizzle row objects.

### Pitfall 8: RLS blocks server reads from `document_chunks` when called from Inngest
**What goes wrong:** Insert/select succeeds locally, fails in Inngest.
**Why it happens:** Inngest worker uses the service-role key (no `auth.uid()`) — RLS policies that reference `auth.uid()` evaluate to `NULL`.
**How to avoid:** Use the admin client (`createAdminClient()`) or the service-role Postgres connection in Inngest steps; RLS is bypassed by service role. Document policies still protect Route Handler reads.

## Code Examples

### Retrieving and injecting context into the system prompt

```typescript
// src/lib/ai/system-prompt.ts
export function buildSystemPrompt(args: {
  householdId: string
  chunks: { content: string; documentId: string }[]
}) {
  const context = args.chunks.length
    ? args.chunks.map((c, i) => `[[chunk ${i + 1} doc=${c.documentId}]]\n${c.content}`).join('\n\n')
    : '(no relevant documents retrieved for this query)'

  return `You are the household assistant for a family's shared command centre.

You have access to:
- Tools for live household data (upcoming chores, activities, warranties, insurance, car reminders). Prefer calling a tool over guessing.
- Retrieved excerpts from the household's uploaded documents (policies, warranties, manuals). Only use these for document questions, and cite which chunk you used.
- A tool \`extract_procedure\` you should call ONLY when the user explicitly asks to turn guidance into tasks.

Rules:
- NEVER fabricate policy numbers, dates, prices, or appliance instructions. If the answer isn't in a tool result or a retrieved chunk, say you don't know.
- Keep responses short and conversational.
- When citing a document, reference the chunk number.

Retrieved document context:
${context}`
}
```

### Chunking function

```typescript
// Simple sliding-window chunker (1000 chars, 200 overlap)
// Consider: split on paragraph boundaries first, then fallback to char.
export function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= size) return [clean]
  const chunks: string[] = []
  let i = 0
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size))
    i += size - overlap
  }
  return chunks
}
```

### next.config.ts addition

```typescript
// next.config.ts
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
}
export default nextConfig
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK v4 `useChat` with string `messages` and `maxSteps` | v5/v6 `useChat` with `UIMessage[] + parts[]` + `DefaultChatTransport`, `stopWhen: stepCountIs(n)` on `streamText` | AI SDK v5 (2025) | Must use new API; docs/snippets for v4 are wrong |
| `@ai-sdk/react` bundled in `ai` package | Separated into `@ai-sdk/react@3` | AI SDK v5 | Import from `@ai-sdk/react`, not `ai/react` |
| `pdf-parse@1` (2018-era, unmaintained) | `pdf-parse@2` (2025, serverless-aware) or `unpdf` | v2 released 2025 | Old README/snippets refer to `pdf-parse@1` API — v2 is mostly compatible but requires `pdf-parse/worker` import |
| Raw SQL `embedding <=> $1` in Drizzle | `cosineDistance(column, array)` helper + `vector()` column type | Drizzle 0.31 | No more manual SQL templating for vector ops |
| `anthropic('claude-3-5-sonnet-...')` | `anthropic('claude-sonnet-4-6')` | Claude 4.x | Model ID format changed; 4.x is current |
| Single-step tools | Multi-step with `stopWhen` | AI SDK v5 | `maxSteps` deprecated on hooks |

**Deprecated/outdated:**
- `useChat` with `api: '/api/chat'` direct prop — still works but `DefaultChatTransport` is preferred
- `pdf-parse@1` — no serverless support, stalled
- `ai/react` imports — use `@ai-sdk/react`
- `maxSteps` on `useChat` — use `stopWhen` on `streamText` instead

## Open Questions

1. **Exact gte-small context window / chunk limit**
   - What we know: gte-small ~512 tokens; 1000 chars is usually safe
   - What's unclear: Worst-case behaviour on dense non-English PDFs
   - Recommendation: Start with 1000/200, add a retry-with-smaller-chunk fallback in the embed step if the Edge Function errors

2. **How should we detect "user wants to create tasks"?**
   - What we know: CONTEXT says a button appears when the chatbot response contains a step list
   - What's unclear: Detection heuristic — numeric list regex? LLM self-classification? Always-visible button?
   - Recommendation: Planner should decide. Simplest MVP: always show a "Turn into tasks" button when any assistant message contains an ordered list of 2+ items (regex `/^\s*\d+[.)]/m`). Clicking it sends a follow-up message "Please call extract_procedure with the steps you just described."

3. **Message history trimming strategy**
   - What we know: Last 20 messages sent to Claude per turn
   - What's unclear: How to count — raw messages, or token budget? What about long tool-result payloads?
   - Recommendation: 20 messages by count, but strip tool-call input/output JSON from positions older than the most recent 5.

4. **Should `document_chunks` insert be wrapped in admin client or user client?**
   - What we know: Inngest runs outside request context → service role
   - What's unclear: Whether `db` in the existing project uses service role or anon
   - Recommendation: Planner must verify `src/lib/db/index.ts` uses a service-role connection (or add one) for Inngest writes.

5. **Realtime for "document ready"**
   - What we know: CONTEXT says reuse existing realtime notifications
   - What's unclear: Whether inserting into `notifications` already triggers realtime push without any broadcast call
   - Recommendation: Planner must confirm via the existing `notifications` insert path used by `send-warranty-reminder`; if so, the Inngest function is complete with just the INSERT.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 (unit/integration) + Playwright 1.58 (e2e) |
| Config file | existing `vitest.config.ts` + `playwright.config.ts` |
| Quick run command | `pnpm test -- src/lib/ai` or per-file pattern |
| Full suite command | `pnpm test && pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | FAB renders on every `(app)` page and opens dock | e2e | `pnpm test:e2e -- chatbot-fab.spec.ts` | Wave 0 |
| AI-02 | Retrieval returns chunks for a given query (unit over seeded DB) | integration | `pnpm test -- src/lib/ai/rag.test.ts` | Wave 0 |
| AI-03 | `process-document` Inngest fn chains steps and marks `ready_for_rag` | integration | `pnpm test -- src/lib/inngest/functions/process-document.test.ts` | Wave 0 |
| AI-04 | `get_upcoming_chores` tool returns correct rows for household | unit | `pnpm test -- src/lib/ai/tools.test.ts` | Wave 0 |
| AI-05 | `extract_procedure` tool call surfaces to client as UIMessage part | unit (mock model) | `pnpm test -- src/app/api/chat/route.test.ts` | Wave 0 |
| AI-06 | Preview modal creates tasks via `createTask` action | integration | `pnpm test -- src/components/chatbot/ProcedurePreviewModal.test.tsx` | Wave 0 |
| AI-07 | Conversations + messages persist and reload | integration | `pnpm test -- src/app/actions/chat.test.ts` | Wave 0 |
| INS-07 | Chunk retrieval filtered by `documentId` returns only that doc | integration | `pnpm test -- src/lib/ai/rag.test.ts` | Wave 0 |
| INS-08 | Procedure extraction tool call schema validates | unit | `pnpm test -- src/lib/ai/tools.test.ts` | Wave 0 |
| INS-09 | Full extract → confirm → task creation e2e | e2e | `pnpm test:e2e -- procedure-to-tasks.spec.ts` | Wave 0 |
| ELEC-05 | Chatbot answers manual question with doc chunk in context | e2e (mocked AI response) | `pnpm test:e2e -- elec-manual-chat.spec.ts` | Wave 0 |

**Note on AI testing:** Do not hit the real Anthropic API in tests. Mock `@ai-sdk/anthropic` with `MockLanguageModelV2` from `ai/test` so tests are deterministic and offline. Similarly, mock `supabase.functions.invoke('embed', ...)` to return a fixed-dim zero vector.

### Sampling Rate
- **Per task commit:** `pnpm test -- <file>` for the task's own files, < 30s
- **Per wave merge:** `pnpm test` (full Vitest suite)
- **Phase gate:** `pnpm test && pnpm test:e2e` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ai/rag.test.ts` — seeds `document_chunks`, asserts ordered retrieval
- [ ] `src/lib/ai/tools.test.ts` — per-tool unit with seeded household data
- [ ] `src/lib/inngest/functions/process-document.test.ts` — mocks Supabase Storage + embed fn, asserts step chain
- [ ] `src/app/api/chat/route.test.ts` — uses `MockLanguageModelV2` from `ai/test`
- [ ] `src/app/actions/chat.test.ts` — conversation/message persistence
- [ ] `src/components/chatbot/ProcedurePreviewModal.test.tsx` — React Testing Library
- [ ] `tests/e2e/chatbot-fab.spec.ts` — Playwright
- [ ] `tests/e2e/procedure-to-tasks.spec.ts` — Playwright (mock `/api/chat` response)
- [ ] `tests/e2e/elec-manual-chat.spec.ts` — Playwright (mock `/api/chat`)
- [ ] Seed helpers for `document_chunks` with canned embeddings
- [ ] `vi.mock` helper for `@/lib/ai/embed` returning zero-vectors
- [ ] `MockLanguageModelV2` helper from `ai/test` wired into chat route tests

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK — useChat / App Router chatbot — https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- Vercel AI SDK — Anthropic provider — https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- Vercel AI SDK — Tools and Tool Calling — https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Supabase — Vector columns (pgvector) — https://supabase.com/docs/guides/ai/vector-columns
- Supabase — Vector indexes (HNSW vs IVFFlat) — https://supabase.com/docs/guides/ai/vector-indexes
- Supabase — Generate text embeddings with Edge Functions (gte-small) — https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings
- Drizzle ORM — Vector similarity search with pgvector — https://orm.drizzle.team/docs/guides/vector-similarity-search
- Inngest — How functions are executed (durable) — https://www.inngest.com/docs/learn/how-functions-are-executed
- Inngest — Retries — https://www.inngest.com/docs/features/inngest-functions/error-retries/retries
- npm registry (versions verified 2026-04-11): `ai@6.0.158`, `@ai-sdk/anthropic@3.0.69`, `@ai-sdk/react@3.0.160`, `pdf-parse@2.4.5`, `pdfjs-dist@5.6.205`

### Secondary (MEDIUM confidence)
- Build with Matija — "Process PDFs on Vercel: Reliable Serverless Guide (2026)" — https://www.buildwithmatija.com/blog/process-pdfs-on-vercel-serverless-guide
- PkgPulse — unpdf vs pdf-parse vs pdfjs-dist comparison (2026) — https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026
- Vercel blog — AI SDK 5 release notes — https://vercel.com/blog/ai-sdk-5
- Vercel blog — AI SDK 6 release notes — https://vercel.com/blog/ai-sdk-6
- pgvector/pgvector-node — TS client reference — https://github.com/pgvector/pgvector-node

### Tertiary (LOW confidence — cross-verify before acting)
- GitHub issue vercel/ai#7502 — `stopWhen` + `useChat` `maxSteps` interaction — https://github.com/vercel/ai/issues/7502 (used to flag Pitfall 3)
- Medium — "Building a Scalable RAG System with Inngest, Drizzle ORM, and PostgreSQL" — pattern inspiration only

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — every library version verified against npm registry today; API patterns verified against official docs.
- Architecture: **HIGH** — patterns come directly from official AI SDK, Supabase, and Drizzle docs, adapted minimally to this project's existing conventions.
- Pitfalls: **MEDIUM-HIGH** — pitfalls 1, 2, 4, 6, 7, 8 are from official docs / project conventions; pitfall 3 (`stopWhen` interaction with `useChat`) is from a GitHub issue and should be re-verified by planner against current AI SDK 6 behaviour (may be fixed).
- Validation architecture: **HIGH** — framework already in use; test strategy is standard.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 for the AI SDK section (fast-moving); 2026-07-11 for everything else (stable).
