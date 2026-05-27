'use server'

import { eq, and, like } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { addDays, addMonths, subDays, setHours, setMinutes } from 'date-fns'
import { db } from '@/lib/db'
import {
  householdMembers,
  householdSettings,
  tasks,
  choreAreas,
  children,
  kidActivities,
  cars,
  serviceRecords,
  insurancePolicies,
  electronics,
  suggestions,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

const MOCK_TAG = '[mock-data]'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getHouseholdContext(userId: string) {
  const rows = await db
    .select({
      householdId: householdMembers.householdId,
      memberId: householdMembers.id,
    })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

function at(daysFromNow: number, hour: number, minute = 0): string {
  let d = addDays(new Date(), daysFromNow)
  d = setHours(d, hour)
  d = setMinutes(d, minute)
  d.setSeconds(0, 0)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Check if mock data exists
// ---------------------------------------------------------------------------

export async function hasMockData(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const ctx = await getHouseholdContext(user.id)
  if (!ctx) return false

  const [row] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.householdId, ctx.householdId), like(tasks.notes, `%${MOCK_TAG}%`)))
    .limit(1)

  if (row) return true

  const [carRow] = await db
    .select({ id: cars.id })
    .from(cars)
    .where(and(eq(cars.householdId, ctx.householdId), like(cars.colour, `%${MOCK_TAG}%`)))
    .limit(1)

  return !!carRow
}

// ---------------------------------------------------------------------------
// Generate mock data
// ---------------------------------------------------------------------------

export async function generateMockData(): Promise<ActionResult<{ summary: string }>> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const ctx = await getHouseholdContext(user.id)
  if (!ctx) return { success: false, error: 'No household found' }

  const { householdId, memberId } = ctx

  // Check if mock data already exists
  const exists = await hasMockData()
  if (exists) return { success: false, error: 'Mock data already exists. Clear it first.' }

  // Get active modules
  const [settings] = await db
    .select({ activeModules: householdSettings.activeModules })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
    .limit(1)

  const activeModules = (settings?.activeModules ?? []) as string[]
  const counts: string[] = []

  try {
    // ── Tasks (chores module) ──
    if (activeModules.includes('chores')) {
      // Ensure default areas exist
      const existingAreas = await db
        .select({ id: choreAreas.id, name: choreAreas.name })
        .from(choreAreas)
        .where(eq(choreAreas.householdId, householdId))

      let areaMap = new Map(existingAreas.map((a) => [a.name, a.id]))

      if (areaMap.size === 0) {
        const defaultAreas = ['Kitchen', 'Living Room', 'Garden']
        for (const name of defaultAreas) {
          const [row] = await db
            .insert(choreAreas)
            .values({ householdId, name, isDefault: true })
            .returning({ id: choreAreas.id })
          areaMap.set(name, row.id)
        }
      }

      const kitchenId = areaMap.get('Kitchen') ?? areaMap.values().next().value
      const livingId = areaMap.get('Living Room') ?? kitchenId
      const gardenId = areaMap.get('Garden') ?? kitchenId

      const mockTasks = [
        { title: 'Buy groceries', notes: `Weekly shop — milk, bread, eggs, vegetables ${MOCK_TAG}`, areaId: kitchenId, startsAt: at(1, 10), status: 'todo' as const },
        { title: 'Vacuum living room', notes: `Quick vacuum before guests arrive ${MOCK_TAG}`, areaId: livingId, startsAt: at(0, 14), status: 'todo' as const },
        { title: 'Water the plants', notes: `Indoor and outdoor plants ${MOCK_TAG}`, areaId: gardenId, startsAt: at(2, 9), status: 'todo' as const },
      ]

      for (const t of mockTasks) {
        await db.insert(tasks).values({
          householdId,
          title: t.title,
          notes: t.notes,
          areaId: t.areaId,
          ownerId: user.id,
          status: t.status,
          startsAt: new Date(t.startsAt),
          isRecurring: false,
          createdBy: user.id,
        })
      }
      counts.push('3 tasks')
    }

    // ── Kids activities ──
    if (activeModules.includes('kids')) {
      const [child1] = await db
        .insert(children)
        .values({ householdId, name: 'Emma' })
        .returning({ id: children.id })
      const [child2] = await db
        .insert(children)
        .values({ householdId, name: 'Lucas' })
        .returning({ id: children.id })

      const mockActivities = [
        { childId: child1.id, title: 'Soccer practice', category: 'sport' as const, location: 'City Sports Centre', startsAt: at(1, 16, 30), notes: MOCK_TAG },
        { childId: child1.id, title: 'Piano lesson', category: 'hobby' as const, location: 'Music Academy', startsAt: at(3, 15), notes: MOCK_TAG },
        { childId: child2.id, title: 'Doctor checkup', category: 'medical' as const, location: 'Family Clinic', startsAt: at(5, 10), notes: MOCK_TAG },
      ]

      for (const a of mockActivities) {
        await db.insert(kidActivities).values({
          householdId,
          childId: a.childId,
          title: a.title,
          category: a.category,
          location: a.location,
          startsAt: new Date(a.startsAt),
          notes: a.notes,
          assigneeId: user.id,
          isRecurring: false,
          createdBy: user.id,
        })
      }
      counts.push('2 children, 3 activities')
    }

    // ── Cars ──
    if (activeModules.includes('car')) {
      const now = new Date()
      const [car1] = await db
        .insert(cars)
        .values({
          householdId,
          make: 'Toyota',
          model: 'Corolla',
          year: 2021,
          plate: 'AB-123-CD',
          colour: `Silver ${MOCK_TAG}`,
          motDueDate: addDays(now, 12),
          taxDueDate: addMonths(now, 3),
          nextServiceDate: addDays(now, 8),
          createdBy: user.id,
        })
        .returning({ id: cars.id })

      const [car2] = await db
        .insert(cars)
        .values({
          householdId,
          make: 'Volkswagen',
          model: 'Golf',
          year: 2019,
          plate: 'EF-456-GH',
          colour: `Blue ${MOCK_TAG}`,
          motDueDate: addMonths(now, 2),
          taxDueDate: addMonths(now, 5),
          nextServiceDate: addMonths(now, 1),
          createdBy: user.id,
        })
        .returning({ id: cars.id })

      // Service records
      await db.insert(serviceRecords).values({
        householdId,
        carId: car1.id,
        serviceDate: subDays(now, 180),
        serviceType: 'full_service',
        mileage: 45000,
        garage: 'QuickFit Auto',
        costCents: 35000,
        notes: MOCK_TAG,
        createdBy: user.id,
      })
      await db.insert(serviceRecords).values({
        householdId,
        carId: car2.id,
        serviceDate: subDays(now, 90),
        serviceType: 'mot',
        mileage: 72000,
        garage: 'City MOT Centre',
        costCents: 5500,
        notes: MOCK_TAG,
        createdBy: user.id,
      })
      counts.push('2 cars, 2 service records')
    }

    // ── Insurance ──
    if (activeModules.includes('insurance')) {
      const now = new Date()
      await db.insert(insurancePolicies).values({
        householdId,
        policyType: 'home',
        insurer: 'SafeHome Insurance',
        policyNumber: 'SH-2024-001',
        expiryDate: addMonths(now, 4),
        paymentSchedule: 'monthly',
        premiumCents: 4500,
        nextPaymentDate: addDays(now, 10),
        coveredName: `Home policy ${MOCK_TAG}`,
        createdBy: user.id,
      })
      await db.insert(insurancePolicies).values({
        householdId,
        policyType: 'car',
        insurer: 'AutoProtect',
        policyNumber: 'AP-2024-789',
        expiryDate: addMonths(now, 8),
        paymentSchedule: 'quarterly',
        premiumCents: 12000,
        nextPaymentDate: addMonths(now, 1),
        coveredName: `Car policy ${MOCK_TAG}`,
        createdBy: user.id,
      })
      counts.push('2 insurance policies')
    }

    // ── Electronics ──
    if (activeModules.includes('electronics')) {
      const now = new Date()
      await db.insert(electronics).values({
        householdId,
        name: 'MacBook Pro 14"',
        brand: 'Apple',
        modelNumber: 'MKGR3',
        purchaseDate: subDays(now, 365),
        costCents: 199900,
        warrantyExpiryDate: addMonths(now, 6),
        coverageSummary: `AppleCare+ until expiry ${MOCK_TAG}`,
        createdBy: user.id,
      })
      await db.insert(electronics).values({
        householdId,
        name: 'Samsung TV 55"',
        brand: 'Samsung',
        modelNumber: 'QN55Q80C',
        purchaseDate: subDays(now, 200),
        costCents: 89900,
        warrantyExpiryDate: addDays(now, 14),
        coverageSummary: `Standard manufacturer warranty ${MOCK_TAG}`,
        createdBy: user.id,
      })
      counts.push('2 electronics')
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: { summary: counts.length > 0 ? `Created ${counts.join(', ')}` : 'No active modules to seed' },
    }
  } catch (err) {
    console.error('generateMockData error:', err)
    return { success: false, error: 'Failed to generate mock data' }
  }
}

// ---------------------------------------------------------------------------
// Clear mock data
// ---------------------------------------------------------------------------

export async function clearMockData(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const ctx = await getHouseholdContext(user.id)
  if (!ctx) return { success: false, error: 'No household found' }

  const { householdId } = ctx

  try {
    // Delete suggestions that reference mock entities
    // (We'll clean up orphaned suggestions by checking if source entities still exist)

    // Delete mock service records (by notes tag)
    await db.delete(serviceRecords).where(
      and(eq(serviceRecords.householdId, householdId), like(serviceRecords.notes, `%${MOCK_TAG}%`))
    )

    // Delete mock cars (by colour tag)
    await db.delete(cars).where(
      and(eq(cars.householdId, householdId), like(cars.colour, `%${MOCK_TAG}%`))
    )

    // Delete mock insurance policies (by coveredName tag)
    await db.delete(insurancePolicies).where(
      and(eq(insurancePolicies.householdId, householdId), like(insurancePolicies.coveredName, `%${MOCK_TAG}%`))
    )

    // Delete mock electronics (by coverageSummary tag)
    await db.delete(electronics).where(
      and(eq(electronics.householdId, householdId), like(electronics.coverageSummary, `%${MOCK_TAG}%`))
    )

    // Delete mock tasks (by notes tag)
    await db.delete(tasks).where(
      and(eq(tasks.householdId, householdId), like(tasks.notes, `%${MOCK_TAG}%`))
    )

    // Delete mock kid activities (by notes tag)
    await db.delete(kidActivities).where(
      and(eq(kidActivities.householdId, householdId), like(kidActivities.notes, `%${MOCK_TAG}%`))
    )

    // Delete mock children (Emma, Lucas — only if they have no non-mock activities left)
    const mockChildNames = ['Emma', 'Lucas']
    for (const name of mockChildNames) {
      const [child] = await db
        .select({ id: children.id })
        .from(children)
        .where(and(eq(children.householdId, householdId), eq(children.name, name)))
        .limit(1)

      if (child) {
        // Check if child has remaining (non-mock) activities
        const [remaining] = await db
          .select({ id: kidActivities.id })
          .from(kidActivities)
          .where(eq(kidActivities.childId, child.id))
          .limit(1)

        if (!remaining) {
          await db.delete(children).where(eq(children.id, child.id))
        }
      }
    }

    // Clean up orphaned suggestions (where source entity no longer exists)
    const allSuggestions = await db
      .select({ id: suggestions.id, sourceModule: suggestions.sourceModule, sourceEntityId: suggestions.sourceEntityId })
      .from(suggestions)
      .where(and(eq(suggestions.householdId, householdId), eq(suggestions.status, 'pending')))

    for (const s of allSuggestions) {
      let entityExists = false
      if (s.sourceModule === 'car') {
        const [row] = await db.select({ id: cars.id }).from(cars).where(eq(cars.id, s.sourceEntityId)).limit(1)
        entityExists = !!row
      } else if (s.sourceModule === 'insurance') {
        const [row] = await db.select({ id: insurancePolicies.id }).from(insurancePolicies).where(eq(insurancePolicies.id, s.sourceEntityId)).limit(1)
        entityExists = !!row
      } else if (s.sourceModule === 'electronics') {
        const [row] = await db.select({ id: electronics.id }).from(electronics).where(eq(electronics.id, s.sourceEntityId)).limit(1)
        entityExists = !!row
      }
      if (!entityExists) {
        await db.delete(suggestions).where(eq(suggestions.id, s.id))
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('clearMockData error:', err)
    return { success: false, error: 'Failed to clear mock data' }
  }
}
