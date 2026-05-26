import { NextRequest, NextResponse } from 'next/server'
import { eq, and, ilike, or, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  householdMembers,
  tasks,
  choreAreas,
  kidActivities,
  children,
  cars,
  insurancePolicies,
  electronics,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  id: string
  title: string
  subtitle: string | null
  module: 'chores' | 'kids' | 'cars' | 'insurance' | 'electronics'
  href: string
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [member] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (!member) {
    return NextResponse.json({ results: [] })
  }

  const hid = member.householdId
  const pattern = `%${q}%`

  const [taskRows, activityRows, carRows, policyRows, electronicRows] =
    await Promise.all([
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          areaName: choreAreas.name,
        })
        .from(tasks)
        .leftJoin(choreAreas, eq(tasks.areaId, choreAreas.id))
        .where(
          and(
            eq(tasks.householdId, hid),
            ilike(tasks.title, pattern),
            or(eq(tasks.isRecurring, false), isNotNull(tasks.parentTaskId))
          )
        )
        .limit(5),

      db
        .select({
          id: kidActivities.id,
          title: kidActivities.title,
          childName: children.name,
        })
        .from(kidActivities)
        .leftJoin(children, eq(kidActivities.childId, children.id))
        .where(
          and(
            eq(kidActivities.householdId, hid),
            ilike(kidActivities.title, pattern),
            or(
              eq(kidActivities.isRecurring, false),
              isNotNull(kidActivities.parentActivityId)
            )
          )
        )
        .limit(5),

      db
        .select({ id: cars.id, make: cars.make, model: cars.model, plate: cars.plate })
        .from(cars)
        .where(
          and(
            eq(cars.householdId, hid),
            or(
              ilike(cars.make, pattern),
              ilike(cars.model, pattern),
              ilike(cars.plate, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({
          id: insurancePolicies.id,
          insurer: insurancePolicies.insurer,
          policyType: insurancePolicies.policyType,
        })
        .from(insurancePolicies)
        .where(
          and(
            eq(insurancePolicies.householdId, hid),
            or(
              ilike(insurancePolicies.insurer, pattern),
              ilike(insurancePolicies.policyType, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({
          id: electronics.id,
          name: electronics.name,
          brand: electronics.brand,
        })
        .from(electronics)
        .where(
          and(
            eq(electronics.householdId, hid),
            or(
              ilike(electronics.name, pattern),
              ilike(electronics.brand, pattern)
            )
          )
        )
        .limit(5),
    ])

  const results: SearchResult[] = [
    ...taskRows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.areaName,
      module: 'chores' as const,
      href: '/chores',
    })),
    ...activityRows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.childName,
      module: 'kids' as const,
      href: '/kids',
    })),
    ...carRows.map((r) => ({
      id: r.id,
      title: `${r.make} ${r.model}`,
      subtitle: r.plate,
      module: 'cars' as const,
      href: '/cars',
    })),
    ...policyRows.map((r) => ({
      id: r.id,
      title: `${r.insurer} — ${r.policyType}`,
      subtitle: null,
      module: 'insurance' as const,
      href: '/insurance',
    })),
    ...electronicRows.map((r) => ({
      id: r.id,
      title: r.name,
      subtitle: r.brand,
      module: 'electronics' as const,
      href: '/electronics',
    })),
  ]

  return NextResponse.json({ results })
}
