import { Resend } from 'resend'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { notifications, householdMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inngest function: send-task-assigned-email
 *
 * Triggered by the 'chore/task.assigned' event.
 * 1. Looks up the assigner's display name from household_members.
 * 2. Inserts a notifications row for the recipient (in-app notification).
 * 3. Looks up the recipient's email via the Supabase admin client.
 * 4. Sends an assignment email via Resend.
 *
 * If RESEND_API_KEY is not set (e.g., local dev), logs a warning and returns
 * { skipped: true } — does NOT throw.
 */
export const sendTaskAssignedEmail = inngest.createFunction(
  {
    id: 'send-task-assigned-email',
    name: 'Send Task Assigned Email',
    triggers: [{ event: 'chore/task.assigned' }],
  },
  async ({ event, step }: {
    event: { data: { taskId: string; householdId: string; ownerId: string; taskTitle: string; assignedBy: string } }
    step: any
  }) => {
    const { taskId, householdId, ownerId, taskTitle, assignedBy } = event.data

    // Step 1: get assigner's display name
    const assignerName = await step.run('get-assigner-name', async () => {
      const rows = await db
        .select({ displayName: householdMembers.displayName })
        .from(householdMembers)
        .where(and(eq(householdMembers.userId, assignedBy), eq(householdMembers.householdId, householdId)))
        .limit(1)
      return rows[0]?.displayName ?? 'A household member'
    })

    const message = `${assignerName} assigned you a task: ${taskTitle}`

    // Step 2: insert notification row
    await step.run('insert-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: ownerId,
        type: 'task_assigned',
        entityId: taskId,
        message,
      })
    })

    // Step 3: send email (guard on RESEND_API_KEY)
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-task-assigned-email] RESEND_API_KEY not set — skipping email send.')
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
      subject: `You've been assigned a task: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Log in to Kinship to view and manage your tasks.</p>
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
      throw new Error(`Failed to send assignment email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)
