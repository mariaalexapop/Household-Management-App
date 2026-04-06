import { redirect } from 'next/navigation'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityFeed, householdMembers, households } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { MembersList } from '@/components/household/MembersList'
import { InviteModal } from '@/components/household/InviteModal'
import { ProfileForm } from '@/components/household/ProfileForm'
import { ActivityFeed } from '@/components/household/ActivityFeed'
import type { ActivityFeedItem } from '@/components/realtime/RealtimeProvider'

export const metadata = {
  title: 'Household — Kinship',
}

/**
 * Household management page — Server Component
 *
 * Shows:
 *   - Members list (all members with avatars, roles, joined dates)
 *   - Invite modal (admin only)
 *   - Activity feed (recent household events, updated in real-time)
 *   - Profile settings (display name + avatar upload)
 */
export default async function HouseholdPage() {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch household + all members for the current user
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

  const { householdId, householdName } = currentMember
  const isAdmin = currentMember.memberRole === 'admin'

  // Fetch all members of this household, deduplicated by userId (admin row wins)
  const rawMembers = await db
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

  const seenUserIds = new Set<string>()
  const allMembers = rawMembers.filter((m) => {
    if (seenUserIds.has(m.userId)) return false
    seenUserIds.add(m.userId)
    return true
  })

  // Fetch initial activity feed items (most recent 20)
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
      {/* Header */}
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface/60">{householdName}</p>
          </div>
          <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">
            Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-10">
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

        {/* Divider */}
        <hr className="border-border" />

        {/* Activity section */}
        <section>
          <h2 className="font-display text-xl font-semibold text-kinship-on-surface mb-4">
            Activity
          </h2>
          <ActivityFeed initialItems={initialFeedItems} />
        </section>

        {/* Divider */}
        <hr className="border-border" />

        {/* Profile section */}
        <section>
          <h2 className="font-display text-xl font-semibold text-kinship-on-surface mb-4">
            Your profile
          </h2>
          <ProfileForm
            initialDisplayName={currentMember.memberDisplayName}
            initialAvatarUrl={currentMember.memberAvatarUrl}
          />
        </section>
      </main>
    </div>
  )
}
