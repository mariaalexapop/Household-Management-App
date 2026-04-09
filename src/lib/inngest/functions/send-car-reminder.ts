import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { cars, notifications } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Inngest function: send-car-reminder
 *
 * Triggered by the 'car/reminder.scheduled' event.
 * 1. Sleeps until dueDate - reminderDays (so the reminder fires before the key date).
 * 2. CRITICAL: Re-checks the date from DB before sending (handles updates since event was fired).
 * 3. Inserts a notifications row for the car creator (in-app notification).
 * 4. Looks up the recipient email via the Supabase admin client.
 * 5. Sends a reminder email via Resend.
 *
 * If the car was deleted or the date was changed since the event was fired,
 * the reminder is skipped (stale reminders are harmless).
 */
export const sendCarReminder = inngest.createFunction(
  {
    id: 'send-car-reminder',
    name: 'Send Car Key Date Reminder',
    triggers: [{ event: 'car/reminder.scheduled' }],
  },
  async ({ event, step }: {
    event: {
      data: {
        carId: string
        householdId: string
        reminderType: 'mot' | 'tax' | 'service'
        dueDate: string
        reminderDays: number
        createdBy: string
      }
    }
    step: any
  }) => {
    const { carId, householdId, reminderType, dueDate, reminderDays, createdBy } = event.data

    // Step 1: Calculate reminder time and sleep until then
    const remindAt = new Date(new Date(dueDate).getTime() - reminderDays * 24 * 60 * 60 * 1000)
    await step.sleepUntil('wait-for-reminder-time', remindAt)

    // Step 2: CRITICAL — Re-check the date from DB before sending
    const currentCar = await step.run('verify-date-still-valid', async () => {
      const [car] = await db
        .select({
          motDueDate: cars.motDueDate,
          taxDueDate: cars.taxDueDate,
          nextServiceDate: cars.nextServiceDate,
        })
        .from(cars)
        .where(eq(cars.id, carId))
        .limit(1)
      return car ?? null
    })

    if (!currentCar) return { skipped: true, reason: 'Car deleted' }

    // Check if the date we are reminding about still matches
    const currentDate = reminderType === 'mot'
      ? currentCar.motDueDate
      : reminderType === 'tax'
        ? currentCar.taxDueDate
        : currentCar.nextServiceDate

    if (!currentDate || currentDate.toISOString() !== new Date(dueDate).toISOString()) {
      return { skipped: true, reason: 'Date changed since reminder was scheduled' }
    }

    // Build friendly message
    const typeLabel = reminderType === 'mot' ? 'MOT/Inspection' : reminderType === 'tax' ? 'Road Tax' : 'Service'
    const message = `${typeLabel} due in ${reminderDays} days`

    // Step 3: Insert notification row
    await step.run('insert-reminder-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: createdBy,
        type: 'car_reminder',
        entityId: carId,
        message,
      })
    })

    // Step 4: Send email if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-car-reminder] RESEND_API_KEY not set — skipping email.')
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
      subject: `Reminder: ${typeLabel} due in ${reminderDays} days`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Your car has an upcoming ${typeLabel.toLowerCase()} date.</p>
          <a href="${appUrl}/cars"
             style="display: inline-block; background: #0053dc; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View your cars
          </a>
          <p style="color: #999; font-size: 12px;">Kinship — Household Management</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(`Failed to send car reminder email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)
