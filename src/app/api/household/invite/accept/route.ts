import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'

/**
 * GET /api/household/invite/accept?token=<uuid>
 *
 * Atomically claims a shareable invite link:
 *   UPDATE household_invites
 *   SET claimed_at = NOW(), claimed_by = $userId
 *   WHERE token = $token
 *     AND claimed_at IS NULL
 *     AND expires_at > NOW()
 *   RETURNING *
 *
 * If 0 rows returned → link already used or expired → redirect with error.
 * If 1 row returned  → insert household_members, redirect to /dashboard.
 *
 * The user must already be authenticated (they sign up first via Supabase auth,
 * then visit this URL).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invite_invalid', request.url))
  }

  // Authenticate current user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    // Not logged in — send them to signup with token so they come back after auth
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    return NextResponse.redirect(
      new URL(`/auth/signup?invite=${token}`, appUrl)
    )
  }

  // Perform atomic claim using service-role admin client to bypass RLS
  // (the household_invites table has no UPDATE RLS policy by design)
  const adminClient = createAdminClient()

  const { data: claimedRows, error: claimError } = await adminClient
    .from('household_invites')
    .update({ claimed_at: new Date().toISOString(), claimed_by: user.id })
    .is('claimed_at', null)
    .gt('expires_at', new Date().toISOString())
    .eq('token', token)
    .select()

  if (claimError) {
    console.error('[accept-invite] Claim error:', claimError)
    return NextResponse.redirect(new URL('/auth/login?error=invite_invalid', request.url))
  }

  if (!claimedRows || claimedRows.length === 0) {
    // 0 rows → link already used OR expired
    return NextResponse.redirect(new URL('/auth/login?error=invite_invalid', request.url))
  }

  const invite = claimedRows[0]

  // Only insert if not already a member (prevents duplicate rows)
  const [existingMember] = await db
    .select({ id: householdMembers.id })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.householdId, invite.household_id),
        eq(householdMembers.userId, user.id)
      )
    )
    .limit(1)

  if (!existingMember) {
    await db
      .insert(householdMembers)
      .values({
        householdId: invite.household_id,
        userId: user.id,
        role: 'member',
        displayName: user.email ?? user.id,
      })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(new URL('/dashboard', appUrl))
}
