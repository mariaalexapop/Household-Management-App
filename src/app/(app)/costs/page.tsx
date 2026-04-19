import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  householdMembers,
  serviceRecords,
  insurancePolicies,
  electronics,
  cars,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { CostsClient, type MonthlyCostRow } from './CostsClient'
import { AppHeader } from '@/components/nav/AppHeader'

export const metadata = { title: 'Costs — Kinship' }

interface CostsPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function CostsPage({ searchParams }: CostsPageProps) {
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

  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const parsedYear = params.year ? Number.parseInt(params.year, 10) : currentYear
  const selectedYear =
    Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : currentYear
  const yearStart = new Date(selectedYear, 0, 1)
  const yearEnd = new Date(selectedYear + 1, 0, 1)

  // Parallel cost aggregation queries — group by month-of-year
  const [carRows, carMotTaxRows, insuranceRows, electronicsRows] = await Promise.all([
    db.execute(sql`
      SELECT to_char(${serviceRecords.serviceDate}, 'YYYY-MM') AS month,
             COALESCE(SUM(${serviceRecords.costCents}), 0)::int AS total
      FROM ${serviceRecords}
      WHERE ${serviceRecords.householdId} = ${householdId}
        AND ${serviceRecords.serviceDate} >= ${yearStart.toISOString()}
        AND ${serviceRecords.serviceDate} < ${yearEnd.toISOString()}
      GROUP BY month
    `),
    // MOT and Road Tax costs from the cars table
    db.execute(sql`
      SELECT ${cars.motCostCents} AS mot_cost_cents,
             ${cars.motPaymentDate} AS mot_payment_date,
             ${cars.taxCostCents} AS tax_cost_cents,
             ${cars.taxPaymentDate} AS tax_payment_date
      FROM ${cars}
      WHERE ${cars.householdId} = ${householdId}
        AND (${cars.motCostCents} IS NOT NULL OR ${cars.taxCostCents} IS NOT NULL)
    `),
    db.execute(sql`
      SELECT ${insurancePolicies.premiumCents} AS premium_cents,
             ${insurancePolicies.paymentSchedule} AS payment_schedule,
             ${insurancePolicies.nextPaymentDate} AS next_payment_date,
             ${insurancePolicies.createdAt} AS created_at,
             ${insurancePolicies.policyType} AS policy_type
      FROM ${insurancePolicies}
      WHERE ${insurancePolicies.householdId} = ${householdId}
        AND ${insurancePolicies.premiumCents} IS NOT NULL
        AND ${insurancePolicies.paymentSchedule} IS NOT NULL
    `),
    db.execute(sql`
      SELECT to_char(${electronics.purchaseDate}, 'YYYY-MM') AS month,
             COALESCE(SUM(${electronics.costCents}), 0)::int AS total
      FROM ${electronics}
      WHERE ${electronics.householdId} = ${householdId}
        AND ${electronics.purchaseDate} >= ${yearStart.toISOString()}
        AND ${electronics.purchaseDate} < ${yearEnd.toISOString()}
      GROUP BY month
    `),
  ])

  function rowsToMap(rows: unknown): Map<string, number> {
    const m = new Map<string, number>()
    const arr = rows as Array<{ month: string | null; total: number | string | null }>
    for (const r of arr) {
      if (!r.month) continue
      const total = typeof r.total === 'string' ? Number.parseInt(r.total, 10) : (r.total ?? 0)
      m.set(r.month, total ?? 0)
    }
    return m
  }

  const carMap = rowsToMap(carRows)
  const electronicsMap = rowsToMap(electronicsRows)

  // Add MOT and Road Tax costs from cars table into carMap
  const carMotTax = carMotTaxRows as unknown as Array<{
    mot_cost_cents: number | string | null
    mot_payment_date: string | Date | null
    tax_cost_cents: number | string | null
    tax_payment_date: string | Date | null
  }>
  for (const c of carMotTax) {
    if (c.mot_cost_cents && c.mot_payment_date) {
      const d = new Date(c.mot_payment_date)
      if (d.getFullYear() === selectedYear) {
        const key = `${selectedYear}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const cents = typeof c.mot_cost_cents === 'string' ? parseInt(c.mot_cost_cents, 10) : c.mot_cost_cents
        carMap.set(key, (carMap.get(key) ?? 0) + cents)
      }
    }
    if (c.tax_cost_cents && c.tax_payment_date) {
      const d = new Date(c.tax_payment_date)
      if (d.getFullYear() === selectedYear) {
        const key = `${selectedYear}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const cents = typeof c.tax_cost_cents === 'string' ? parseInt(c.tax_cost_cents, 10) : c.tax_cost_cents
        carMap.set(key, (carMap.get(key) ?? 0) + cents)
      }
    }
  }

  // Project insurance premiums across months based on payment schedule,
  // routing costs to the right category by policy type:
  //   car → carInsuranceMap (merged into car column)
  //   health, life → medicalMap
  //   home → homeMap
  const carInsuranceMap = new Map<string, number>()
  const medicalMap = new Map<string, number>()
  const homeMap = new Map<string, number>()
  const insPolicies = insuranceRows as unknown as Array<{
    premium_cents: number | string | null
    payment_schedule: string | null
    next_payment_date: string | Date | null
    created_at: string | Date | null
    policy_type: string | null
  }>
  for (const p of insPolicies) {
    const cents = typeof p.premium_cents === 'string' ? parseInt(p.premium_cents, 10) : (p.premium_cents ?? 0)
    if (!cents || !p.payment_schedule) continue

    // Pick the target map based on policy type
    let targetMap: Map<string, number>
    if (p.policy_type === 'car') {
      targetMap = carInsuranceMap
    } else if (p.policy_type === 'health' || p.policy_type === 'life') {
      targetMap = medicalMap
    } else if (p.policy_type === 'home') {
      targetMap = homeMap
    } else {
      // travel, other — default to home for now
      targetMap = homeMap
    }

    const intervalMonths = p.payment_schedule === 'monthly' ? 1 : p.payment_schedule === 'quarterly' ? 3 : 12

    // Earliest month this policy can have costs (month it was created)
    const policyStart = p.created_at ? new Date(p.created_at) : null
    const earliestAbsMonth = policyStart
      ? policyStart.getFullYear() * 12 + policyStart.getMonth()
      : selectedYear * 12 // fallback: start of selected year

    // Determine which months in the selected year have a payment
    if (p.next_payment_date) {
      const anchor = new Date(p.next_payment_date)
      const anchorMonth = anchor.getFullYear() * 12 + anchor.getMonth()
      for (let m = 0; m < 12; m++) {
        const targetMonth = selectedYear * 12 + m
        // Skip months before the policy existed
        if (targetMonth < earliestAbsMonth) continue
        const diff = targetMonth - anchorMonth
        if (diff % intervalMonths === 0) {
          const key = `${selectedYear}-${String(m + 1).padStart(2, '0')}`
          targetMap.set(key, (targetMap.get(key) ?? 0) + cents)
        }
      }
    } else {
      // No anchor date — distribute based on schedule starting from policy creation
      for (let m = 0; m < 12; m += intervalMonths) {
        const targetMonth = selectedYear * 12 + m
        if (targetMonth < earliestAbsMonth) continue
        const key = `${selectedYear}-${String(m + 1).padStart(2, '0')}`
        targetMap.set(key, (targetMap.get(key) ?? 0) + cents)
      }
    }
  }

  // Build 12-month rows — car insurance costs are merged into the car column
  const months: MonthlyCostRow[] = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
    return {
      monthKey,
      monthIndex: i,
      carCents: (carMap.get(monthKey) ?? 0) + (carInsuranceMap.get(monthKey) ?? 0),
      medicalCents: medicalMap.get(monthKey) ?? 0,
      homeCents: homeMap.get(monthKey) ?? 0,
      electronicsCents: electronicsMap.get(monthKey) ?? 0,
    }
  })

  // Year list: current year ± 2 (5 years)
  const yearOptions: number[] = []
  for (let y = currentYear - 2; y <= currentYear + 2; y++) yearOptions.push(y)
  if (!yearOptions.includes(selectedYear)) {
    yearOptions.push(selectedYear)
    yearOptions.sort((a, b) => a - b)
  }

  return (
    <div className="min-h-screen bg-kinship-surface">
      <AppHeader subtitle="Costs" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-kinship-primary hover:underline">
          ← Go back to main dashboard
        </a>
        <CostsClient
          monthlyRows={months}
          selectedYear={selectedYear}
          yearOptions={yearOptions}
        />
      </main>
    </div>
  )
}
