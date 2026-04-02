import { Resend } from 'resend'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inngest function: send-task-reminder
 *
 * Triggered by the 'chore/task.reminder.scheduled' event.
 * 1. Sleeps until startsAt - reminderOffsetMinutes (so the reminder fires at
 *    the correct time before the task is due).
 * 2. Inserts a notifications row for the task owner (in-app notification).
 * 3. Looks up the recipient email via the Supabase admin client.
 * 4. Sends a reminder email via Resend.
 *
 * If RESEND_API_KEY is not set, logs a warning and returns { skipped: true }.
 */
export const sendTaskReminder = inngest.createFunction(
  {
    id: 'send-task-reminder',
    name: 'Send Task Due Date Reminder',
    triggers: [{ event: 'chore/task.reminder.scheduled' }],
  },
  async ({ event, step }: {
    event: { data: { taskId: string; householdId: string; ownerId: string; taskTitle: string; startsAt: string; reminderOffsetMinutes: number } }
    step: any
  }) => {
    const { taskId, householdId, ownerId, taskTitle, startsAt, reminderOffsetMinutes } = event.data

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

    const message = `${taskTitle} is due ${dueString}`

    // Step 2: insert notification row
    await step.run('insert-reminder-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: ownerId,
        type: 'task_reminder',
        entityId: taskId,
        message,
      })
    })

    // Step 3: send email if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-task-reminder] RESEND_API_KEY not set — skipping email.')
      return { skipped: true, reason: 'RESEND_API_KEY not configured' }
    }

    const recipientEmail = await step.run('get-recipient-email', async () => {
      const adminClient = createAdminClient()
      const { data } = await adminClient.auth.admin.getUserById(ownerId)
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
      subject: `Reminder: ${taskTitle} is due ${dueString}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Don't forget to complete this task.</p>
          <a href="${appUrl}/chores"
             style="display: inline-block; background: #0053dc; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View your tasks
          </a>
          <p style="color: #999; font-size: 12px;">Kinship — Household Management</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(`Failed to send reminder email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)
