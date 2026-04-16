import { redirect } from 'next/navigation'
import { eq, and, gte, or, isNotNull } from 'drizzle-orm'
import { startOfMonth, endOfMonth, addMonths, setDate } from 'date-fns'
import { db } from '@/lib/db'
import {
  tasks,
  kidActivities,
  children,
  householdMembers,
  cars,
  insurancePolicies,
  electronics,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './CalendarClient'
import { MODULE_COLOURS, toCalendarLabel, type CalendarEvent } from '@/lib/calendar/types'
import { childHex, registerChildren } from '@/lib/kids/child-colours'

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

  // Query window: current month ±12 months (25-month window for full navigation)
  const now = new Date()
  const windowStart = startOfMonth(addMonths(now, -12))
  const windowEnd = endOfMonth(addMonths(now, 12))

  // Parallel data fetching — chores, kids, children, plus Phase 4 tracker modules
  const [
    choreRows,
    activityRows,
    childRows,
    carRows,
    insuranceRows,
    electronicsRows,
  ] = await Promise.all([
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

    // Cars: small dataset, no window filtering — render all key dates
    db.select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      motDueDate: cars.motDueDate,
      taxDueDate: cars.taxDueDate,
      nextServiceDate: cars.nextServiceDate,
    })
      .from(cars)
      .where(eq(cars.householdId, householdId)),

    // Insurance policies: small dataset, no window filtering
    db.select({
      id: insurancePolicies.id,
      insurer: insurancePolicies.insurer,
      policyType: insurancePolicies.policyType,
      expiryDate: insurancePolicies.expiryDate,
      nextPaymentDate: insurancePolicies.nextPaymentDate,
      paymentSchedule: insurancePolicies.paymentSchedule,
      premiumCents: insurancePolicies.premiumCents,
      coveredName: insurancePolicies.coveredName,
      createdAt: insurancePolicies.createdAt,
    })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.householdId, householdId)),

    // Electronics: small dataset, no window filtering — only items with warranties
    db.select({
      id: electronics.id,
      name: electronics.name,
      warrantyExpiryDate: electronics.warrantyExpiryDate,
    })
      .from(electronics)
      .where(eq(electronics.householdId, householdId)),
  ])

  // Map to CalendarEvent[]
  const childMap = new Map(childRows.map((c) => [c.id, c.name]))
  registerChildren([...childRows].sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.id))

  const choreEvents: CalendarEvent[] = choreRows.map((t) => ({
    id: t.id,
    title: t.title,
    startsAt: t.startsAt,
    endsAt: t.endsAt ?? null,
    module: 'chores' as const,
    href: '/chores',
    colour: MODULE_COLOURS.chores,
    label: toCalendarLabel(t.title),
    filterCategory: 'chores' as const,
  }))

  const kidsEvents: CalendarEvent[] = activityRows.map((a) => {
    const cName = childMap.get(a.childId) ?? null
    return {
      id: a.id,
      title: a.title,
      startsAt: a.startsAt,
      endsAt: a.endsAt ?? null,
      module: 'kids' as const,
      href: '/kids',
      colour: childHex(a.childId),
      label: toCalendarLabel(a.title),
      filterCategory: 'kids_activities' as const,
      childName: cName,
      childColour: childHex(a.childId),
    }
  })

  // Cars: up to 3 events per car (MOT, tax, service)
  const carEvents: CalendarEvent[] = carRows.flatMap((c) => {
    const events: CalendarEvent[] = []
    if (c.motDueDate) {
      const title = `MOT: ${c.make} ${c.model}`
      events.push({
        id: `${c.id}-mot`,
        title,
        startsAt: c.motDueDate,
        endsAt: null,
        module: 'car' as const,
        href: '/cars',
        colour: MODULE_COLOURS.car,
        label: toCalendarLabel(title),
        filterCategory: 'car_deadlines' as const,
      })
    }
    if (c.taxDueDate) {
      const title = `Tax: ${c.make} ${c.model}`
      events.push({
        id: `${c.id}-tax`,
        title,
        startsAt: c.taxDueDate,
        endsAt: null,
        module: 'car' as const,
        href: '/cars',
        colour: MODULE_COLOURS.car,
        label: toCalendarLabel(title),
        filterCategory: 'car_deadlines' as const,
      })
    }
    if (c.nextServiceDate) {
      const title = `Service: ${c.make} ${c.model}`
      events.push({
        id: `${c.id}-service`,
        title,
        startsAt: c.nextServiceDate,
        endsAt: null,
        module: 'car' as const,
        href: '/cars',
        colour: MODULE_COLOURS.car,
        label: toCalendarLabel(title),
        filterCategory: 'car_deadlines' as const,
      })
    }
    return events
  })

  // Insurance: expiry event + optional payment event per policy
  const insuranceEvents: CalendarEvent[] = insuranceRows.flatMap((p) => {
    const events: CalendarEvent[] = []
    if (p.expiryDate) {
      const expiryTitle = `${p.insurer} ${p.policyType} expires`
      events.push({
        id: `${p.id}-expiry`,
        title: expiryTitle,
        startsAt: p.expiryDate,
        endsAt: null,
        module: 'insurance' as const,
        href: '/insurance',
        colour: MODULE_COLOURS.insurance,
        label: toCalendarLabel(expiryTitle),
        filterCategory: 'insurance_expiry' as const,
      })
    }
    return events
  })

  // Electronics: warranty expiry events
  const electronicsEvents: CalendarEvent[] = electronicsRows
    .filter((e) => e.warrantyExpiryDate != null)
    .map((e) => {
      const title = `${e.name} warranty expires`
      return {
        id: `${e.id}-warranty`,
        title,
        startsAt: e.warrantyExpiryDate as Date,
        endsAt: null,
        module: 'electronics' as const,
        href: '/electronics',
        colour: MODULE_COLOURS.electronics,
        label: toCalendarLabel(title),
        filterCategory: 'warranty_expiry' as const,
      }
    })

  // Costs: project recurring insurance payments across the 3-month window
  const costEvents: CalendarEvent[] = insuranceRows.flatMap((p) => {
    if (!p.premiumCents || !p.paymentSchedule) return []
    const intervalMonths = p.paymentSchedule === 'monthly' ? 1 : p.paymentSchedule === 'quarterly' ? 3 : 12
    const events: CalendarEvent[] = []
    const policyStart = p.createdAt ? new Date(p.createdAt) : null
    const earliestMonth = policyStart
      ? policyStart.getFullYear() * 12 + policyStart.getMonth()
      : 0

    if (p.nextPaymentDate) {
      const anchor = new Date(p.nextPaymentDate)
      const anchorMonth = anchor.getFullYear() * 12 + anchor.getMonth()
      const anchorDay = anchor.getDate()

      // Walk through the ±12 month window
      for (let m = -12; m <= 12; m++) {
        const target = addMonths(now, m)
        const targetAbsMonth = target.getFullYear() * 12 + target.getMonth()
        if (targetAbsMonth < earliestMonth) continue
        const diff = targetAbsMonth - anchorMonth
        if (diff % intervalMonths === 0) {
          const payDate = setDate(new Date(target.getFullYear(), target.getMonth(), 1), Math.min(anchorDay, 28))
          const label = p.coveredName
            ? `${p.insurer} · ${p.coveredName}`
            : `${p.insurer} ${p.policyType}`
          events.push({
            id: `${p.id}-cost-${target.getFullYear()}-${target.getMonth()}`,
            title: `Payment: ${label}`,
            startsAt: payDate,
            endsAt: null,
            module: 'costs' as const,
            href: '/costs',
            colour: MODULE_COLOURS.costs,
            label: toCalendarLabel(`${p.insurer} payment`),
            icon: 'money',
            filterCategory: 'insurance_costs' as const,
          })
        }
      }
    }
    return events
  })

  const allEvents: CalendarEvent[] = [
    ...choreEvents,
    ...kidsEvents,
    ...carEvents,
    ...insuranceEvents,
    ...electronicsEvents,
    ...costEvents,
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

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
            <a href="/cars" className="font-body text-sm text-kinship-primary hover:underline">Cars</a>
            <a href="/insurance" className="font-body text-sm text-kinship-primary hover:underline">Insurance</a>
            <a href="/electronics" className="font-body text-sm text-kinship-primary hover:underline">Electronics</a>
            <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">Dashboard</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <CalendarClient events={allEvents} />
      </main>
    </div>
  )
}
