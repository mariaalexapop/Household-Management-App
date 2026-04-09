import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { insurancePolicies, notifications } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// 1. Insurance Expiry Reminder
// ---------------------------------------------------------------------------

/**
 * Inngest function: send-insurance-expiry-reminder
 *
 * Triggered by the 'insurance/expiry.reminder.scheduled' event.
 * 1. Sleeps until expiryDate - reminderDays * days.
 * 2. Re-checks the DB to verify the expiry date is unchanged and policy exists.
 * 3. Inserts a notification row for the policy creator.
 * 4. Sends a reminder email via Resend.
 */
export const sendInsuranceExpiryReminder = inngest.createFunction(
  {
    id: 'send-insurance-expiry-reminder',
    name: 'Send Insurance Expiry Reminder',
    triggers: [{ event: 'insurance/expiry.reminder.scheduled' }],
  },
  async ({ event, step }: {
    event: {
      data: {
        policyId: string
        householdId: string
        expiryDate: string
        reminderDays: number
        createdBy: string
      }
    }
    step: any
  }) => {
    const { policyId, householdId, expiryDate, reminderDays, createdBy } = event.data

    // Step 1: sleep until reminder time
    const expiryMs = new Date(expiryDate).getTime()
    const offsetMs = reminderDays * 24 * 60 * 60 * 1000
    const remindAt = new Date(expiryMs - offsetMs)

    await step.sleepUntil('wait-for-expiry-reminder-time', remindAt)

    // Step 2: re-check DB — verify policy still exists and expiry date unchanged
    const currentPolicy = await step.run('recheck-policy-expiry', async () => {
      const rows = await db
        .select({
          id: insurancePolicies.id,
          expiryDate: insurancePolicies.expiryDate,
          insurer: insurancePolicies.insurer,
          policyType: insurancePolicies.policyType,
        })
        .from(insurancePolicies)
        .where(eq(insurancePolicies.id, policyId))
        .limit(1)
      return rows[0] ?? null
    })

    if (!currentPolicy) {
      return { skipped: true, reason: 'Policy deleted' }
    }

    if (currentPolicy.expiryDate.toISOString() !== new Date(expiryDate).toISOString()) {
      return { skipped: true, reason: 'Expiry date changed' }
    }

    const message = `${currentPolicy.insurer} ${currentPolicy.policyType} policy expires in ${reminderDays} days`

    // Step 3: insert notification row
    await step.run('insert-expiry-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: createdBy,
        type: 'insurance_expiry_reminder',
        entityId: policyId,
        message,
      })
    })

    // Step 4: send email if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-insurance-expiry-reminder] RESEND_API_KEY not set — skipping email.')
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
      subject: `Reminder: ${currentPolicy.insurer} ${currentPolicy.policyType} policy expires in ${reminderDays} days`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Your insurance policy is expiring soon. Consider reviewing and renewing it.</p>
          <a href="${appUrl}/insurance"
             style="display: inline-block; background: #0053dc; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View insurance policies
          </a>
          <p style="color: #999; font-size: 12px;">Kinship — Household Management</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(`Failed to send insurance expiry reminder email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)

// ---------------------------------------------------------------------------
// 2. Insurance Payment Reminder
// ---------------------------------------------------------------------------

/**
 * Inngest function: send-insurance-payment-reminder
 *
 * Triggered by the 'insurance/payment.reminder.scheduled' event.
 * 1. Sleeps until nextPaymentDate - reminderDays * days.
 * 2. Re-checks the DB to verify the payment date is unchanged and policy exists.
 * 3. Inserts a notification row for the policy creator.
 * 4. Sends a reminder email via Resend.
 */
export const sendInsurancePaymentReminder = inngest.createFunction(
  {
    id: 'send-insurance-payment-reminder',
    name: 'Send Insurance Payment Reminder',
    triggers: [{ event: 'insurance/payment.reminder.scheduled' }],
  },
  async ({ event, step }: {
    event: {
      data: {
        policyId: string
        householdId: string
        nextPaymentDate: string
        reminderDays: number
        createdBy: string
      }
    }
    step: any
  }) => {
    const { policyId, householdId, nextPaymentDate, reminderDays, createdBy } = event.data

    // Step 1: sleep until reminder time
    const paymentMs = new Date(nextPaymentDate).getTime()
    const offsetMs = reminderDays * 24 * 60 * 60 * 1000
    const remindAt = new Date(paymentMs - offsetMs)

    await step.sleepUntil('wait-for-payment-reminder-time', remindAt)

    // Step 2: re-check DB — verify policy still exists and payment date unchanged
    const currentPolicy = await step.run('recheck-policy-payment', async () => {
      const rows = await db
        .select({
          id: insurancePolicies.id,
          nextPaymentDate: insurancePolicies.nextPaymentDate,
          insurer: insurancePolicies.insurer,
          policyType: insurancePolicies.policyType,
        })
        .from(insurancePolicies)
        .where(eq(insurancePolicies.id, policyId))
        .limit(1)
      return rows[0] ?? null
    })

    if (!currentPolicy) {
      return { skipped: true, reason: 'Policy deleted' }
    }

    if (
      !currentPolicy.nextPaymentDate ||
      currentPolicy.nextPaymentDate.toISOString() !== new Date(nextPaymentDate).toISOString()
    ) {
      return { skipped: true, reason: 'Payment date changed' }
    }

    const message = `${currentPolicy.insurer} premium payment due in ${reminderDays} days`

    // Step 3: insert notification row
    await step.run('insert-payment-notification', async () => {
      await db.insert(notifications).values({
        householdId,
        userId: createdBy,
        type: 'insurance_payment_reminder',
        entityId: policyId,
        message,
      })
    })

    // Step 4: send email if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-insurance-payment-reminder] RESEND_API_KEY not set — skipping email.')
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
      subject: `Reminder: ${currentPolicy.insurer} premium payment due in ${reminderDays} days`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${message}</h2>
          <p>Your insurance premium payment is due soon.</p>
          <a href="${appUrl}/insurance"
             style="display: inline-block; background: #0053dc; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            View insurance policies
          </a>
          <p style="color: #999; font-size: 12px;">Kinship — Household Management</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(`Failed to send insurance payment reminder email: ${error.message}`)
    }

    return { sent: true, to: recipientEmail }
  }
)
