import { Resend } from 'resend'
import { inngest } from '@/lib/inngest/client'

/**
 * Inngest function: send-invite-email
 *
 * Triggered by the 'household/invite.created' event.
 * Sends a transactional invite email via Resend.
 *
 * If RESEND_API_KEY is not set (e.g., local dev without email configured),
 * this function logs a warning and exits gracefully — it does NOT throw.
 */
export const sendInviteEmail = inngest.createFunction(
  {
    id: 'send-invite-email',
    name: 'Send Invite Email',
    triggers: [{ event: 'household/invite.created' }],
  },
  async ({ event }: { event: { data: { email: string; householdName: string; inviteUrl?: string } } }) => {
    const { email, householdName, inviteUrl } = event.data

    if (!process.env.RESEND_API_KEY) {
      console.warn(
        '[send-invite-email] RESEND_API_KEY is not set — skipping email send. ' +
          'Set RESEND_API_KEY in your .env.local to enable transactional emails.'
      )
      return { skipped: true, reason: 'RESEND_API_KEY not configured' }
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kinship.app'
    const resend = new Resend(process.env.RESEND_API_KEY)

    const htmlBody = inviteUrl
      ? `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>You've been invited to join ${householdName}</h2>
          <p>Click the button below to accept your invitation and join the household.</p>
          <a href="${inviteUrl}"
             style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px;">
            Or copy this link: <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
          <p style="color: #999; font-size: 12px;">This invitation expires in 7 days.</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>You've been invited to join ${householdName}</h2>
          <p>Check your email for a magic link from Supabase to complete your sign-up and join the household.</p>
          <p style="color: #999; font-size: 12px;">Kinship — Household Management</p>
        </div>
      `

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to join ${householdName}`,
      html: htmlBody,
    })

    if (error) {
      throw new Error(`Failed to send invite email: ${error.message}`)
    }

    return { sent: true, to: email }
  }
)
