import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers, households } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { MembersList } from '@/components/household/MembersList'
import { InviteModal } from '@/components/household/InviteModal'
import { ProfileForm } from '@/components/household/ProfileForm'

export const metadata = {
  title: 'Household — Kinship',
}

/**
 * Household management page — Server Component
 *
 * Shows:
 *   - Members list (all members with avatars, roles, joined dates)
 *   - Invite modal (admin only)
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
    .limit(1)

  const currentMember = memberRows[0]

  if (!currentMember) {
    redirect('/onboarding')
  }

  const { householdId, householdName } = currentMember
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
    .orderBy(householdMembers.joinedAt)

  return (
    <div className="min-h-screen bg-kinship-surface">
      {/* Header */}
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
          <p className="font-body text-sm text-kinship-on-surface/60">{householdName}</p>
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
