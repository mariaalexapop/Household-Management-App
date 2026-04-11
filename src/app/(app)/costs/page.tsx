import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  householdMembers,
  serviceRecords,
  insurancePolicies,
  electronics,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { CostsClient, type MonthlyCostRow } from './CostsClient'

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
  const [carRows, insuranceRows, electronicsRows] = await Promise.all([
    db.execute(sql`
      SELECT to_char(${serviceRecords.serviceDate}, 'YYYY-MM') AS month,
             COALESCE(SUM(${serviceRecords.costCents}), 0)::int AS total
      FROM ${serviceRecords}
      WHERE ${serviceRecords.householdId} = ${householdId}
        AND ${serviceRecords.serviceDate} >= ${yearStart.toISOString()}
        AND ${serviceRecords.serviceDate} < ${yearEnd.toISOString()}
      GROUP BY month
    `),
    db.execute(sql`
      SELECT to_char(${insurancePolicies.nextPaymentDate}, 'YYYY-MM') AS month,
             COALESCE(SUM(${insurancePolicies.premiumCents}), 0)::int AS total
      FROM ${insurancePolicies}
      WHERE ${insurancePolicies.householdId} = ${householdId}
        AND ${insurancePolicies.nextPaymentDate} >= ${yearStart.toISOString()}
        AND ${insurancePolicies.nextPaymentDate} < ${yearEnd.toISOString()}
      GROUP BY month
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
  const insuranceMap = rowsToMap(insuranceRows)
  const electronicsMap = rowsToMap(electronicsRows)

  // Build 12-month rows
  const months: MonthlyCostRow[] = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
    return {
      monthKey,
      monthIndex: i,
      carCents: carMap.get(monthKey) ?? 0,
      insuranceCents: insuranceMap.get(monthKey) ?? 0,
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
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface-variant">Costs</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">Dashboard</a>
            <a href="/calendar" className="font-body text-sm text-kinship-primary hover:underline">Calendar</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <CostsClient
          monthlyRows={months}
          selectedYear={selectedYear}
          yearOptions={yearOptions}
        />
      </main>
    </div>
  )
}
