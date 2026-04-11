/**
 * POST /api/chat — streaming chat endpoint for the household assistant.
 *
 * Request shape (from the Plan 05-06 client using `useChat` + DefaultChatTransport):
 *   { messages: UIMessage[], conversationId: string, documentId?: string }
 *
 * Flow:
 *   1. Verify Supabase auth → 401 if not signed in
 *   2. Resolve the caller's householdId from `household_members`
 *   3. Extract the last user text and run RAG retrieval (top 5 chunks)
 *   4. Persist the user message via `saveUserMessage` BEFORE streaming, so
 *      we keep the turn even if the stream crashes.
 *   5. Call `streamText` with Claude Sonnet 4.6 (via @ai-sdk/anthropic),
 *      a household-aware system prompt, six tools (five server + one client),
 *      and `stopWhen: stepCountIs(5)` to cap tool-use loops.
 *   6. In `onFinish`, persist the aggregated assistant text + any tool calls
 *      via `saveAssistantMessage`.
 *   7. Return `result.toUIMessageStreamResponse()` — the AI SDK v6 UIMessage
 *      streaming protocol that `useChat` on the client expects.
 */
import { anthropic } from '@ai-sdk/anthropic'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { retrieveTopChunks } from '@/lib/ai/rag'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { buildTools } from '@/lib/ai/tools'
import { saveAssistantMessage, saveUserMessage } from '@/app/actions/chat'

export const maxDuration = 60

interface ChatRequestBody {
  messages: UIMessage[]
  conversationId: string
  documentId?: string
}

export async function POST(req: Request) {
  let body: ChatRequestBody
  try {
    body = (await req.json()) as ChatRequestBody
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }
  const { messages, conversationId, documentId } = body
  if (!Array.isArray(messages) || typeof conversationId !== 'string') {
    return new Response('Invalid request shape', { status: 400 })
  }

  // ---- Auth -------------------------------------------------------------
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // ---- Resolve household ------------------------------------------------
  const [member] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!member) return new Response('No household', { status: 403 })

  // ---- RAG retrieval (top 5 chunks for the latest user turn) -----------
  const lastUserText = extractLastUserText(messages)
  const chunks = lastUserText
    ? await retrieveTopChunks({
        householdId: member.householdId,
        query: lastUserText,
        k: 5,
        documentId,
      })
    : []

  // ---- Persist user message before streaming ---------------------------
  if (lastUserText) {
    try {
      await saveUserMessage({ conversationId, content: lastUserText })
    } catch (err) {
      console.error('[api/chat] saveUserMessage failed:', err)
    }
  }

  // ---- Build system prompt + tools -------------------------------------
  const system = buildSystemPrompt({
    householdId: member.householdId,
    chunks,
  })
  const tools = buildTools({
    householdId: member.householdId,
    userId: user.id,
  })

  // ---- Stream ----------------------------------------------------------
  // Load last 20 messages of history to cap context window (Pitfall 4).
  const history = messages.slice(-20)
  const modelMessages = await convertToModelMessages(history)

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async (event) => {
      try {
        // Aggregate text across all steps so assistant messages emitted
        // around tool calls are all persisted.
        const fullText = event.steps
          .map((s) => s.text)
          .filter(Boolean)
          .join('\n\n')
          .trim()

        // Aggregate tool calls across every step.
        const allToolCalls = event.steps.flatMap((s) =>
          s.toolCalls.map((tc) => ({
            name: tc.toolName,
            input: tc.input as unknown,
          }))
        )

        await saveAssistantMessage({
          conversationId,
          content: fullText || event.text || '',
          toolCalls: allToolCalls.length ? allToolCalls : undefined,
        })
      } catch (err) {
        console.error('[api/chat] saveAssistantMessage failed:', err)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Scans backwards through the UIMessage list and returns the concatenated
 * text of the most recent user message. Returns null if none is found.
 */
function extractLastUserText(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'user') continue
    const texts: string[] = []
    for (const part of m.parts ?? []) {
      if (part.type === 'text' && typeof part.text === 'string') {
        texts.push(part.text)
      }
    }
    if (texts.length) return texts.join('\n')
  }
  return null
}
