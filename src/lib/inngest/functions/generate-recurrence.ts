import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateOccurrences, type RecurrenceRule } from '@/lib/chores/recurrence'
import { addYears } from 'date-fns'

/**
 * Inngest function: generate-recurrence
 *
 * Triggered by 'chore/task.recurring.created'.
 * Fetches the parent task row, computes all occurrence dates for 1 year,
 * and inserts occurrence rows in a single batch.
 *
 * Runs in background — the createTask Server Action returns immediately
 * after creating the parent row and firing this event.
 */
export const generateRecurrence = inngest.createFunction(
  {
    id: 'generate-recurrence',
    name: 'Generate Recurring Task Occurrences',
    triggers: [{ event: 'chore/task.recurring.created' }],
  },
  async ({ event, step }: { event: { data: { taskId: string; householdId: string } }; step: any }) => {
    const { taskId, householdId } = event.data

    // Step 1: fetch the parent task
    const parentTask = await step.run('fetch-parent-task', async () => {
      const rows = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.householdId, householdId)))
        .limit(1)
      return rows[0] ?? null
    })

    if (!parentTask || !parentTask.recurrenceRule || !parentTask.startsAt) {
      console.warn('[generate-recurrence] Parent task not found or missing recurrenceRule', { taskId })
      return { skipped: true }
    }

    const rule = parentTask.recurrenceRule as RecurrenceRule
    const startDate = new Date(parentTask.startsAt)
    const windowEndDate = addYears(startDate, 1)

    // Step 2: compute occurrence dates
    const occurrenceDates = generateOccurrences(rule, startDate, windowEndDate)

    if (occurrenceDates.length === 0) {
      return { inserted: 0 }
    }

    // Step 3: batch insert occurrence rows
    const inserted = await step.run('insert-occurrences', async () => {
      const occurrenceRows = occurrenceDates.map((date) => ({
        householdId: parentTask.householdId,
        title: parentTask.title,
        notes: parentTask.notes,
        areaId: parentTask.areaId,
        ownerId: parentTask.ownerId,
        status: 'todo' as const,
        startsAt: date,
        endsAt: parentTask.endsAt
          ? new Date(new Date(parentTask.endsAt).getTime() - startDate.getTime() + date.getTime())
          : null,
        isRecurring: true,
        recurrenceRule: parentTask.recurrenceRule,
        parentTaskId: parentTask.id,
        createdBy: parentTask.createdBy,
        reminderOffsetMinutes: parentTask.reminderOffsetMinutes,
      }))

      await db.insert(tasks).values(occurrenceRows)
      return occurrenceRows.length
    })

    return { inserted }
  }
)
