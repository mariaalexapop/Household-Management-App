import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityFeed, householdMembers, householdSettings, households } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { MembersList } from '@/components/household/MembersList'
import { InviteModal } from '@/components/household/InviteModal'
import { ActivityFeedPreview } from './ActivityFeedPreview'
import { ModuleToggleList } from '../modules/ModuleToggleList'
import { AppHeader } from '@/components/nav/AppHeader'
import type { ActivityFeedItem } from '@/components/realtime/RealtimeProvider'

export const metadata = {
  title: 'Household — Kinship',
}

const MODULE_LABELS: Record<string, string> = {
  chores: 'Chores',
  car: 'Car & Vehicle',
  insurance: 'Insurance',
  electronics: 'Electronics',
  kids: 'Kids & Activities',
}

/**
 * Household management page — Server Component (tab within Settings)
 *
 * Shows:
 *   - Members list (all members with avatars, roles, joined dates)
 *   - Invite modal (admin only)
 *   - Modules toggle list
 *   - Activity feed preview (5 items + view all link)
 */
export default async function HouseholdSettingsPage() {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch household + current member
  const memberRows = await db
    .select({
      memberId: householdMembers.id,
      memberUserId: householdMembers.userId,
      memberRole: householdMembers.role,
      memberDisplayName: householdMembers.displayName,
      memberAvatarUrl: householdMembers.avatarUrl,
      memberJoinedAt: householdMembers.joinedAt,
      householdId: households.id,
      householdName: households.name,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, user.id))
    .orderBy(sql`CASE ${householdMembers.role} WHEN 'admin' THEN 0 ELSE 1 END`)
    .limit(1)

  const currentMember = memberRows[0]

  if (!currentMember) {
    redirect('/onboarding')
  }

  const { householdId } = currentMember
  const isAdmin = currentMember.memberRole === 'admin'

  // Fetch all members of this household
  const allMembers = await db
    .select({
      id: householdMembers.id,
      userId: householdMembers.userId,
      displayName: householdMembers.displayName,
      avatarUrl: householdMembers.avatarUrl,
      role: householdMembers.role,
      joinedAt: householdMembers.joinedAt,
    })
    .from(householdMembers)
    .where(eq(householdMembers.householdId, householdId))
    .orderBy(sql`CASE ${householdMembers.role} WHEN 'admin' THEN 0 ELSE 1 END`, householdMembers.joinedAt)

  // Fetch household settings for modules
  const settingsRows = await db
    .select({ activeModules: householdSettings.activeModules })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
    .limit(1)

  const activeModules = (settingsRows[0]?.activeModules ?? []) as string[]

  // Fetch initial activity feed items (most recent 20 for realtime merge, preview shows 5)
  const feedRows = await db
    .select({
      id: activityFeed.id,
      householdId: activityFeed.householdId,
      actorId: activityFeed.actorId,
      eventType: activityFeed.eventType,
      entityType: activityFeed.entityType,
      entityId: activityFeed.entityId,
      metadata: activityFeed.metadata,
      createdAt: activityFeed.createdAt,
    })
    .from(activityFeed)
    .where(eq(activityFeed.householdId, householdId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(20)

  const initialFeedItems: ActivityFeedItem[] = feedRows.map((row) => ({
    id: row.id,
    householdId: row.householdId,
    actorId: row.actorId,
    eventType: row.eventType,
    entityType: row.entityType,
    entityId: row.entityId ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  return (
    <div className="min-h-screen bg-kinship-surface">
      <AppHeader subtitle="Settings" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-10">
        <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-kinship-primary hover:underline">
          ← Go back to main dashboard
        </a>
        {/* Navigation links */}
        <nav className="flex gap-4 text-sm font-medium">
          <Link
            href="/settings"
            className="text-kinship-on-surface-variant hover:text-kinship-on-surface pb-1"
          >
            Profile
          </Link>
          <Link
            href="/settings/household"
            className="text-kinship-primary border-b-2 border-kinship-primary pb-1"
          >
            Household
          </Link>
        </nav>

        {/* Members section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-kinship-on-surface">
              Members
            </h2>
            {isAdmin && <InviteModal householdId={householdId} />}
          </div>

          <MembersList
            members={allMembers}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </section>

        <hr className="border-border" />

        {/* Modules section */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-kinship-on-surface">
              Modules
            </h2>
            <p className="mt-1 text-sm text-kinship-on-surface-variant">
              Enable or disable modules to customise your household dashboard.
            </p>
          </div>

          <ModuleToggleList
            initialActiveModules={activeModules}
            moduleLabels={MODULE_LABELS}
          />
        </section>

        <hr className="border-border" />

        {/* Activity section — preview of 5 items */}
        <section>
          <h2 className="font-display text-xl font-semibold text-kinship-on-surface mb-4">
            Notifications
          </h2>
          <ActivityFeedPreview initialItems={initialFeedItems} />
        </section>
      </main>
    </div>
  )
}
