'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  households,
  householdMembers,
  householdSettings,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createHouseholdSchema } from '@/lib/validations/onboarding'
import type { HouseholdType, ModuleKey } from '@/stores/onboarding'

interface CreateHouseholdInput {
  householdName: string
  householdType: HouseholdType
  activeModules: ModuleKey[]
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

  const { householdName, householdType, activeModules } = parsed.data

  // Prevent double-create: check if user already has a household
  const existing = await db
    .select({ id: householdMembers.id })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (existing.length > 0) {
    return { success: false, error: 'Household already exists' }
  }

  // Atomic transaction: household → member (admin) → settings
  try {
    const householdId = await db.transaction(async (tx) => {
      const [household] = await tx
        .insert(households)
        .values({ name: householdName })
        .returning({ id: households.id })

      await tx.insert(householdMembers).values({
        householdId: household.id,
        userId: user.id,
        role: 'admin',
        displayName: user.email ?? user.id,
      })

      await tx.insert(householdSettings).values({
        householdId: household.id,
        householdType,
        activeModules,
      })

      return household.id
    })

    return { success: true, householdId }
  } catch (err) {
    console.error('[createHousehold] transaction failed:', err)
    return { success: false, error: 'Failed to create household. Please try again.' }
  }
}
