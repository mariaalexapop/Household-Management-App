'use server'

import { z } from 'zod'
import { eq, and, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { addYears } from 'date-fns'
import { db } from '@/lib/db'
import { children, kidActivities, householdMembers, activityFeed } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { generateOccurrences, type RecurrenceRule } from '@/lib/chores/recurrence'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1),
  on_day_of_month: z.number().int().min(1).max(31).optional().nullable(),
  on_day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  recurrence_end_date: z.string().optional().nullable(),
})

const createChildSchema = z.object({
  name: z.string().min(1, 'Child name is required').max(100, 'Child name must be 100 characters or fewer'),
})

const createActivitySchema = z.object({
  childId: z.string().uuid('Child is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  category: z.enum(['school', 'medical', 'sport', 'hobby', 'social']),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  reminderOffsetMinutes: z
    .number()
    .int()
    .refine((v) => [30, 60, 180, 1440, 2880].includes(v), {
      message: 'Reminder must be 30, 60, 180, 1440, or 2880 minutes',
    })
    .optional()
    .nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema.optional().nullable(),
})

const updateActivitySchema = createActivitySchema.extend({
  id: z.string().uuid(),
})

const deleteActivitySchema = z.object({
  id: z.string().uuid(),
  deleteFuture: z.boolean().optional().default(false),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

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

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function createChild(data: unknown): Promise<ActionResult<{ id: string; name: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createChildSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [newChild] = await db
    .insert(children)
    .values({
      householdId: memberRow.householdId,
      name: parsed.data.name,
    })
    .returning()

  revalidatePath('/kids')

  return { success: true, data: { id: newChild.id, name: newChild.name } }
}

export async function createActivity(
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

  const parsed = createActivitySchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [newActivity] = await db
    .insert(kidActivities)
    .values({
      householdId: memberRow.householdId,
      childId: parsed.data.childId,
      title: parsed.data.title,
      category: parsed.data.category,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      location: parsed.data.location ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
      notes: parsed.data.notes ?? null,
      reminderOffsetMinutes: parsed.data.reminderOffsetMinutes ?? null,
      isRecurring: parsed.data.isRecurring ?? false,
      recurrenceRule: parsed.data.recurrenceRule ?? null,
      parentActivityId: null,
      createdBy: user.id,
    })
    .returning({ id: kidActivities.id })

  const hasInngest = !!process.env.INNGEST_EVENT_KEY

  if (parsed.data.isRecurring && hasInngest) {
    await inngest.send({
      name: 'kids/activity.recurring.created',
      data: { activityId: newActivity.id, householdId: memberRow.householdId },
    })
  }

  if (hasInngest) {
    await inngest.send({
      name: 'kids/activity.reminder.scheduled',
      data: {
        activityId: newActivity.id,
        householdId: memberRow.householdId,
        assigneeId: parsed.data.assigneeId ?? memberRow.id,
        activityTitle: parsed.data.title,
        startsAt: parsed.data.startsAt,
        reminderOffsetMinutes: parsed.data.reminderOffsetMinutes ?? 1440,
      },
    })
  }

  await db.insert(activityFeed).values({
    householdId: memberRow.householdId,
    actorId: user.id,
    eventType: 'activity_created',
    entityType: 'kid_activity',
    entityId: newActivity.id,
    metadata: { title: parsed.data.title, childId: parsed.data.childId },
  })

  revalidatePath('/kids')
  revalidatePath('/calendar')

  return { success: true, data: { id: newActivity.id } }
}

export async function updateActivity(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = updateActivitySchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Verify the activity belongs to this household
  const [existingActivity] = await db
    .select({
      id: kidActivities.id,
      parentActivityId: kidActivities.parentActivityId,
      isRecurring: kidActivities.isRecurring,
    })
    .from(kidActivities)
    .where(and(eq(kidActivities.id, parsed.data.id), eq(kidActivities.householdId, memberRow.householdId)))
    .limit(1)

  if (!existingActivity) return { success: false, error: 'Activity not found' }

  const updateValues = {
    childId: parsed.data.childId,
    title: parsed.data.title,
    category: parsed.data.category,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    location: parsed.data.location ?? null,
    assigneeId: parsed.data.assigneeId ?? null,
    notes: parsed.data.notes ?? null,
    reminderOffsetMinutes: parsed.data.reminderOffsetMinutes ?? null,
    isRecurring: parsed.data.isRecurring ?? false,
    recurrenceRule: parsed.data.recurrenceRule ?? null,
  }

  await db
    .update(kidActivities)
    .set(updateValues)
    .where(eq(kidActivities.id, parsed.data.id))

  // If this is a recurring occurrence, also update all future siblings
  if (existingActivity.parentActivityId) {
    await db
      .update(kidActivities)
      .set(updateValues)
      .where(
        and(
          eq(kidActivities.parentActivityId, existingActivity.parentActivityId),
          gte(kidActivities.startsAt, new Date(parsed.data.startsAt))
        )
      )
  }

  // If recurrence was just enabled, generate occurrence rows synchronously
  const becameRecurring = parsed.data.isRecurring && !existingActivity.isRecurring

  if (becameRecurring && parsed.data.recurrenceRule) {
    const rule = parsed.data.recurrenceRule as RecurrenceRule
    const startDate = new Date(parsed.data.startsAt)
    const windowEnd = addYears(startDate, 1)
    const occurrenceDates = generateOccurrences(rule, startDate, windowEnd)

    if (occurrenceDates.length > 0) {
      const occurrenceRows = occurrenceDates.map((date) => ({
        householdId: memberRow.householdId,
        childId: parsed.data.childId,
        title: parsed.data.title,
        category: parsed.data.category,
        location: parsed.data.location ?? null,
        assigneeId: parsed.data.assigneeId ?? null,
        startsAt: date,
        endsAt: parsed.data.endsAt
          ? new Date(new Date(parsed.data.endsAt).getTime() - startDate.getTime() + date.getTime())
          : null,
        notes: parsed.data.notes ?? null,
        reminderOffsetMinutes: parsed.data.reminderOffsetMinutes ?? null,
        isRecurring: true,
        recurrenceRule: parsed.data.recurrenceRule,
        parentActivityId: parsed.data.id,
        createdBy: user.id,
      }))

      await db.insert(kidActivities).values(occurrenceRows)
    }
  }

  await db.insert(activityFeed).values({
    householdId: memberRow.householdId,
    actorId: user.id,
    eventType: 'activity_updated',
    entityType: 'kid_activity',
    entityId: parsed.data.id,
    metadata: { title: parsed.data.title, childId: parsed.data.childId },
  })

  revalidatePath('/kids')
  revalidatePath('/calendar')

  return { success: true, data: { id: parsed.data.id } }
}

export async function deleteActivity(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = deleteActivitySchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Fetch the activity to verify ownership and get parentActivityId + startsAt
  const [activityRow] = await db
    .select({
      id: kidActivities.id,
      title: kidActivities.title,
      parentActivityId: kidActivities.parentActivityId,
      startsAt: kidActivities.startsAt,
      householdId: kidActivities.householdId,
    })
    .from(kidActivities)
    .where(and(eq(kidActivities.id, parsed.data.id), eq(kidActivities.householdId, memberRow.householdId)))
    .limit(1)

  if (!activityRow) return { success: false, error: 'Activity not found' }

  if (parsed.data.deleteFuture) {
    // Delete this occurrence and all future siblings
    await db
      .delete(kidActivities)
      .where(
        and(
          eq(kidActivities.parentActivityId, activityRow.parentActivityId ?? activityRow.id),
          gte(kidActivities.startsAt, activityRow.startsAt)
        )
      )
  } else {
    // Delete only the single occurrence
    await db.delete(kidActivities).where(eq(kidActivities.id, parsed.data.id))
  }

  await db.insert(activityFeed).values({
    householdId: memberRow.householdId,
    actorId: user.id,
    eventType: 'activity_completed',
    entityType: 'kid_activity',
    entityId: parsed.data.id,
    metadata: { title: activityRow.title },
  })

  revalidatePath('/kids')
  revalidatePath('/calendar')

  return { success: true }
}
