import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers, activityFeed } from '@/lib/db/schema'

/**
 * DELETE /api/household/members/[memberId]
 *
 * Admin removes a member from the household.
 * Guards:
 *   - Caller must be authenticated
 *   - Caller must be admin of the household
 *   - Caller cannot delete themselves if they are the only admin
 *
 * On success: inserts activity_feed event and returns { success: true }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params

  // Authenticate caller
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the target member row so we know which household they belong to
  const [targetMember] = await db
    .select({
      id: householdMembers.id,
      householdId: householdMembers.householdId,
      userId: householdMembers.userId,
      role: householdMembers.role,
    })
    .from(householdMembers)
    .where(eq(householdMembers.id, memberId))
    .limit(1)

  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Verify caller is admin of the same household
  const [callerMember] = await db
    .select({ role: householdMembers.role })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.userId, user.id),
        eq(householdMembers.householdId, targetMember.householdId),
        eq(householdMembers.role, 'admin')
      )
    )
    .limit(1)

  if (!callerMember) {
    return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
  }

  // Prevent removing your own admin row if you are the only admin
  if (targetMember.userId === user.id && targetMember.role === 'admin') {
    const adminMembers = await db
      .select({ id: householdMembers.id })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, targetMember.householdId),
          eq(householdMembers.role, 'admin')
        )
      )

    if (adminMembers.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove yourself — you are the only admin' },
        { status: 400 }
      )
    }
  }

  // Delete the member
  await db.delete(householdMembers).where(eq(householdMembers.id, memberId))

  // Record activity
  await db.insert(activityFeed).values({
    householdId: targetMember.householdId,
    actorId: user.id,
    eventType: 'member_removed',
    entityType: 'household_member',
    entityId: memberId,
  })

  return NextResponse.json({ success: true })
}
