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
import { AppHeader } from '@/components/nav/AppHeader'

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
        )
      )
      .orderBy(asc(kidActivities.startsAt))
      .limit(3)

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
    <div className="min-h-screen bg-kinship-surface">
      <AppHeader subtitle={row.householdName} />

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="mb-6 font-display text-2xl font-semibold text-kinship-on-surface">
          Your household
        </h2>
        <DashboardGrid
          activeModules={activeModules}
          upcomingTasks={upcomingTasks}
          upcomingActivities={upcomingActivities}
          upcomingCars={upcomingCars}
          upcomingPolicies={upcomingPolicies}
          upcomingElectronics={upcomingElectronics}
        />
      </main>
    </div>
  )
}
