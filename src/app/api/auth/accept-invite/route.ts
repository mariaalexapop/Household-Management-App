import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'

/**
 * GET /api/auth/accept-invite?code=<pkce-code>
 *
 * Supabase redirects here after a user clicks an email invite magic link
 * (sent via auth.admin.inviteUserByEmail). The URL contains a PKCE code that
 * we exchange for a session. The invited user's household_id is stored in
 * their user_metadata (set at invite time), so we use it to insert them into
 * household_members and then send them straight to the dashboard — no
 * sign-up form or onboarding wizard required.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=invite_invalid`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/accept-invite] exchangeCodeForSession failed:', error?.message)
    return NextResponse.redirect(`${appUrl}/auth/login?error=invite_invalid`)
  }

  const user = data.session.user
  const householdId = user.user_metadata?.household_id as string | undefined

  if (!householdId) {
    // Invite metadata missing — fall back to normal post-login routing
    return NextResponse.redirect(`${appUrl}/dashboard`)
  }

  // Link the newly activated user to their household
  await db
    .insert(householdMembers)
    .values({
      householdId,
      userId: user.id,
      role: 'member',
      displayName: user.email ?? user.id,
    })
    .onConflictDoNothing()

  return NextResponse.redirect(`${appUrl}/dashboard`)
}
