'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { tasks, choreAreas, householdMembers, activityFeed } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1),
  on_day_of_month: z.number().int().min(1).max(31).optional().nullable(),
  on_day_of_week: z.number().int().min(0).max(6).optional().nullable(),
})

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(200, 'Task name must be 200 characters or fewer'),
  notes: z.string().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  startsAt: z.string().datetime({ offset: true }), // ISO 8601 with timezone
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema.optional().nullable(),
  reminderOffsetMinutes: z
    .number()
    .int()
    .refine((v) => [60, 180, 1440, 2880].includes(v), {
      message: 'Reminder must be 60, 180, 1440, or 2880 minutes',
    })
    .optional()
    .nullable(),
})

const updateTaskSchema = createTaskSchema.extend({
  id: z.string().uuid(),
})

const updateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'done']),
})

const createChoreAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(100, 'Area name must be 100 characters or fewer'),
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

/** Gets the current user's householdId from household_members. Returns null if not found. */
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

export async function createTask(
  data: unknown
): Promise<ActionResult<{ id: string; householdId: string; title: string; status: string; startsAt: Date | null }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = createTaskSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  const { title, notes, areaId, ownerId, startsAt, endsAt, isRecurring, recurrenceRule, reminderOffsetMinutes } = parsed.data
  const resolvedOwnerId = ownerId ?? user.id

  const [newTask] = await db
    .insert(tasks)
    .values({
      householdId,
      title,
      notes: notes ?? null,
      areaId: areaId ?? null,
      ownerId: resolvedOwnerId,
      status: 'todo',
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      isRecurring: isRecurring ?? false,
      recurrenceRule: recurrenceRule ?? null,
      parentTaskId: null,
      createdBy: user.id,
      reminderOffsetMinutes: reminderOffsetMinutes ?? null,
    })
    .returning()

  // Activity feed — task created
  await db.insert(activityFeed).values({
    householdId,
    actorId: user.id,
    eventType: 'task_created',
    entityType: 'task',
    entityId: newTask.id,
    metadata: { title },
  })

  const hasInngest = !!process.env.INNGEST_EVENT_KEY

  // Assignment notification (if assigned to someone other than creator)
  if (resolvedOwnerId !== user.id) {
    if (hasInngest) {
      await inngest.send({
        name: 'chore/task.assigned',
        data: {
          taskId: newTask.id,
          householdId,
          ownerId: resolvedOwnerId,
          taskTitle: title,
          assignedBy: user.id,
        },
      })
    }
    await db.insert(activityFeed).values({
      householdId,
      actorId: user.id,
      eventType: 'task_assigned',
      entityType: 'task',
      entityId: newTask.id,
      metadata: { title, ownerId: resolvedOwnerId },
    })
  }

  // Recurring task: fire background event to generate occurrence rows
  if (isRecurring && recurrenceRule && hasInngest) {
    await inngest.send({
      name: 'chore/task.recurring.created',
      data: { taskId: newTask.id, householdId },
    })
  }

  // Due-date reminder: schedule for tasks with an owner
  if (resolvedOwnerId && hasInngest) {
    await inngest.send({
      name: 'chore/task.reminder.scheduled',
      data: {
        taskId: newTask.id,
        householdId,
        ownerId: resolvedOwnerId,
        taskTitle: title,
        startsAt: new Date(startsAt).toISOString(),
        reminderOffsetMinutes: reminderOffsetMinutes ?? 1440,
      },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/chores')

  return {
    success: true,
    data: {
      id: newTask.id,
      householdId: newTask.householdId,
      title: newTask.title,
      status: newTask.status,
      startsAt: newTask.startsAt,
    },
  }
}

export async function updateTask(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = updateTaskSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  const { id, title, notes, areaId, ownerId, startsAt, endsAt, reminderOffsetMinutes } = parsed.data

  // Fetch current task to detect owner change
  const [currentTask] = await db
    .select({ ownerId: tasks.ownerId })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.householdId, householdId)))
    .limit(1)
  if (!currentTask) return { success: false, error: 'Task not found' }

  const newOwnerId = ownerId ?? null

  await db
    .update(tasks)
    .set({
      title,
      notes: notes ?? null,
      areaId: areaId ?? null,
      ownerId: newOwnerId,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      reminderOffsetMinutes: reminderOffsetMinutes ?? null,
    })
    .where(and(eq(tasks.id, id), eq(tasks.householdId, householdId)))

  // Fire assignment event if owner changed to a different user
  if (newOwnerId && newOwnerId !== currentTask.ownerId && newOwnerId !== user.id) {
    if (process.env.INNGEST_EVENT_KEY) {
      await inngest.send({
        name: 'chore/task.assigned',
        data: {
          taskId: id,
          householdId,
          ownerId: newOwnerId,
          taskTitle: title,
          assignedBy: user.id,
        },
      })
    }
    await db.insert(activityFeed).values({
      householdId,
      actorId: user.id,
      eventType: 'task_assigned',
      entityType: 'task',
      entityId: id,
      metadata: { title, ownerId: newOwnerId },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/chores')

  return { success: true, data: { id } }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  // Delete all occurrence rows first (parentTaskId = id), then the parent
  await db.delete(tasks).where(and(eq(tasks.parentTaskId, id), eq(tasks.householdId, householdId)))
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.householdId, householdId)))

  revalidatePath('/dashboard')
  revalidatePath('/chores')

  return { success: true }
}

export async function updateTaskStatus(
  data: unknown
): Promise<ActionResult<{ id: string; status: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = updateTaskStatusSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  const { id, status } = parsed.data
  const [updatedTask] = await db
    .update(tasks)
    .set({ status })
    .where(and(eq(tasks.id, id), eq(tasks.householdId, householdId)))
    .returning({ id: tasks.id, title: tasks.title, status: tasks.status })

  if (!updatedTask) return { success: false, error: 'Task not found' }

  if (status === 'done') {
    await db.insert(activityFeed).values({
      householdId,
      actorId: user.id,
      eventType: 'task_completed',
      entityType: 'task',
      entityId: id,
      metadata: { title: updatedTask.title },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/chores')

  return { success: true, data: { id: updatedTask.id, status: updatedTask.status } }
}

export async function createChoreArea(
  data: unknown
): Promise<ActionResult<{ id: string; name: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const parsed = createChoreAreaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const householdId = await getHouseholdId(user.id)
  if (!householdId) return { success: false, error: 'No household found' }

  const [newArea] = await db
    .insert(choreAreas)
    .values({
      householdId,
      name: parsed.data.name,
      isDefault: false,
    })
    .returning({ id: choreAreas.id, name: choreAreas.name })

  return { success: true, data: { id: newArea.id, name: newArea.name } }
}

export async function seedDefaultAreas(householdId: string): Promise<ActionResult> {
  const defaultAreaNames = ['Kitchen', 'Bedroom', 'Living Room', 'Garden', 'Full House']

  const existing = await db
    .select({ name: choreAreas.name })
    .from(choreAreas)
    .where(eq(choreAreas.householdId, householdId))

  const existingNames = new Set(existing.map((r) => r.name))
  const toInsert = defaultAreaNames.filter((n) => !existingNames.has(n))

  if (toInsert.length === 0) return { success: true }

  await db.insert(choreAreas).values(toInsert.map((name) => ({ householdId, name, isDefault: true })))

  return { success: true }
}

export async function getChoreAreas(): Promise<
  ActionResult<Array<{ id: string; name: string; isDefault: boolean }>>
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
    .select({ id: choreAreas.id, name: choreAreas.name, isDefault: choreAreas.isDefault })
    .from(choreAreas)
    .where(eq(choreAreas.householdId, householdId))
    .orderBy(choreAreas.name)

  return { success: true, data: rows }
}

export async function getHouseholdMembers(): Promise<
  ActionResult<Array<{ id: string; displayName: string | null; avatarUrl: string | null }>>
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
    .select({
      id: householdMembers.id,
      displayName: householdMembers.displayName,
      avatarUrl: householdMembers.avatarUrl,
    })
    .from(householdMembers)
    .where(eq(householdMembers.householdId, householdId))

  return { success: true, data: rows }
}
