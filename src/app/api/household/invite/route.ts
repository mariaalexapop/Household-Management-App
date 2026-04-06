import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { householdMembers, households } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'

/**
 * POST /api/household/invite
 *
 * Admin sends an email invite to a new member via Supabase auth.admin.inviteUserByEmail.
 * An Inngest job is enqueued to send the transactional notification email via Resend.
 *
 * Body: { email: string, householdId: string }
 * Response: { success: true } | { error: string }
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
  let body: { email?: string; householdId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, householdId } = body
  if (!email || !householdId) {
    return NextResponse.json({ error: 'email and householdId are required' }, { status: 400 })
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

  // Fetch household name for the invite email
  const [householdRow] = await db
    .select({ name: households.name })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1)

  const householdName = householdRow?.name ?? 'your household'

  // Send invite via Supabase auth admin (triggers magic link email to the invitee)
  const adminClient = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      household_id: householdId,
      invited_as: 'member',
    },
    redirectTo: `${appUrl}/api/auth/accept-invite`,
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Enqueue Inngest event to send the branded invite notification email
  await inngest.send({
    name: 'household/invite.created',
    data: {
      email,
      householdName,
    },
  })

  return NextResponse.json({ success: true })
}
