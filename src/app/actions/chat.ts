'use server'

import { z } from 'zod'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { conversations, messages, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export interface ConversationSummary {
  id: string
  title: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface MessageRow {
  id: string
  role: string
  content: string
  toolCalls: unknown
  createdAt: Date | null
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

const conversationIdSchema = z.object({
  conversationId: z.string().uuid(),
})

const saveUserMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
})

const saveAssistantMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().max(20000),
  toolCalls: z
    .array(
      z.object({
        name: z.string(),
        input: z.unknown().optional(),
        output: z.unknown().optional(),
      })
    )
    .optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gets the current user's member row (id + householdId). Returns null if not found. */
async function getMemberRow(userId: string): Promise<{ id: string; householdId: string } | null> {
  const rows = await db
    .select({ id: householdMembers.id, householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Verifies a conversation belongs to the given household.
 * Returns the conversation id on success, null otherwise.
 */
async function assertConversationInHousehold(
  conversationId: string,
  householdId: string
): Promise<{ id: string } | null> {
  const rows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.householdId, householdId)))
    .limit(1)
  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function createConversation(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createConversationSchema.safeParse(data ?? {})
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [row] = await db
    .insert(conversations)
    .values({
      householdId: memberRow.householdId,
      title: parsed.data.title ?? null,
      createdBy: user.id,
    })
    .returning({ id: conversations.id })

  return { success: true, data: { id: row.id } }
}

export async function listConversations(): Promise<ActionResult<ConversationSummary[]>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.householdId, memberRow.householdId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50)

  return { success: true, data: rows }
}

export async function loadHistory(data: unknown): Promise<ActionResult<MessageRow[]>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = conversationIdSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const conversation = await assertConversationInHousehold(
    parsed.data.conversationId,
    memberRow.householdId
  )
  if (!conversation) return { success: false, error: 'Conversation not found' }

  const rows = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      toolCalls: messages.toolCalls,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, parsed.data.conversationId),
        eq(messages.householdId, memberRow.householdId)
      )
    )
    .orderBy(asc(messages.createdAt))

  return { success: true, data: rows }
}

export async function saveUserMessage(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = saveUserMessageSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const conversation = await assertConversationInHousehold(
    parsed.data.conversationId,
    memberRow.householdId
  )
  if (!conversation) return { success: false, error: 'Conversation not found' }

  const [row] = await db
    .insert(messages)
    .values({
      conversationId: parsed.data.conversationId,
      householdId: memberRow.householdId,
      role: 'user',
      content: parsed.data.content,
      toolCalls: null,
    })
    .returning({ id: messages.id })

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, parsed.data.conversationId))

  return { success: true, data: { id: row.id } }
}

export async function saveAssistantMessage(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = saveAssistantMessageSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const conversation = await assertConversationInHousehold(
    parsed.data.conversationId,
    memberRow.householdId
  )
  if (!conversation) return { success: false, error: 'Conversation not found' }

  const [row] = await db
    .insert(messages)
    .values({
      conversationId: parsed.data.conversationId,
      householdId: memberRow.householdId,
      role: 'assistant',
      content: parsed.data.content,
      toolCalls: parsed.data.toolCalls ?? null,
    })
    .returning({ id: messages.id })

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, parsed.data.conversationId))

  return { success: true, data: { id: row.id } }
}

export async function deleteConversation(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = conversationIdSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const conversation = await assertConversationInHousehold(
    parsed.data.conversationId,
    memberRow.householdId
  )
  if (!conversation) return { success: false, error: 'Conversation not found' }

  // FK cascade on messages.conversation_id removes child messages automatically.
  await db.delete(conversations).where(eq(conversations.id, parsed.data.conversationId))

  return { success: true }
}
