import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers, householdInvites, activityFeed } from '@/lib/db/schema'

/**
 * DELETE /api/household/invites/[inviteId]
 *
 * Admin revokes a pending invite.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the invite
  const [invite] = await db
    .select({
      id: householdInvites.id,
      householdId: householdInvites.householdId,
      email: householdInvites.email,
      claimedAt: householdInvites.claimedAt,
    })
    .from(householdInvites)
    .where(eq(householdInvites.id, inviteId))
    .limit(1)

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.claimedAt) {
    return NextResponse.json({ error: 'Invite has already been accepted' }, { status: 400 })
  }

  // Verify caller is admin of the household
  const [callerMember] = await db
    .select({ role: householdMembers.role, displayName: householdMembers.displayName })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.userId, user.id),
        eq(householdMembers.householdId, invite.householdId),
        eq(householdMembers.role, 'admin')
      )
    )
    .limit(1)

  if (!callerMember) {
    return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
  }

  // Delete the invite
  await db.delete(householdInvites).where(eq(householdInvites.id, inviteId))

  // Record activity
  await db.insert(activityFeed).values({
    householdId: invite.householdId,
    actorId: user.id,
    eventType: 'invite_revoked',
    entityType: 'invite',
    metadata: {
      actorName: callerMember.displayName ?? user.email ?? 'Someone',
      revokedEmail: invite.email ?? 'invite link',
    },
  })

  return NextResponse.json({ success: true })
}
