import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { electronics, notifications } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inngest function: send-warranty-reminder
 *
 * Triggered by the 'electronics/warranty.reminder.scheduled' event.
 * 1. Sleeps until 30 days before warrantyExpiryDate (fixed per ELEC-03).
 * 2. Re-checks that the item still exists and warranty date is unchanged.
 * 3. Inserts a notification row for the creator (in-app notification).
 * 4. Sends a reminder email via Resend.
 */
export const sendWarrantyReminder = inngest.createFunction(
  {
    id: 'send-warranty-reminder',
    name: 'Send Electronics Warranty Expiry Reminder',
    triggers: [{ event: 'electronics/warranty.reminder.scheduled' }],
  },
  async ({ event, step }: {
    event: {
      data: {
        itemId: string
        householdId: string
        warrantyExpiryDate: string
        itemName: string
        createdBy: string
      }
    }
    step: any
  }) => {
    const { itemId, householdId, warrantyExpiryDate, itemName, createdBy } = event.data

    // Fixed 30-day offset per ELEC-03 (not configurable)
    const REMINDER_DAYS = 30
    const expiryMs = new Date(warrantyExpiryDate).getTime()
    const remindAt = new Date(expiryMs - REMINDER_DAYS * 24 * 60 * 60 * 1000)

    await step.sleepUntil('wait-for-reminder-time', remindAt)

    // Re-check: verify item still exists and warranty date unchanged
    const currentItem = await step.run('verify-warranty-still-valid', async () => {
      const [item] = await db
        .select({ warrantyExpiryDate: electronics.warrantyExpiryDate })
        .from(electronics)
        .where(eq(electronics.id, itemId))
        .limit(1)
      return item ?? null
    })

    if (!currentItem) {
      return { skipped: true, reason: 'Item deleted' }
    }

    if (
      !currentItem.warrantyExpiryDate ||
      currentItem.warrantyExpiryDate.toISOString() !== new Date(warrantyExpiryDate).toISOString()
    ) {
      return { skipped: true, reason: 'Warranty date changed' }
    }

    const message = `Warranty for ${itemName} expires in 30 days`

    // Insert in-app notification
    await step.run('insert-warranty-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: createdBy,
        type: 'warranty_reminder',
        entityId: itemId,
        message,
      })
    })

    // Send email if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-warranty-reminder] RESEND_API_KEY not set -- skipping email.')
      return { skipped: true, reason: 'RESEND_API_KEY not configured' }
    }

    const recipientEmail = await step.run('get-recipient-email', async () => {
      const adminClient = createAdminClient()
      const { data } = await adminClient.auth.admin.getUserById(createdBy)
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
      subject: `Warranty Reminder: ${itemName} expires in 30 days`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Check if you need to renew or extend coverage.</p>
          <a href="${appUrl}/electronics"
             style="display: inline-block; background: #0053dc; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View electronics
          </a>
          <p style="color: #999; font-size: 12px;">Kinship -- Household Management</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(`Failed to send warranty reminder email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)
