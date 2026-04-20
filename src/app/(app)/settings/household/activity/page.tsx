import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityFeed, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ActivityFeed } from '@/components/household/ActivityFeed'
import type { ActivityFeedItem } from '@/components/realtime/RealtimeProvider'
import { AppHeader } from '@/components/nav/AppHeader'

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
    <div className="min-h-screen bg-kinship-surface">
      <AppHeader subtitle="All Activity" />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-kinship-primary hover:underline">
          ← Go back to main dashboard
        </a>
        <h2 className="font-display text-xl font-semibold text-kinship-on-surface mb-4">
          All Activity
        </h2>
        <ActivityFeed initialItems={initialFeedItems} />
      </main>
    </div>
  )
}
