import { redirect } from 'next/navigation'
import { eq, ne, asc, desc, and, or, isNotNull, gte, lt } from 'drizzle-orm'
import { startOfWeek, addDays, addMonths, differenceInCalendarDays } from 'date-fns'
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
  suggestions,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { DashboardTimeline } from '@/components/dashboard/DashboardTimeline'
import { seedSuggestions } from '@/app/actions/suggestions'
import { registerChildren } from '@/lib/kids/child-colours'
import type { ModuleKey } from '@/stores/onboarding'
import { TopBar } from '@/components/nav/TopBar'

export const metadata = {
  title: 'Dashboard — Kinship',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [row] = await db
    .select({
      householdId: householdMembers.householdId,
      householdName: households.name,
      activeModules: householdSettings.activeModules,
      displayName: householdMembers.displayName,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .innerJoin(householdSettings, eq(householdMembers.householdId, householdSettings.householdId))
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (!row) redirect('/onboarding')

  const activeModules = (row.activeModules ?? []) as ModuleKey[]
  const firstName = row.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there'

  // Time boundaries
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)
  const nextWeekEnd = addDays(weekStart, 14)
  const thirtyDaysOut = addMonths(now, 1)

  // Greeting
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Fetch members for avatar display
  const members = await db
    .select({
      id: householdMembers.id,
      displayName: householdMembers.displayName,
      avatarUrl: householdMembers.avatarUrl,
      userId: householdMembers.userId,
    })
    .from(householdMembers)
    .where(eq(householdMembers.householdId, row.householdId))

  // Fetch tasks: this week + next week + overdue
  type DashTask = {
    id: string; title: string; notes: string | null; areaName: string | null; startsAt: Date | null;
    endsAt: Date | null; ownerId: string | null; status: string;
  }
  let allTasks: DashTask[] = []

  if (activeModules.includes('chores')) {
    allTasks = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        notes: tasksTable.notes,
        areaName: choreAreas.name,
        startsAt: tasksTable.startsAt,
        endsAt: tasksTable.endsAt,
        ownerId: tasksTable.ownerId,
        status: tasksTable.status,
      })
      .from(tasksTable)
      .leftJoin(choreAreas, eq(tasksTable.areaId, choreAreas.id))
      .where(
        and(
          eq(tasksTable.householdId, row.householdId),
          or(eq(tasksTable.isRecurring, false), isNotNull(tasksTable.parentTaskId)),
          // Fetch: overdue (before this week, not done) + this week + next week
          or(
            // Overdue: before week start and not done
            and(lt(tasksTable.startsAt, weekStart), ne(tasksTable.status, 'done')),
            // This week (any status to show done items)
            and(gte(tasksTable.startsAt, weekStart), lt(tasksTable.startsAt, weekEnd)),
            // Next week (not done)
            and(gte(tasksTable.startsAt, weekEnd), lt(tasksTable.startsAt, nextWeekEnd), ne(tasksTable.status, 'done')),
          ),
        )
      )
      .orderBy(asc(tasksTable.startsAt))
  }

  // Fetch activities: this week + next week
  type DashActivity = {
    id: string; title: string; notes: string | null; location: string | null; category: string | null;
    childName: string | null; childId: string | null;
    startsAt: Date | null; endsAt: Date | null; assigneeId: string | null;
  }
  let allActivities: DashActivity[] = []

  if (activeModules.includes('kids')) {
    allActivities = await db
      .select({
        id: kidActivities.id,
        title: kidActivities.title,
        notes: kidActivities.notes,
        location: kidActivities.location,
        category: kidActivities.category,
        childName: children.name,
        childId: kidActivities.childId,
        startsAt: kidActivities.startsAt,
        endsAt: kidActivities.endsAt,
        assigneeId: kidActivities.assigneeId,
      })
      .from(kidActivities)
      .leftJoin(children, eq(kidActivities.childId, children.id))
      .where(
        and(
          eq(kidActivities.householdId, row.householdId),
          or(eq(kidActivities.isRecurring, false), isNotNull(kidActivities.parentActivityId)),
          gte(kidActivities.startsAt, weekStart),
          lt(kidActivities.startsAt, nextWeekEnd),
        )
      )
      .orderBy(asc(kidActivities.startsAt))

    const allChildren = await db
      .select({ id: children.id })
      .from(children)
      .where(eq(children.householdId, row.householdId))
      .orderBy(asc(children.name))
    registerChildren(allChildren.map((c) => c.id))
  }

  // Fetch cars
  type DashCar = { id: string; make: string; model: string; motDueDate: Date | null; taxDueDate: Date | null; nextServiceDate: Date | null }
  let allCars: DashCar[] = []
  if (activeModules.includes('car')) {
    allCars = await db
      .select({ id: cars.id, make: cars.make, model: cars.model, motDueDate: cars.motDueDate, taxDueDate: cars.taxDueDate, nextServiceDate: cars.nextServiceDate })
      .from(cars)
      .where(eq(cars.householdId, row.householdId))
  }

  // Fetch policies with premium data for money pulse
  type DashPolicy = {
    id: string; insurer: string; policyType: string; expiryDate: Date | null;
    nextPaymentDate: Date | null; premiumCents: number | null; paymentSchedule: string | null;
  }
  let allPolicies: DashPolicy[] = []
  if (activeModules.includes('insurance')) {
    allPolicies = await db
      .select({
        id: insurancePolicies.id,
        insurer: insurancePolicies.insurer,
        policyType: insurancePolicies.policyType,
        expiryDate: insurancePolicies.expiryDate,
        nextPaymentDate: insurancePolicies.nextPaymentDate,
        premiumCents: insurancePolicies.premiumCents,
        paymentSchedule: insurancePolicies.paymentSchedule,
      })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.householdId, row.householdId))
      .orderBy(asc(insurancePolicies.expiryDate))
  }

  // Fetch electronics
  type DashElectronic = { id: string; name: string; warrantyExpiryDate: Date | null }
  let allElectronics: DashElectronic[] = []
  if (activeModules.includes('electronics')) {
    allElectronics = await db
      .select({ id: electronics.id, name: electronics.name, warrantyExpiryDate: electronics.warrantyExpiryDate })
      .from(electronics)
      .where(eq(electronics.householdId, row.householdId))
  }

  // Seed suggestions (ensures they exist without waiting for Inngest cron)
  await seedSuggestions(row.householdId)

  // Fetch pending suggestions from DB
  const allSuggestions = await db
    .select()
    .from(suggestions)
    .where(and(eq(suggestions.householdId, row.householdId), eq(suggestions.status, 'pending')))

  const serializedSuggestions = allSuggestions.map((s) => ({
    id: s.id,
    sourceModule: s.sourceModule,
    sourceEntityId: s.sourceEntityId,
    sourceField: s.sourceField,
    deadlineDate: s.deadlineDate,
    suggestedTitle: s.suggestedTitle,
    suggestedNotes: s.suggestedNotes,
    suggestedOwnerId: s.suggestedOwnerId,
    status: s.status,
    createdAt: s.createdAt?.toISOString() ?? null,
  }))

  // Split overdue tasks: >14 days overdue = stale, <=14 days = regular overdue
  const staleOverdue: DashTask[] = []
  const regularTasks: DashTask[] = []
  for (const t of allTasks) {
    if (!t.startsAt || t.status === 'done') {
      regularTasks.push(t)
      continue
    }
    const daysBefore = differenceInCalendarDays(now, t.startsAt)
    if (t.startsAt < weekStart && daysBefore > 14) {
      staleOverdue.push(t)
    } else {
      regularTasks.push(t)
    }
  }

  // Serialize dates for client
  const serialize = <T extends Record<string, unknown>>(rows: T[]) =>
    rows.map((r) => {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(r)) {
        out[k] = v instanceof Date ? v.toISOString() : v
      }
      return out as { [K in keyof T]: T[K] extends Date | null ? string | null : T[K] }
    })

  return (
    <>
      <TopBar title={`${greeting}, ${firstName}`} subtitle="Your household at a glance" />

      <main className="flex-1 overflow-auto px-4 py-2 sm:px-6">
        <DashboardTimeline
          activeModules={activeModules}
          tasks={serialize(regularTasks)}
          activities={serialize(allActivities)}
          policies={serialize(allPolicies)}
          members={serialize(members)}
          suggestions={serializedSuggestions}
          staleOverdue={serialize(staleOverdue)}
          weekStartIso={weekStart.toISOString()}
          weekEndIso={weekEnd.toISOString()}
          nextWeekEndIso={nextWeekEnd.toISOString()}
        />
      </main>
    </>
  )
}
