import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PKCE OAuth callback handler.
 *
 * Supabase redirects the browser here after Google OAuth or email magic-link
 * flows. This route exchanges the one-time `code` from the URL for a full
 * session cookie and then redirects the user to the correct destination:
 *
 *   - New user (no household)  → /onboarding
 *   - Returning user           → /dashboard
 *   - Exchange failure         → /auth/login?error=oauth_failed
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin

  if (!code) {
    // No code parameter — redirect back to login with an error
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message)
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
  }

  // If the caller provided an explicit `next` destination, honour it
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Determine the correct landing page based on whether the user already has
  // a household. New users are sent through the onboarding wizard; returning
  // users go straight to the dashboard.
  const userId = data.session.user.id

  const { data: members } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)

  const hasHousehold = Array.isArray(members) && members.length > 0
  const destination = hasHousehold ? '/dashboard' : '/onboarding'

  return NextResponse.redirect(`${origin}${destination}`)
}
