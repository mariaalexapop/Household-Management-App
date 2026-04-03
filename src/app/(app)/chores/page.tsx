import { redirect } from 'next/navigation'
import { eq, asc, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tasks, choreAreas, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ChoresClient } from './ChoresClient'
import { seedDefaultAreas } from '@/app/actions/tasks'

export const metadata = { title: 'Home Chores — Kinship' }

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get household
  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  const { householdId } = memberRow

  // Seed default areas (idempotent)
  await seedDefaultAreas(householdId)

  // Parse filter params
  const params = await searchParams
  const statusFilter = params.status ? params.status.split(',') : []
  const areaFilter = params.areaId ?? null
  const sortDir = params.sort === 'desc' ? 'desc' : 'asc'
  const hideDone = params.hideDone === 'true'

  // Query tasks with area join
  const allTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      notes: tasks.notes,
      status: tasks.status,
      startsAt: tasks.startsAt,
      endsAt: tasks.endsAt,
      isRecurring: tasks.isRecurring,
      recurrenceRule: tasks.recurrenceRule,
      parentTaskId: tasks.parentTaskId,
      ownerId: tasks.ownerId,
      areaId: tasks.areaId,
      areaName: choreAreas.name,
      reminderOffsetMinutes: tasks.reminderOffsetMinutes,
      createdBy: tasks.createdBy,
    })
    .from(tasks)
    .leftJoin(choreAreas, eq(tasks.areaId, choreAreas.id))
    .where(eq(tasks.householdId, householdId))
    .orderBy(sortDir === 'asc' ? asc(tasks.startsAt) : desc(tasks.startsAt))

  // Filter in JS (simpler than SQL for multi-value status filter)
  const filtered = allTasks.filter((t) => {
    // Exclude parent template rows (recurring=true AND no parent = template row)
    if (t.isRecurring && t.parentTaskId === null) return false
    if (hideDone && t.status === 'done') return false
    if (statusFilter.length > 0 && !statusFilter.includes(t.status)) return false
    if (areaFilter && t.areaId !== areaFilter) return false
    return true
  })

  // Get areas for filter/form dropdown
  const areas = await db
    .select({ id: choreAreas.id, name: choreAreas.name })
    .from(choreAreas)
    .where(eq(choreAreas.householdId, householdId))
    .orderBy(choreAreas.name)

  // Get members for owner display
  const members = await db
    .select({
      id: householdMembers.id,
      displayName: householdMembers.displayName,
      avatarUrl: householdMembers.avatarUrl,
      userId: householdMembers.userId,
    })
    .from(householdMembers)
    .where(eq(householdMembers.householdId, householdId))

  // Count tasks due this week for subheading
  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueThisWeek = filtered.filter(
    (t) => t.startsAt && t.startsAt <= weekEnd && t.status !== 'done'
  ).length

  return (
    <div className="min-h-screen bg-kinship-surface">
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface/60">Home Chores</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/household" className="font-body text-sm text-kinship-primary hover:underline">
              Manage household
            </a>
            <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">
              Dashboard
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-kinship-on-surface">Home Chores</h2>
          <p className="font-body text-base text-kinship-on-surface/70">
            {dueThisWeek} {dueThisWeek === 1 ? 'task' : 'tasks'} due this week
          </p>
        </div>
        <ChoresClient
          initialTasks={filtered}
          areas={areas}
          members={members}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
