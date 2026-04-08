import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { kidActivities } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateOccurrences, type RecurrenceRule } from '@/lib/chores/recurrence'
import { addYears } from 'date-fns'

/**
 * Inngest function: generate-activity-recurrence
 *
 * Triggered by 'kids/activity.recurring.created'.
 * Fetches the parent activity row, computes all occurrence dates for 1 year,
 * and inserts occurrence rows in a single batch.
 *
 * Runs in background — the createActivity Server Action returns immediately
 * after creating the parent row and firing this event.
 */
export const generateActivityRecurrence = inngest.createFunction(
  {
    id: 'generate-activity-recurrence',
    name: 'Generate Recurring Activity Occurrences',
    triggers: [{ event: 'kids/activity.recurring.created' }],
  },
  async ({ event, step }: { event: { data: { activityId: string; householdId: string } }; step: any }) => {
    const { activityId, householdId } = event.data

    // Step 1: fetch the parent activity
    const parent = await step.run('fetch-parent-activity', async () => {
      const rows = await db
        .select()
        .from(kidActivities)
        .where(and(eq(kidActivities.id, activityId), eq(kidActivities.householdId, householdId)))
        .limit(1)
      return rows[0] ?? null
    })

    if (!parent || !parent.recurrenceRule || !parent.startsAt) {
      console.warn('[generate-activity-recurrence] Parent activity not found or missing recurrenceRule', { activityId })
      return { skipped: true }
    }

    const rule = parent.recurrenceRule as RecurrenceRule
    const startDate = new Date(parent.startsAt)
    const windowEndDate = addYears(startDate, 1)

    // Step 2: compute occurrence dates
    const occurrenceDates = generateOccurrences(rule, startDate, windowEndDate)

    if (occurrenceDates.length === 0) {
      return { inserted: 0 }
    }

    // Step 3: batch insert occurrence rows
    const inserted = await step.run('insert-occurrences', async () => {
      const occurrenceRows = occurrenceDates.map((date) => ({
        householdId: parent.householdId,
        childId: parent.childId,
        title: parent.title,
        category: parent.category,
        location: parent.location,
        assigneeId: parent.assigneeId,
        startsAt: date,
        endsAt: parent.endsAt
          ? new Date(new Date(parent.endsAt).getTime() - startDate.getTime() + date.getTime())
          : null,
        notes: parent.notes,
        reminderOffsetMinutes: parent.reminderOffsetMinutes,
        isRecurring: true,
        recurrenceRule: parent.recurrenceRule,
        parentActivityId: parent.id,
        createdBy: parent.createdBy,
      }))

      await db.insert(kidActivities).values(occurrenceRows)
      return occurrenceRows.length
    })

    return { inserted }
  }
)
