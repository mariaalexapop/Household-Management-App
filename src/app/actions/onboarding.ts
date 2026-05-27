'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  activityFeed,
  households,
  householdMembers,
  householdSettings,
  householdInvites,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createHouseholdSchema } from '@/lib/validations/onboarding'
import { sendInviteEmail } from '@/lib/email/send-invite'
import type { HouseholdType, ModuleKey } from '@/stores/onboarding'

interface CreateHouseholdInput {
  householdName: string
  householdType: HouseholdType
  activeModules: ModuleKey[]
  inviteEmails?: string[]
}

interface CreateHouseholdResult {
  success: boolean
  householdId?: string
  error?: string
}

export async function createHousehold(
  data: CreateHouseholdInput
): Promise<CreateHouseholdResult> {
  // Authenticate the current user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const parsed = createHouseholdSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const { householdName, householdType, activeModules, inviteEmails } = parsed.data

  // Prevent double-create: check if user already has a household
  const existing = await db
    .select({ id: householdMembers.id })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (existing.length > 0) {
    // User already has a household — treat as success so the client redirects to /dashboard
    return { success: true }
  }

  // Atomic transaction: household → member (admin) → settings → invites
  try {
    const { householdId, inviteTokens } = await db.transaction(async (tx) => {
      const [household] = await tx
        .insert(households)
        .values({ name: householdName })
        .returning({ id: households.id })

      const meta = user.user_metadata ?? {}
      await tx.insert(householdMembers).values({
        householdId: household.id,
        userId: user.id,
        role: 'admin',
        displayName: meta.full_name ?? meta.name ?? user.email ?? user.id,
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
      })

      await tx.insert(householdSettings).values({
        householdId: household.id,
        householdType,
        activeModules,
      })

      // Create invite rows for each email collected during onboarding
      const tokens: { email: string; token: string }[] = []
      if (inviteEmails.length > 0) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const inviteRows = await tx
          .insert(householdInvites)
          .values(
            inviteEmails.map((email) => ({
              householdId: household.id,
              email,
              invitedBy: user.id,
              expiresAt,
            }))
          )
          .returning({ email: householdInvites.email, token: householdInvites.token })

        for (const row of inviteRows) {
          if (row.email && row.token) {
            tokens.push({ email: row.email, token: row.token })
          }
        }

        // Log invite_sent events to activity feed
        await tx.insert(activityFeed).values(
          inviteEmails.map((email) => ({
            householdId: household.id,
            actorId: user.id,
            eventType: 'invite_sent',
            entityType: 'invite',
            metadata: {
              actorName: user.email ?? 'Someone',
              invitedEmail: email,
            },
          }))
        )
      }

      return { householdId: household.id, inviteTokens: tokens }
    })

    // Send invite emails directly via Resend (outside transaction)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await Promise.allSettled(
      inviteTokens.map((inv) =>
        sendInviteEmail({
          email: inv.email,
          householdName,
          inviteUrl: `${appUrl}/auth/signup?invite=${inv.token}`,
        })
      )
    )

    return { success: true, householdId }
  } catch (err) {
    console.error('[createHousehold] transaction failed:', err)
    return { success: false, error: 'Failed to create household. Please try again.' }
  }
}
