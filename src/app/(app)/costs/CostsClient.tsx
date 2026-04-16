'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { formatCostFromCents } from '@/lib/format'

export interface MonthlyCostRow {
  monthKey: string // 'YYYY-MM'
  monthIndex: number // 0..11
  carCents: number
  insuranceCents: number
  electronicsCents: number
}

interface CostsClientProps {
  monthlyRows: MonthlyCostRow[]
  selectedYear: number
  yearOptions: number[]
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatOrDash(cents: number): string {
  return cents === 0 ? '--' : formatCostFromCents(cents)
}

export function CostsClient({ monthlyRows, selectedYear, yearOptions }: CostsClientProps) {
  const router = useRouter()

  const carTotal = monthlyRows.reduce((s, r) => s + r.carCents, 0)
  const insuranceTotal = monthlyRows.reduce((s, r) => s + r.insuranceCents, 0)
  const electronicsTotal = monthlyRows.reduce((s, r) => s + r.electronicsCents, 0)
  const grandTotal = carTotal + insuranceTotal + electronicsTotal

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = e.target.value
    window.location.href = `/costs?year=${year}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row with title + year filter */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-kinship-on-surface">
          Costs for {selectedYear}
        </h2>
        <label className="flex items-center gap-2">
          <span className="font-body text-sm text-kinship-on-surface-variant">Year</span>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="rounded-lg border border-kinship-surface-container bg-kinship-surface-container-lowest px-3 py-1.5 font-body text-sm text-kinship-on-surface focus:outline-none focus:ring-2 focus:ring-kinship-primary"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Section totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-kinship-surface-container-lowest p-4">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#ea580c]" aria-hidden="true" />
          <p className="font-body text-xs text-kinship-on-surface-variant">Cars</p>
          <p className="font-display text-lg font-semibold text-kinship-on-surface">
            {formatOrDash(carTotal)}
          </p>
        </Card>
        <Card className="bg-kinship-surface-container-lowest p-4">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#9333ea]" aria-hidden="true" />
          <p className="font-body text-xs text-kinship-on-surface-variant">Insurance</p>
          <p className="font-display text-lg font-semibold text-kinship-on-surface">
            {formatOrDash(insuranceTotal)}
          </p>
        </Card>
        <Card className="bg-kinship-surface-container-lowest p-4">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#0d9488]" aria-hidden="true" />
          <p className="font-body text-xs text-kinship-on-surface-variant">Electronics</p>
          <p className="font-display text-lg font-semibold text-kinship-on-surface">
            {formatOrDash(electronicsTotal)}
          </p>
        </Card>
        <Card className="bg-kinship-surface-container-lowest p-4">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-kinship-primary" aria-hidden="true" />
          <p className="font-body text-xs text-kinship-on-surface-variant">Total</p>
          <p className="font-display text-lg font-semibold text-kinship-on-surface">
            {formatOrDash(grandTotal)}
          </p>
        </Card>
      </div>

      {/* Monthly breakdown table */}
      <Card className="bg-kinship-surface-container-lowest p-0 ring-miro rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-kinship-surface-container bg-kinship-surface-container/30">
              <tr>
                <th className="px-4 py-3 text-left font-display text-sm font-semibold text-kinship-on-surface">Month</th>
                <th className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface">Cars</th>
                <th className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface">Insurance</th>
                <th className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface">Electronics</th>
                <th className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((r) => {
                const rowTotal = r.carCents + r.insuranceCents + r.electronicsCents
                return (
                  <tr key={r.monthKey} className="border-b border-kinship-surface-container last:border-b-0">
                    <td className="px-4 py-2.5 font-body text-sm text-kinship-on-surface">
                      {MONTH_NAMES[r.monthIndex]}
                    </td>
                    <td className="px-4 py-2.5 text-right font-body text-sm text-kinship-on-surface tabular-nums">
                      {formatOrDash(r.carCents)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-body text-sm text-kinship-on-surface tabular-nums">
                      {formatOrDash(r.insuranceCents)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-body text-sm text-kinship-on-surface tabular-nums">
                      {formatOrDash(r.electronicsCents)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-body text-sm font-medium text-kinship-on-surface tabular-nums">
                      {formatOrDash(rowTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 border-kinship-surface-container bg-kinship-surface-container/30">
              <tr>
                <td className="px-4 py-3 font-display text-sm font-semibold text-kinship-on-surface">Total</td>
                <td className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface tabular-nums">
                  {formatOrDash(carTotal)}
                </td>
                <td className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface tabular-nums">
                  {formatOrDash(insuranceTotal)}
                </td>
                <td className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface tabular-nums">
                  {formatOrDash(electronicsTotal)}
                </td>
                <td className="px-4 py-3 text-right font-display text-sm font-semibold text-kinship-on-surface tabular-nums">
                  {formatOrDash(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
