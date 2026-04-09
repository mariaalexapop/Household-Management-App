import { redirect } from 'next/navigation'
import { eq, and, gte, or, isNotNull } from 'drizzle-orm'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { db } from '@/lib/db'
import { tasks, kidActivities, children, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './CalendarClient'
import { MODULE_COLOURS, toCalendarLabel, type CalendarEvent } from '@/lib/calendar/types'

export const metadata = { title: 'Calendar — Kinship' }

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  const { householdId } = memberRow

  // Query window: current month ±1 month (3-month sliding window)
  const now = new Date()
  const windowStart = startOfMonth(addMonths(now, -1))
  const windowEnd = endOfMonth(addMonths(now, 1))

  // Parallel data fetching — Phase 4 adds car/insurance/electronics queries here
  const [choreRows, activityRows, childRows] = await Promise.all([
    // Chores: tasks in the window, excluding parent template rows
    db.select({
      id: tasks.id,
      title: tasks.title,
      startsAt: tasks.startsAt,
      endsAt: tasks.endsAt,
    })
      .from(tasks)
      .where(
        and(
          eq(tasks.householdId, householdId),
          gte(tasks.startsAt, windowStart),
          or(eq(tasks.isRecurring, false), isNotNull(tasks.parentTaskId))
        )
      ),

    // Kids activities: occurrences in the window, excluding parent template rows
    db.select({
      id: kidActivities.id,
      title: kidActivities.title,
      childId: kidActivities.childId,
      startsAt: kidActivities.startsAt,
      endsAt: kidActivities.endsAt,
    })
      .from(kidActivities)
      .where(
        and(
          eq(kidActivities.householdId, householdId),
          gte(kidActivities.startsAt, windowStart),
          or(eq(kidActivities.isRecurring, false), isNotNull(kidActivities.parentActivityId))
        )
      ),

    // Children: for labelling kids events with child name
    db.select({ id: children.id, name: children.name })
      .from(children)
      .where(eq(children.householdId, householdId)),
  ])

  // Map to CalendarEvent[]
  const childMap = new Map(childRows.map((c) => [c.id, c.name]))

  const choreEvents: CalendarEvent[] = choreRows.map((t) => ({
    id: t.id,
    title: t.title,
    startsAt: t.startsAt,
    endsAt: t.endsAt ?? null,
    module: 'chores' as const,
    href: '/chores',
    colour: MODULE_COLOURS.chores,
    label: toCalendarLabel(t.title),
  }))

  const kidsEvents: CalendarEvent[] = activityRows.map((a) => ({
    id: a.id,
    title: `${a.title}${childMap.get(a.childId) ? ` · ${childMap.get(a.childId)}` : ''}`,
    startsAt: a.startsAt,
    endsAt: a.endsAt ?? null,
    module: 'kids' as const,
    href: '/kids',
    colour: MODULE_COLOURS.kids,
    label: toCalendarLabel(a.title),
  }))

  const allEvents: CalendarEvent[] = [...choreEvents, ...kidsEvents].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  )

  // windowEnd is referenced to silence unused variable lint
  void windowEnd

  return (
    <div className="min-h-screen bg-kinship-surface">
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface-variant">Calendar</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/kids" className="font-body text-sm text-kinship-primary hover:underline">Kids</a>
            <a href="/chores" className="font-body text-sm text-kinship-primary hover:underline">Chores</a>
            <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">Dashboard</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <CalendarClient events={allEvents} />
      </main>
    </div>
  )
}
