import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DELETE /api/household/gdpr
 *
 * Permanently deletes the authenticated user's account.
 *
 * Cascade chain (set up in migration 01-03):
 *   auth.users deletion
 *     → household_members (FK ON DELETE CASCADE)
 *       → households (if last member — dependent rows cascade)
 *         → household_settings (FK ON DELETE CASCADE)
 *         → household_invites (FK ON DELETE CASCADE)
 *         → activity_feed (FK ON DELETE CASCADE)
 *
 * NOTE: activity_feed.actor_id has NO DB FK (cross-schema constraint).
 * Orphaned actor_id values show "Deleted user" in the feed UI — acceptable.
 *
 * Sends a best-effort confirmation email via Resend.
 * Does NOT fail if email delivery fails.
 */
export async function DELETE() {
  // Authenticate — use getUser() per security conventions
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Delete the user via service-role admin client.
  // This triggers the ON DELETE CASCADE chain in the DB.
  const adminClient = createAdminClient()
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('[gdpr/route] deleteUser error:', deleteError.message)
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    )
  }

  // Best-effort: send confirmation email via Resend.
  // Failure here must NOT cause the endpoint to return an error.
  if (process.env.RESEND_API_KEY && user.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@kinship.app'

      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: 'Your Kinship account has been deleted',
        html: `
          <p>Hello,</p>
          <p>
            Your Kinship account and all associated household data have been
            permanently deleted as requested.
          </p>
          <p>
            If you did not request this deletion or believe this was a mistake,
            please contact us immediately at support@kinship.app.
          </p>
          <p>Thank you for using Kinship.</p>
        `.trim(),
      })
    } catch (emailError) {
      // Log but do not propagate — deletion has already succeeded
      console.warn(
        '[gdpr/route] Confirmation email failed (best-effort):',
        emailError instanceof Error ? emailError.message : emailError
      )
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
