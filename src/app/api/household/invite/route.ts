import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdMembers, households, householdInvites } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'

/**
 * POST /api/household/invite
 *
 * Admin sends an email invite to a new member. An invite token is stored in
 * household_invites with the recipient email, and an Inngest job sends the
 * branded email via Resend with a link to /auth/signup?invite=<token>.
 *
 * The invited user signs up with their own email+password, then the auth
 * callback claims the invite token and links them to the household — no
 * Supabase inviteUserByEmail (which would pre-create the account and block
 * a subsequent signUp call on the same email).
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

  // Create invite token in household_invites (7-day expiry)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const [invite] = await db
    .insert(householdInvites)
    .values({
      householdId,
      email,
      invitedBy: user.id,
      expiresAt,
    })
    .returning({ token: householdInvites.token })

  if (!invite) {
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  // Build the sign-up URL that the invited user will land on
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/auth/signup?invite=${invite.token}`

  // Enqueue Inngest event to send the branded invite email via Resend
  await inngest.send({
    name: 'household/invite.created',
    data: {
      email,
      householdName,
      inviteUrl,
    },
  })

  return NextResponse.json({ success: true })
}
