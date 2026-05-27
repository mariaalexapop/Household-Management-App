import { NextResponse } from 'next/server'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers, householdInvites } from '@/lib/db/schema'

/**
 * PKCE OAuth callback handler.
 *
 * Supabase redirects the browser here after Google OAuth or email verification
 * flows. This route exchanges the one-time `code` for a session cookie and
 * routes the user to the correct destination:
 *
 *   - Invited user (invite token in URL) → claim invite, link to household → /dashboard
 *   - Returning user (already has household) → /dashboard
 *   - New user (no household, no invite)  → /onboarding
 *   - Exchange failure                     → /auth/login?error=oauth_failed
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const inviteToken = requestUrl.searchParams.get('invite')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin

  if (!code) {
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

  // --- Invite claim path ---
  // If the signup was initiated from an invite link, claim the token and link
  // the user to the household atomically. The token was threaded through the
  // emailRedirectTo so it arrives here as ?invite=TOKEN.
  if (inviteToken) {
    const [claimedInvite] = await db
      .update(householdInvites)
      .set({ claimedAt: new Date(), claimedBy: user.id })
      .where(
        and(
          eq(householdInvites.token, inviteToken),
          isNull(householdInvites.claimedAt),
          gt(householdInvites.expiresAt, new Date())
        )
      )
      .returning()

    if (claimedInvite) {
      const meta = user.user_metadata ?? {}
      await db
        .insert(householdMembers)
        .values({
          householdId: claimedInvite.householdId,
          userId: user.id,
          role: 'member',
          displayName: meta.full_name ?? meta.name ?? user.email ?? user.id,
          avatarUrl: meta.avatar_url ?? meta.picture ?? null,
        })
        .onConflictDoNothing()

      return NextResponse.redirect(`${appUrl}/dashboard`)
    }

    // Token expired or already claimed — continue to normal routing below
    console.warn('[auth/callback] invite token invalid or already claimed:', inviteToken)
  }

  // --- Normal post-auth routing ---
  // Use Drizzle (bypasses RLS) because the self-referential RLS policy on
  // household_members can return empty results for a freshly authenticated session.
  const memberRows = await db
    .select({
      householdId: householdMembers.householdId,
      avatarUrl: householdMembers.avatarUrl,
      displayName: householdMembers.displayName,
    })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (memberRows.length > 0) {
    // Backfill avatar/name from Google if not yet set
    const meta = user.user_metadata ?? {}
    const googleAvatar = meta.avatar_url ?? meta.picture ?? null
    const googleName = meta.full_name ?? meta.name ?? null
    const updates: Record<string, string> = {}
    if (!memberRows[0].avatarUrl && googleAvatar) updates.avatarUrl = googleAvatar
    if (memberRows[0].displayName === user.email && googleName) updates.displayName = googleName
    if (Object.keys(updates).length > 0) {
      await db.update(householdMembers).set(updates).where(eq(householdMembers.userId, user.id))
    }
    return NextResponse.redirect(`${appUrl}/dashboard`)
  }

  return NextResponse.redirect(`${appUrl}/onboarding`)
}
