'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers, householdSettings, activityFeed } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ALLOWED_MODULES = ['chores', 'car', 'insurance', 'electronics', 'kids'] as const
export type ModuleKey = (typeof ALLOWED_MODULES)[number]

const updateModulesSchema = z.array(
  z.enum(['chores', 'car', 'insurance', 'electronics', 'kids'])
)

// ---------------------------------------------------------------------------
// updateModules
// ---------------------------------------------------------------------------

export interface UpdateModulesResult {
  success: boolean
  error?: string
}

/**
 * Server Action: Update the active modules for the current user's household.
 *
 * Validates the incoming array, updates household_settings.active_modules,
 * inserts a 'modules_updated' activity_feed event, then revalidates /dashboard
 * so the dashboard Server Component re-renders with the new module set.
 */
export async function updateModules(
  activeModules: string[]
): Promise<UpdateModulesResult> {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const parsed = updateModulesSchema.safeParse(activeModules)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid module selection'
    return { success: false, error: firstError }
  }

  const validModules = parsed.data

  // Get the user's household + current settings
  const memberRow = await db
    .select({
      householdId: householdMembers.householdId,
      displayName: householdMembers.displayName,
    })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  const member = memberRow[0]
  if (!member) {
    return { success: false, error: 'No household found' }
  }

  const { householdId } = member

  // Fetch current active_modules to compute diff for activity event
  const settingsRow = await db
    .select({ activeModules: householdSettings.activeModules })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
    .limit(1)

  const previousModules = (settingsRow[0]?.activeModules ?? []) as string[]
  const addedModules = validModules.filter((m) => !previousModules.includes(m))
  const removedModules = previousModules.filter((m) => !(validModules as string[]).includes(m))

  // Update household_settings
  await db
    .update(householdSettings)
    .set({ activeModules: validModules })
    .where(eq(householdSettings.householdId, householdId))

  // Insert activity_feed event
  await db.insert(activityFeed).values({
    householdId,
    actorId: user.id,
    eventType: 'modules_updated',
    entityType: 'household_settings',
    metadata: {
      actorName: member.displayName ?? user.email ?? 'Someone',
      addedModules,
      removedModules,
    },
  })

  // Revalidate dashboard so it re-renders with updated modules
  revalidatePath('/dashboard')

  return { success: true }
}
