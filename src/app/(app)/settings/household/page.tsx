import { redirect } from 'next/navigation'
import { and, desc, eq, isNull, gt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityFeed, householdInvites, householdMembers, householdSettings, households } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { MembersList } from '@/components/household/MembersList'
import { InviteModal } from '@/components/household/InviteModal'
import { ActivityFeedPreview } from './ActivityFeedPreview'
import { ModuleToggleList } from '../modules/ModuleToggleList'
import { NotificationToggle } from '../NotificationToggle'
import { Label } from '@/components/ui/label'
import { TopBar } from '@/components/nav/TopBar'
import { SettingsSubNav } from '@/components/nav/SettingsSubNav'
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

  // Fetch pending (unclaimed, not expired) invites for this household
  const pendingInviteRows = await db
    .select({
      id: householdInvites.id,
      email: householdInvites.email,
      expiresAt: householdInvites.expiresAt,
    })
    .from(householdInvites)
    .where(
      and(
        eq(householdInvites.householdId, householdId),
        isNull(householdInvites.claimedAt),
        gt(householdInvites.expiresAt, new Date())
      )
    )
    .orderBy(desc(householdInvites.expiresAt))

  const pendingInvites = pendingInviteRows.map((row) => ({
    id: row.id,
    email: row.email,
    expiresAt: row.expiresAt.toISOString(),
  }))

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
    <>
      <TopBar title="Settings" subtitle="Household, members & modules" />

      <div className="flex-1 overflow-auto px-6 py-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
          {/* Left sub-nav — self-aligning column so sticky works within scroll container */}
          <div className="hidden md:block self-start sticky top-2">
            <SettingsSubNav />
          </div>

          {/* Right content */}
          <main className="space-y-10">
            {/* Members section */}
            <section id="members">
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
                pendingInvites={pendingInvites}
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

            {/* Notifications section */}
            <section id="notifications" className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-kinship-on-surface">
                  Notifications
                </h2>
                <p className="mt-1 text-sm text-kinship-on-surface-variant">
                  Manage how you receive notifications
                </p>
              </div>

              {/* Task assignment toggle */}
              <div className="rounded-lg bg-kinship-surface-container-lowest p-4 flex items-center justify-between gap-4">
                <div>
                  <Label
                    htmlFor="email-assign-toggle"
                    className="font-body text-sm font-medium text-kinship-on-surface"
                  >
                    Email me when I&apos;m assigned a task
                  </Label>
                  <p className="font-body text-xs text-kinship-on-surface-variant mt-0.5">
                    Receive an email notification when a household member assigns a task to you.
                  </p>
                </div>
                <NotificationToggle defaultEnabled={true} />
              </div>

              {/* Invitation sent notifications */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold uppercase tracking-wider text-kinship-on-surface-variant">
                    Invitations sent
                  </p>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-lg bg-kinship-surface-container-lowest p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-body text-sm font-medium text-kinship-on-surface">
                          Invitation sent to {invite.email ?? 'invite link'}
                        </p>
                        <p className="font-body text-xs text-kinship-on-surface-variant mt-0.5">
                          Waiting for them to accept and join your household.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 font-body text-xs font-medium text-amber-600">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <hr className="border-border" />

            {/* Activity feed preview */}
            <section>
              <h2 className="font-display text-xl font-semibold text-kinship-on-surface mb-4">
                Recent Activity
              </h2>
              <ActivityFeedPreview initialItems={initialFeedItems} />
            </section>
          </main>
        </div>
      </div>
    </>
  )
}
