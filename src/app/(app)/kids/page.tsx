import { redirect } from 'next/navigation'
import { eq, asc, and, or, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { kidActivities, children, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { KidsClient } from './KidsClient'

export const metadata = { title: 'Kids Activities — Kinship' }

export default async function KidsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  const { householdId } = memberRow

  // Fetch all activities (exclude parent template rows — show only non-recurring OR occurrences that have a parent)
  const allActivities = await db
    .select({
      id: kidActivities.id,
      childId: kidActivities.childId,
      title: kidActivities.title,
      category: kidActivities.category,
      location: kidActivities.location,
      assigneeId: kidActivities.assigneeId,
      startsAt: kidActivities.startsAt,
      endsAt: kidActivities.endsAt,
      notes: kidActivities.notes,
      reminderOffsetMinutes: kidActivities.reminderOffsetMinutes,
      isRecurring: kidActivities.isRecurring,
      recurrenceRule: kidActivities.recurrenceRule,
      parentActivityId: kidActivities.parentActivityId,
      createdBy: kidActivities.createdBy,
    })
    .from(kidActivities)
    .where(
      and(
        eq(kidActivities.householdId, householdId),
        or(eq(kidActivities.isRecurring, false), isNotNull(kidActivities.parentActivityId))
      )
    )
    .orderBy(asc(kidActivities.startsAt))

  const childList = await db
    .select({ id: children.id, name: children.name })
    .from(children)
    .where(eq(children.householdId, householdId))
    .orderBy(children.name)

  const members = await db
    .select({
      id: householdMembers.id,
      displayName: householdMembers.displayName,
      userId: householdMembers.userId,
    })
    .from(householdMembers)
    .where(eq(householdMembers.householdId, householdId))

  return (
    <div className="min-h-screen bg-kinship-surface">
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface/60">Kids Activities</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/calendar" className="font-body text-sm text-kinship-primary hover:underline">
              Calendar
            </a>
            <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">
              Dashboard
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <KidsClient
          initialActivities={allActivities}
          childList={childList}
          members={members}
          currentUserId={user.id}
          householdId={householdId}
        />
      </main>
    </div>
  )
}
