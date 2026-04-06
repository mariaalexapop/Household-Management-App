import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'

/**
 * PKCE OAuth callback handler.
 *
 * Supabase redirects the browser here after Google OAuth or email magic-link
 * flows. This route exchanges the one-time `code` from the URL for a full
 * session cookie and then redirects the user to the correct destination:
 *
 *   - Invited user (household_id in metadata, no household yet) → link to household → /dashboard
 *   - New user (no household)                                   → /onboarding
 *   - Returning user                                            → /dashboard
 *   - Exchange failure                                          → /auth/login?error=oauth_failed
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin

  if (!code) {
    // No code parameter — redirect back to login with an error
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_failed`)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message)
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_failed`)
  }

  // If the caller provided an explicit `next` destination, honour it
  if (next) {
    return NextResponse.redirect(`${appUrl}${next}`)
  }

  const user = data.session.user

  // Check if the user already belongs to a household
  const { data: members } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)

  const hasHousehold = Array.isArray(members) && members.length > 0

  if (hasHousehold) {
    return NextResponse.redirect(`${appUrl}/dashboard`)
  }

  // No household yet — check if they were invited (household_id in user_metadata).
  // This covers the edge case where an invited user signed up via the email+password
  // form instead of clicking the magic link directly.
  const invitedHouseholdId = user.user_metadata?.household_id as string | undefined

  if (invitedHouseholdId) {
    await db
      .insert(householdMembers)
      .values({
        householdId: invitedHouseholdId,
        userId: user.id,
        role: 'member',
        displayName: user.email ?? user.id,
      })
      .onConflictDoNothing()

    return NextResponse.redirect(`${appUrl}/dashboard`)
  }

  // Brand-new user with no invite — send through the onboarding wizard
  return NextResponse.redirect(`${appUrl}/onboarding`)
}
