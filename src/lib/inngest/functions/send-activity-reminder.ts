import { Resend } from 'resend'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { notifications, householdMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inngest function: send-activity-reminder
 *
 * Triggered by the 'kids/activity.reminder.scheduled' event.
 * 1. Sleeps until startsAt - reminderOffsetMinutes (so the reminder fires at
 *    the correct time before the activity starts).
 * 2. Resolves the assigneeId (household_members.id) → auth.users.id via lookup.
 * 3. Inserts a notifications row for the assignee (in-app notification).
 * 4. Looks up the recipient email via the Supabase admin client.
 * 5. Sends a reminder email via Resend.
 *
 * If RESEND_API_KEY is not set, logs a warning and returns { skipped: true }.
 */
export const sendActivityReminder = inngest.createFunction(
  {
    id: 'send-activity-reminder',
    name: 'Send Activity Reminder',
    triggers: [{ event: 'kids/activity.reminder.scheduled' }],
  },
  async ({ event, step }: {
    event: {
      data: {
        activityId: string
        householdId: string
        assigneeId: string   // household_members.id (NOT auth.users.id)
        activityTitle: string
        startsAt: string
        reminderOffsetMinutes: number
      }
    }
    step: any
  }) => {
    const { activityId, householdId, assigneeId, activityTitle, startsAt, reminderOffsetMinutes } = event.data

    // Step 1: sleep until reminder time
    const startsAtMs = new Date(startsAt).getTime()
    const offsetMs = reminderOffsetMinutes * 60 * 1000
    const remindAt = new Date(startsAtMs - offsetMs)

    await step.sleepUntil('wait-for-reminder-time', remindAt)

    // Determine a friendly due-time string
    const hoursUntilDue = reminderOffsetMinutes / 60
    const dueString =
      hoursUntilDue <= 1
        ? 'in 1 hour'
        : hoursUntilDue <= 3
          ? `in ${Math.round(hoursUntilDue)} hours`
          : hoursUntilDue <= 24
            ? 'tomorrow'
            : `in ${Math.round(hoursUntilDue / 24)} days`

    const message = `${activityTitle} starts ${dueString}`

    // Step 2: resolve household_members.id → auth.users.id
    const memberRow = await step.run('get-assignee-user-id', async () => {
      const rows = await db
        .select({ userId: householdMembers.userId })
        .from(householdMembers)
        .where(eq(householdMembers.id, assigneeId))
        .limit(1)
      return rows[0] ?? null
    })

    if (!memberRow) return { skipped: true, reason: 'Assignee not found' }

    // Step 3: insert notification row
    await step.run('insert-reminder-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: memberRow.userId,
        type: 'activity_reminder',
        entityId: activityId,
        message,
      })
    })

    // Step 4: send email if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-activity-reminder] RESEND_API_KEY not set — skipping email.')
      return { skipped: true, reason: 'RESEND_API_KEY not configured' }
    }

    const recipientEmail = await step.run('get-recipient-email', async () => {
      const adminClient = createAdminClient()
      const { data } = await adminClient.auth.admin.getUserById(memberRow.userId)
      return data?.user?.email ?? null
    })

    if (!recipientEmail) {
      return { skipped: true, reason: 'Recipient email not found' }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinship.app'
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kinship.app'
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Reminder: ${activityTitle} starts ${dueString}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Don't forget to prepare for this activity.</p>
          <a href="${appUrl}/kids"
             style="display: inline-block; background: #0053dc; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View kids activities
          </a>
          <p style="color: #999; font-size: 12px;">Kinship — Household Management</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(`Failed to send activity reminder email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)
