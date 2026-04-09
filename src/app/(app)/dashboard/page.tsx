import { redirect } from 'next/navigation'
import { eq, ne, asc, and, or, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  householdMembers,
  householdSettings,
  households,
  tasks as tasksTable,
  choreAreas,
  kidActivities,
  children,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { SignOutButton } from '@/components/dashboard/SignOutButton'
import type { ModuleKey } from '@/stores/onboarding'
import type { UpcomingTask } from '@/components/dashboard/ChoresDashboardCard'
import type { UpcomingActivity } from '@/components/dashboard/KidsDashboardCard'

export const metadata = {
  title: 'Dashboard — Kinship',
}

export default async function DashboardPage() {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch household settings for the current user
  const [row] = await db
    .select({
      householdId: householdMembers.householdId,
      householdName: households.name,
      activeModules: householdSettings.activeModules,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .innerJoin(householdSettings, eq(householdMembers.householdId, householdSettings.householdId))
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (!row) {
    redirect('/onboarding')
  }

  const activeModules = (row.activeModules ?? []) as ModuleKey[]

  // Fetch upcoming tasks for the Home Chores dashboard card
  let upcomingTasks: UpcomingTask[] = []

  if (activeModules.includes('chores')) {
    const taskRows = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        areaName: choreAreas.name,
        startsAt: tasksTable.startsAt,
      })
      .from(tasksTable)
      .leftJoin(choreAreas, eq(tasksTable.areaId, choreAreas.id))
      .where(
        and(
          eq(tasksTable.householdId, row.householdId),
          ne(tasksTable.status, 'done'),
          // Exclude parent template rows (recurring tasks with no parentTaskId)
          or(
            eq(tasksTable.isRecurring, false),
            isNotNull(tasksTable.parentTaskId),
          ),
        )
      )
      .orderBy(asc(tasksTable.startsAt))
      .limit(3)

    upcomingTasks = taskRows
  }

  // Fetch upcoming activities for the Kids dashboard card
  let upcomingActivities: UpcomingActivity[] = []

  if (activeModules.includes('kids')) {
    const activityRows = await db
      .select({
        id: kidActivities.id,
        title: kidActivities.title,
        childName: children.name,
        startsAt: kidActivities.startsAt,
      })
      .from(kidActivities)
      .leftJoin(children, eq(kidActivities.childId, children.id))
      .where(
        and(
          eq(kidActivities.householdId, row.householdId),
          or(
            eq(kidActivities.isRecurring, false),
            isNotNull(kidActivities.parentActivityId),
          ),
        )
      )
      .orderBy(asc(kidActivities.startsAt))
      .limit(3)

    upcomingActivities = activityRows
  }

  return (
    <div className="min-h-screen bg-kinship-surface">
      {/* Header */}
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface/60">{row.householdName}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/household" className="font-body text-sm text-kinship-primary hover:underline">
              Manage household
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-6 font-display text-2xl font-semibold text-kinship-on-surface">
          Your household
        </h2>
        <DashboardGrid
          activeModules={activeModules}
          upcomingTasks={upcomingTasks}
          upcomingActivities={upcomingActivities}
        />
      </main>
    </div>
  )
}
