import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityFeed, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ActivityFeed } from '@/components/household/ActivityFeed'
import type { ActivityFeedItem } from '@/components/realtime/RealtimeProvider'
import { TopBar } from '@/components/nav/TopBar'

export const metadata = {
  title: 'All Activity — Kinship',
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (!memberRow) {
    redirect('/onboarding')
  }

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
    .where(eq(activityFeed.householdId, memberRow.householdId))
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
    <>
      <TopBar title="Activity Feed" />

      <main className="flex-1 overflow-auto px-6 py-2">
        <ActivityFeed initialItems={initialFeedItems} />
      </main>
    </>
  )
}
