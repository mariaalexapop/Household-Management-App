import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cars, serviceRecords, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { CarsClient } from './CarsClient'
import { AppHeader } from '@/components/nav/AppHeader'

export const metadata = { title: 'Cars — Kinship' }

export default async function CarsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  const { householdId } = memberRow

  const [carRows, recordRows] = await Promise.all([
    db.select().from(cars).where(eq(cars.householdId, householdId)),
    db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.householdId, householdId))
      .orderBy(desc(serviceRecords.serviceDate)),
  ])

  // Serialize Date objects to ISO strings for client props
  const serializedCars = carRows.map((c) => ({
    id: c.id,
    householdId: c.householdId,
    make: c.make,
    model: c.model,
    year: c.year,
    plate: c.plate,
    colour: c.colour,
    motDueDate: c.motDueDate ? c.motDueDate.toISOString() : null,
    taxDueDate: c.taxDueDate ? c.taxDueDate.toISOString() : null,
    nextServiceDate: c.nextServiceDate ? c.nextServiceDate.toISOString() : null,
    motReminderDays: c.motReminderDays ?? 30,
    taxReminderDays: c.taxReminderDays ?? 30,
    serviceReminderDays: c.serviceReminderDays ?? 14,
    createdBy: c.createdBy,
    createdAt: c.createdAt ? c.createdAt.toISOString() : null,
  }))

  const serializedServiceRecords = recordRows.map((r) => ({
    id: r.id,
    householdId: r.householdId,
    carId: r.carId,
    serviceDate: r.serviceDate.toISOString(),
    serviceType: r.serviceType as 'full_service' | 'mot' | 'repair' | 'tyre' | 'other',
    mileage: r.mileage,
    garage: r.garage,
    costCents: r.costCents,
    notes: r.notes,
    createdBy: r.createdBy,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }))

  return (
    <div className="min-h-screen bg-kinship-surface">
      <AppHeader subtitle="Cars" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-kinship-primary hover:underline">
          ← Go back to main dashboard
        </a>
        <CarsClient cars={serializedCars} serviceRecords={serializedServiceRecords} />
      </main>
    </div>
  )
}
