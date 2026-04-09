'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { cars, serviceRecords, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createCarSchema = z.object({
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(2100),
  plate: z.string().min(1, 'Plate is required').max(20),
  colour: z.string().max(50).optional().nullable(),
  motDueDate: z.string().datetime({ offset: true }).optional().nullable(),
  taxDueDate: z.string().datetime({ offset: true }).optional().nullable(),
  nextServiceDate: z.string().datetime({ offset: true }).optional().nullable(),
  motReminderDays: z.number().int().min(1).max(365).optional().default(30),
  taxReminderDays: z.number().int().min(1).max(365).optional().default(30),
  serviceReminderDays: z.number().int().min(1).max(365).optional().default(14),
})

const updateCarSchema = createCarSchema.extend({
  id: z.string().uuid(),
})

const createServiceRecordSchema = z.object({
  carId: z.string().uuid('Car is required'),
  serviceDate: z.string().datetime({ offset: true }),
  serviceType: z.enum(['full_service', 'mot', 'repair', 'tyre', 'other']),
  mileage: z.number().int().min(0).optional().nullable(),
  garage: z.string().max(200).optional().nullable(),
  costCents: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

const updateServiceRecordSchema = createServiceRecordSchema.extend({
  id: z.string().uuid(),
})

const deleteSchema = z.object({
  id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gets the current user's member row (id + householdId). Returns null if not found. */
async function getMemberRow(userId: string): Promise<{ id: string; householdId: string } | null> {
  const rows = await db
    .select({ id: householdMembers.id, householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

/** Fire Inngest reminder events for non-null car key dates. */
async function fireCarReminders(
  carId: string,
  householdId: string,
  createdBy: string,
  dates: {
    motDueDate?: string | null
    taxDueDate?: string | null
    nextServiceDate?: string | null
    motReminderDays: number
    taxReminderDays: number
    serviceReminderDays: number
  }
) {
  if (!process.env.INNGEST_EVENT_KEY) return

  const events: Array<{
    name: 'car/reminder.scheduled'
    data: {
      carId: string
      householdId: string
      reminderType: 'mot' | 'tax' | 'service'
      dueDate: string
      reminderDays: number
      createdBy: string
    }
  }> = []

  if (dates.motDueDate) {
    events.push({
      name: 'car/reminder.scheduled',
      data: { carId, householdId, reminderType: 'mot', dueDate: dates.motDueDate, reminderDays: dates.motReminderDays, createdBy },
    })
  }
  if (dates.taxDueDate) {
    events.push({
      name: 'car/reminder.scheduled',
      data: { carId, householdId, reminderType: 'tax', dueDate: dates.taxDueDate, reminderDays: dates.taxReminderDays, createdBy },
    })
  }
  if (dates.nextServiceDate) {
    events.push({
      name: 'car/reminder.scheduled',
      data: { carId, householdId, reminderType: 'service', dueDate: dates.nextServiceDate, reminderDays: dates.serviceReminderDays, createdBy },
    })
  }

  if (events.length > 0) {
    await inngest.send(events)
  }
}

// ---------------------------------------------------------------------------
// Server Actions — Cars
// ---------------------------------------------------------------------------

export async function createCar(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createCarSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [newCar] = await db
    .insert(cars)
    .values({
      householdId: memberRow.householdId,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      plate: parsed.data.plate,
      colour: parsed.data.colour ?? null,
      motDueDate: parsed.data.motDueDate ? new Date(parsed.data.motDueDate) : null,
      taxDueDate: parsed.data.taxDueDate ? new Date(parsed.data.taxDueDate) : null,
      nextServiceDate: parsed.data.nextServiceDate ? new Date(parsed.data.nextServiceDate) : null,
      motReminderDays: parsed.data.motReminderDays,
      taxReminderDays: parsed.data.taxReminderDays,
      serviceReminderDays: parsed.data.serviceReminderDays,
      createdBy: user.id,
    })
    .returning({ id: cars.id })

  await fireCarReminders(newCar.id, memberRow.householdId, user.id, {
    motDueDate: parsed.data.motDueDate,
    taxDueDate: parsed.data.taxDueDate,
    nextServiceDate: parsed.data.nextServiceDate,
    motReminderDays: parsed.data.motReminderDays,
    taxReminderDays: parsed.data.taxReminderDays,
    serviceReminderDays: parsed.data.serviceReminderDays,
  })

  revalidatePath('/cars')
  revalidatePath('/calendar')

  return { success: true, data: { id: newCar.id } }
}

export async function updateCar(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = updateCarSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Verify car belongs to this household
  const [existingCar] = await db
    .select({ id: cars.id })
    .from(cars)
    .where(and(eq(cars.id, parsed.data.id), eq(cars.householdId, memberRow.householdId)))
    .limit(1)

  if (!existingCar) return { success: false, error: 'Car not found' }

  await db
    .update(cars)
    .set({
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      plate: parsed.data.plate,
      colour: parsed.data.colour ?? null,
      motDueDate: parsed.data.motDueDate ? new Date(parsed.data.motDueDate) : null,
      taxDueDate: parsed.data.taxDueDate ? new Date(parsed.data.taxDueDate) : null,
      nextServiceDate: parsed.data.nextServiceDate ? new Date(parsed.data.nextServiceDate) : null,
      motReminderDays: parsed.data.motReminderDays,
      taxReminderDays: parsed.data.taxReminderDays,
      serviceReminderDays: parsed.data.serviceReminderDays,
    })
    .where(eq(cars.id, parsed.data.id))

  // Fire new reminder events for any changed key dates
  // (Inngest function re-checks DB before sending, so stale reminders are harmless)
  await fireCarReminders(parsed.data.id, memberRow.householdId, user.id, {
    motDueDate: parsed.data.motDueDate,
    taxDueDate: parsed.data.taxDueDate,
    nextServiceDate: parsed.data.nextServiceDate,
    motReminderDays: parsed.data.motReminderDays,
    taxReminderDays: parsed.data.taxReminderDays,
    serviceReminderDays: parsed.data.serviceReminderDays,
  })

  revalidatePath('/cars')
  revalidatePath('/calendar')

  return { success: true, data: { id: parsed.data.id } }
}

export async function deleteCar(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = deleteSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid car ID' }

  // Verify car belongs to this household
  const [existingCar] = await db
    .select({ id: cars.id })
    .from(cars)
    .where(and(eq(cars.id, parsed.data.id), eq(cars.householdId, memberRow.householdId)))
    .limit(1)

  if (!existingCar) return { success: false, error: 'Car not found' }

  // Delete car (cascade deletes service records via FK)
  await db.delete(cars).where(eq(cars.id, parsed.data.id))

  revalidatePath('/cars')
  revalidatePath('/calendar')

  return { success: true }
}

// ---------------------------------------------------------------------------
// Server Actions — Service Records
// ---------------------------------------------------------------------------

export async function createServiceRecord(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createServiceRecordSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Verify the car belongs to this household
  const [car] = await db
    .select({ id: cars.id })
    .from(cars)
    .where(and(eq(cars.id, parsed.data.carId), eq(cars.householdId, memberRow.householdId)))
    .limit(1)

  if (!car) return { success: false, error: 'Car not found' }

  const [newRecord] = await db
    .insert(serviceRecords)
    .values({
      householdId: memberRow.householdId,
      carId: parsed.data.carId,
      serviceDate: new Date(parsed.data.serviceDate),
      serviceType: parsed.data.serviceType,
      mileage: parsed.data.mileage ?? null,
      garage: parsed.data.garage ?? null,
      costCents: parsed.data.costCents ?? null,
      notes: parsed.data.notes ?? null,
      createdBy: user.id,
    })
    .returning({ id: serviceRecords.id })

  revalidatePath('/cars')

  return { success: true, data: { id: newRecord.id } }
}

export async function updateServiceRecord(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = updateServiceRecordSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Verify the service record belongs to this household
  const [existingRecord] = await db
    .select({ id: serviceRecords.id })
    .from(serviceRecords)
    .where(and(eq(serviceRecords.id, parsed.data.id), eq(serviceRecords.householdId, memberRow.householdId)))
    .limit(1)

  if (!existingRecord) return { success: false, error: 'Service record not found' }

  await db
    .update(serviceRecords)
    .set({
      carId: parsed.data.carId,
      serviceDate: new Date(parsed.data.serviceDate),
      serviceType: parsed.data.serviceType,
      mileage: parsed.data.mileage ?? null,
      garage: parsed.data.garage ?? null,
      costCents: parsed.data.costCents ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(serviceRecords.id, parsed.data.id))

  revalidatePath('/cars')

  return { success: true, data: { id: parsed.data.id } }
}

export async function deleteServiceRecord(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = deleteSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid service record ID' }

  // Verify the record belongs to this household
  const [existingRecord] = await db
    .select({ id: serviceRecords.id })
    .from(serviceRecords)
    .where(and(eq(serviceRecords.id, parsed.data.id), eq(serviceRecords.householdId, memberRow.householdId)))
    .limit(1)

  if (!existingRecord) return { success: false, error: 'Service record not found' }

  await db.delete(serviceRecords).where(eq(serviceRecords.id, parsed.data.id))

  revalidatePath('/cars')

  return { success: true }
}
