import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers, householdInvites } from '@/lib/db/schema'

/**
 * POST /api/household/invite/link
 *
 * Admin generates a shareable invite link (UUID token, 7-day expiry).
 * No email is required — anyone with the link can join.
 *
 * Body: { householdId: string }
 * Response: { inviteUrl: string } | { error: string }
 */
export async function POST(request: NextRequest) {
  // Authenticate caller
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: { householdId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { householdId } = body
  if (!householdId) {
    return NextResponse.json({ error: 'householdId is required' }, { status: 400 })
  }

  // Verify caller is admin of the target household
  const [memberRow] = await db
    .select({ role: householdMembers.role })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.userId, user.id),
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.role, 'admin')
      )
    )
    .limit(1)

  if (!memberRow) {
    return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
  }

  // Generate invite token and set 7-day expiry
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Insert invite row (no email for shareable links)
  await db.insert(householdInvites).values({
    householdId,
    token,
    invitedBy: user.id,
    expiresAt,
    email: null,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/join/${token}`

  return NextResponse.json({ inviteUrl })
}
