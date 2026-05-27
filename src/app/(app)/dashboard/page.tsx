import { redirect } from 'next/navigation'
import { eq, ne, asc, and, or, isNotNull, gte, lt } from 'drizzle-orm'
import { startOfWeek, addDays } from 'date-fns'
import { db } from '@/lib/db'
import {
  householdMembers,
  householdSettings,
  households,
  tasks as tasksTable,
  choreAreas,
  kidActivities,
  children,
  cars,
  insurancePolicies,
  electronics,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { registerChildren } from '@/lib/kids/child-colours'
import type { ModuleKey } from '@/stores/onboarding'
import type { UpcomingTask } from '@/components/dashboard/ChoresDashboardCard'
import type { UpcomingActivity } from '@/components/dashboard/KidsDashboardCard'
import type { UpcomingCar } from '@/components/dashboard/CarDashboardCard'
import type { UpcomingPolicy } from '@/components/dashboard/InsuranceDashboardCard'
import type { UpcomingElectronic } from '@/components/dashboard/ElectronicsDashboardCard'
import { TopBar } from '@/components/nav/TopBar'

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

  // Week boundaries for filtering
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

  // Fetch tasks for the current week
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
          or(
            eq(tasksTable.isRecurring, false),
            isNotNull(tasksTable.parentTaskId),
          ),
          gte(tasksTable.startsAt, weekStart),
          lt(tasksTable.startsAt, weekEnd),
        )
      )
      .orderBy(asc(tasksTable.startsAt))

    upcomingTasks = taskRows
  }

  // Fetch activities for the current week
  let upcomingActivities: UpcomingActivity[] = []

  if (activeModules.includes('kids')) {
    const activityRows = await db
      .select({
        id: kidActivities.id,
        title: kidActivities.title,
        childName: children.name,
        childId: kidActivities.childId,
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
          gte(kidActivities.startsAt, weekStart),
          lt(kidActivities.startsAt, weekEnd),
        )
      )
      .orderBy(asc(kidActivities.startsAt))

    upcomingActivities = activityRows

    // Register all children so colours match the kids page
    const allChildren = await db
      .select({ id: children.id })
      .from(children)
      .where(eq(children.householdId, row.householdId))
      .orderBy(asc(children.name))
    registerChildren(allChildren.map((c) => c.id))
  }

  // Fetch cars for CarDashboardCard
  let upcomingCars: UpcomingCar[] = []
  if (activeModules.includes('car')) {
    upcomingCars = await db
      .select({
        id: cars.id,
        make: cars.make,
        model: cars.model,
        motDueDate: cars.motDueDate,
        taxDueDate: cars.taxDueDate,
        nextServiceDate: cars.nextServiceDate,
      })
      .from(cars)
      .where(eq(cars.householdId, row.householdId))
  }

  // Fetch insurance policies for InsuranceDashboardCard
  let upcomingPolicies: UpcomingPolicy[] = []
  if (activeModules.includes('insurance')) {
    upcomingPolicies = await db
      .select({
        id: insurancePolicies.id,
        insurer: insurancePolicies.insurer,
        policyType: insurancePolicies.policyType,
        expiryDate: insurancePolicies.expiryDate,
        nextPaymentDate: insurancePolicies.nextPaymentDate,
      })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.householdId, row.householdId))
      .orderBy(asc(insurancePolicies.expiryDate))
  }

  // Fetch electronics for ElectronicsDashboardCard
  let upcomingElectronics: UpcomingElectronic[] = []
  if (activeModules.includes('electronics')) {
    upcomingElectronics = await db
      .select({
        id: electronics.id,
        name: electronics.name,
        warrantyExpiryDate: electronics.warrantyExpiryDate,
      })
      .from(electronics)
      .where(eq(electronics.householdId, row.householdId))
  }

  return (
    <>
      <TopBar title={row.householdName ?? 'Good afternoon'} subtitle="Your household at a glance" />

      <main className="flex-1 overflow-auto px-6 py-2">
        <DashboardGrid
          activeModules={activeModules}
          upcomingTasks={upcomingTasks}
          upcomingActivities={upcomingActivities}
          upcomingCars={upcomingCars}
          upcomingPolicies={upcomingPolicies}
          upcomingElectronics={upcomingElectronics}
        />
      </main>
    </>
  )
}
