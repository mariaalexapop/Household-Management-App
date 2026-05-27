'use server'

import { z } from 'zod'
import { eq, and, count, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { format, addDays, startOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { db } from '@/lib/db'
import { suggestions, tasks, householdMembers, cars, insurancePolicies, electronics } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATES, type TemplateKey } from '@/lib/suggestions/templates'

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
 * Seed suggestions for a household — called from the dashboard server component
 * to ensure suggestions exist without waiting for the Inngest cron.
 * Generates suggestions for deadlines within the next 14 days.
 * Skips any that already exist (pending, accepted, or dismissed).
 */
export async function seedSuggestions(householdId: string): Promise<void> {
  const now = new Date()
  const windowEnd = addDays(now, 14)

  interface Candidate {
    sourceModule: 'car' | 'insurance' | 'electronics'
    sourceEntityId: string
    sourceField: string
    deadlineDate: Date
    templateKey: TemplateKey
    context: { make?: string; model?: string; insurer?: string; type?: string; name?: string; date: string }
  }

  const candidates: Candidate[] = []

  // Cars
  const householdCars = await db
    .select({ id: cars.id, make: cars.make, model: cars.model, motDueDate: cars.motDueDate, taxDueDate: cars.taxDueDate, nextServiceDate: cars.nextServiceDate })
    .from(cars).where(eq(cars.householdId, householdId))

  for (const car of householdCars) {
    for (const [field, date, key] of [
      ['motDueDate', car.motDueDate, 'car.motDueDate'],
      ['taxDueDate', car.taxDueDate, 'car.taxDueDate'],
      ['nextServiceDate', car.nextServiceDate, 'car.nextServiceDate'],
    ] as [string, Date | null, TemplateKey][]) {
      if (date && date <= windowEnd) {
        candidates.push({ sourceModule: 'car', sourceEntityId: car.id, sourceField: field, deadlineDate: date, templateKey: key, context: { make: car.make, model: car.model, date: format(date, 'dd MMM yyyy') } })
      }
    }
  }

  // Insurance
  const householdPolicies = await db
    .select({ id: insurancePolicies.id, insurer: insurancePolicies.insurer, policyType: insurancePolicies.policyType, expiryDate: insurancePolicies.expiryDate, nextPaymentDate: insurancePolicies.nextPaymentDate })
    .from(insurancePolicies).where(eq(insurancePolicies.householdId, householdId))

  for (const p of householdPolicies) {
    for (const [field, date, key] of [
      ['expiryDate', p.expiryDate, 'insurance.expiryDate'],
      ['nextPaymentDate', p.nextPaymentDate, 'insurance.nextPaymentDate'],
    ] as [string, Date | null, TemplateKey][]) {
      if (date && date <= windowEnd) {
        candidates.push({ sourceModule: 'insurance', sourceEntityId: p.id, sourceField: field, deadlineDate: date, templateKey: key, context: { insurer: p.insurer, type: p.policyType, date: format(date, 'dd MMM yyyy') } })
      }
    }
  }

  // Electronics
  const householdElecs = await db
    .select({ id: electronics.id, name: electronics.name, warrantyExpiryDate: electronics.warrantyExpiryDate })
    .from(electronics).where(eq(electronics.householdId, householdId))

  for (const e of householdElecs) {
    if (e.warrantyExpiryDate && e.warrantyExpiryDate <= windowEnd) {
      candidates.push({ sourceModule: 'electronics', sourceEntityId: e.id, sourceField: 'warrantyExpiryDate', deadlineDate: e.warrantyExpiryDate, templateKey: 'electronics.warrantyExpiryDate', context: { name: e.name, date: format(e.warrantyExpiryDate, 'dd MMM yyyy') } })
    }
  }

  // Find least-loaded member
  const members = await db.select({ id: householdMembers.id }).from(householdMembers).where(eq(householdMembers.householdId, householdId))
  const wkStart = startOfWeek(now, { weekStartsOn: 1 })
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 })
  let leastId: string | null = members[0]?.id ?? null
  let minCount = Infinity
  for (const m of members) {
    const [r] = await db.select({ c: count() }).from(tasks).where(and(eq(tasks.householdId, householdId), eq(tasks.ownerId, m.id), sql`${tasks.startsAt} >= ${wkStart.toISOString()}`, sql`${tasks.startsAt} <= ${wkEnd.toISOString()}`))
    const c = Number(r?.c ?? 0)
    if (c < minCount) { minCount = c; leastId = m.id }
  }

  // Insert new suggestions (skip existing)
  for (const c of candidates) {
    const dateStr = format(c.deadlineDate, 'yyyy-MM-dd')
    const existing = await db.select({ id: suggestions.id }).from(suggestions).where(and(
      eq(suggestions.householdId, householdId), eq(suggestions.sourceModule, c.sourceModule),
      eq(suggestions.sourceEntityId, c.sourceEntityId), eq(suggestions.sourceField, c.sourceField),
      eq(suggestions.deadlineDate, dateStr)
    )).limit(1)
    if (existing.length > 0) continue

    const template = TEMPLATES[c.templateKey]
    const { title, notes } = template(c.context)
    await db.insert(suggestions).values({
      householdId, sourceModule: c.sourceModule, sourceEntityId: c.sourceEntityId,
      sourceField: c.sourceField, deadlineDate: dateStr, suggestedTitle: title,
      suggestedNotes: notes, suggestedOwnerId: leastId, status: 'pending',
    })
  }
}

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
      ownerId: null,
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
