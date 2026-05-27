'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { suggestions, tasks, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const acceptSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
})

const dismissSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getHouseholdId(userId: string): Promise<string | null> {
  const rows = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)
  return rows[0]?.householdId ?? null
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Fetch all pending suggestions for the current user's household.
 * Dates are serialized as ISO strings for client consumption.
 */
export async function getSuggestions(): Promise<
  ActionResult<
    Array<{
      id: string
      sourceModule: string
      sourceEntityId: string
      sourceField: string
      deadlineDate: string
      suggestedTitle: string
      suggestedNotes: string | null
      suggestedOwnerId: string | null
      status: string
      createdAt: string | null
    }>
  >
> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  const rows = await db
    .select()
    .from(suggestions)
    .where(and(eq(suggestions.householdId, householdId), eq(suggestions.status, 'pending')))

  const serialized = rows.map((row) => ({
    id: row.id,
    sourceModule: row.sourceModule,
    sourceEntityId: row.sourceEntityId,
    sourceField: row.sourceField,
    deadlineDate: row.deadlineDate,
    suggestedTitle: row.suggestedTitle,
    suggestedNotes: row.suggestedNotes,
    suggestedOwnerId: row.suggestedOwnerId,
    status: row.status,
    createdAt: row.createdAt?.toISOString() ?? null,
  }))

  return { success: true, data: serialized }
}

/**
 * Accept a suggestion: create a task from it and mark as accepted.
 */
export async function acceptSuggestion(
  data: unknown
): Promise<ActionResult<{ taskId: string; taskTitle: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = acceptSuggestionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  // Fetch the suggestion
  const [suggestion] = await db
    .select()
    .from(suggestions)
    .where(
      and(
        eq(suggestions.id, parsed.data.suggestionId),
        eq(suggestions.householdId, householdId),
        eq(suggestions.status, 'pending')
      )
    )
    .limit(1)

  if (!suggestion) return { success: false, error: 'Suggestion not found or already processed' }

  // Create a task from the suggestion
  const [newTask] = await db
    .insert(tasks)
    .values({
      householdId,
      title: suggestion.suggestedTitle,
      notes: suggestion.suggestedNotes,
      ownerId: suggestion.suggestedOwnerId ?? user.id,
      status: 'todo',
      startsAt: new Date(suggestion.deadlineDate),
      createdBy: user.id,
    })
    .returning()

  // Update the suggestion as accepted
  await db
    .update(suggestions)
    .set({
      status: 'accepted',
      acceptedTaskId: newTask.id,
      updatedAt: new Date(),
    })
    .where(eq(suggestions.id, suggestion.id))

  revalidatePath('/dashboard')
  revalidatePath('/chores')

  return { success: true, data: { taskId: newTask.id, taskTitle: newTask.title } }
}

/**
 * Dismiss a suggestion — mark as dismissed so it won't be shown again.
 */
export async function dismissSuggestion(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = dismissSuggestionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  const [updated] = await db
    .update(suggestions)
    .set({
      status: 'dismissed',
      dismissedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(suggestions.id, parsed.data.suggestionId),
        eq(suggestions.householdId, householdId),
        eq(suggestions.status, 'pending')
      )
    )
    .returning({ id: suggestions.id })

  if (!updated) return { success: false, error: 'Suggestion not found or already processed' }

  revalidatePath('/dashboard')

  return { success: true }
}
