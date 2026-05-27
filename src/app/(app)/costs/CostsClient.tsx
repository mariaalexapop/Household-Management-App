'use client'

import { useState } from 'react'
import { formatCostFromCents } from '@/lib/format'

export interface MonthlyCostRow {
  monthKey: string // 'YYYY-MM'
  monthIndex: number // 0..11
  carCents: number
  medicalCents: number
  homeCents: number
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

const CATEGORIES = [
  { key: 'car', label: 'Car', color: '#c67d2a', bg: 'bg-[#ffe6cd]', text: 'text-[#7a4000]' },
  { key: 'medical', label: 'Medical', color: '#6a55d9', bg: 'bg-[#d9d4ff]', text: 'text-[#3d2a8a]' },
  { key: 'home', label: 'Home', color: '#5b76fe', bg: 'bg-kinship-primary-surface', text: 'text-kinship-primary' },
  { key: 'electronics', label: 'Electronics', color: '#3f9b3f', bg: 'bg-[#d4f5c3]', text: 'text-[#1f5c1f]' },
] as const

function formatOrDash(cents: number): string {
  return cents === 0 ? '—' : formatCostFromCents(cents)
}

function getCents(row: MonthlyCostRow, key: string): number {
  switch (key) {
    case 'car': return row.carCents
    case 'medical': return row.medicalCents
    case 'home': return row.homeCents
    case 'electronics': return row.electronicsCents
    default: return 0
  }
}

export function CostsClient({ monthlyRows, selectedYear, yearOptions }: CostsClientProps) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null)

  const carTotal = monthlyRows.reduce((s, r) => s + r.carCents, 0)
  const medicalTotal = monthlyRows.reduce((s, r) => s + r.medicalCents, 0)
  const homeTotal = monthlyRows.reduce((s, r) => s + r.homeCents, 0)
  const electronicsTotal = monthlyRows.reduce((s, r) => s + r.electronicsCents, 0)
  const grandTotal = carTotal + medicalTotal + homeTotal + electronicsTotal

  const totals: Record<string, number> = { car: carTotal, medical: medicalTotal, home: homeTotal, electronics: electronicsTotal }

  // Find max monthly total for bar chart scaling
  const monthlyTotals = monthlyRows.map(
    (r) => r.carCents + r.medicalCents + r.homeCents + r.electronicsCents
  )
  const maxMonthly = Math.max(...monthlyTotals, 1)

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    window.location.href = `/costs?year=${e.target.value}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Year selector */}
      <div className="flex items-center justify-end">
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="h-10 rounded-xl border border-kinship-outline-variant bg-white px-3 font-body text-sm text-kinship-on-surface focus:outline-none focus:ring-2 focus:ring-kinship-primary"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Grand total + category totals */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-full bg-kinship-primary px-4 py-1.5 text-white flex items-center gap-2">
          <span className="font-body text-[10px] font-semibold uppercase tracking-wider opacity-80">Total</span>
          <span className="font-display text-sm font-bold">{formatOrDash(grandTotal)}</span>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className={`rounded-full ${cat.bg} px-3 py-1.5 flex items-center gap-2`}>
            <span className={`font-body text-[10px] font-semibold uppercase tracking-wider ${cat.text} opacity-70`}>{cat.label}</span>
            <span className={`font-display text-sm font-bold ${cat.text}`}>{formatOrDash(totals[cat.key])}</span>
          </div>
        ))}
      </div>

      {/* Monthly bar chart + breakdown */}
      <div className="rounded-2xl bg-white ring-miro overflow-hidden">
        <div className="px-4 py-3 border-b border-kinship-surface-container">
          <h3 className="font-display text-[13px] font-semibold text-kinship-on-surface">Monthly breakdown</h3>
        </div>

        <div className="divide-y divide-kinship-surface-container">
          {monthlyRows.map((row) => {
            const rowTotal = row.carCents + row.medicalCents + row.homeCents + row.electronicsCents
            const isExpanded = expandedMonth === row.monthIndex
            const barWidth = maxMonthly > 0 ? (rowTotal / maxMonthly) * 100 : 0

            return (
              <button
                key={row.monthKey}
                type="button"
                onClick={() => setExpandedMonth(isExpanded ? null : row.monthIndex)}
                className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-kinship-surface-container/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 shrink-0 font-body text-sm font-medium text-kinship-on-surface">
                    {MONTH_NAMES[row.monthIndex]}
                  </span>

                  {/* Stacked bar */}
                  <div className="flex-1 h-5 flex rounded-full overflow-hidden bg-kinship-surface-container/40">
                    {rowTotal > 0 && CATEGORIES.map((cat) => {
                      const cents = getCents(row, cat.key)
                      if (cents === 0) return null
                      const pct = (cents / maxMonthly) * 100
                      return (
                        <div
                          key={cat.key}
                          className="h-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          title={`${cat.label}: ${formatCostFromCents(cents)}`}
                        />
                      )
                    })}
                  </div>

                  <span className="w-20 shrink-0 text-right font-body text-sm font-semibold text-kinship-on-surface tabular-nums">
                    {formatOrDash(rowTotal)}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && rowTotal > 0 && (
                  <div className="mt-2 ml-11 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                    {CATEGORIES.map((cat) => {
                      const cents = getCents(row, cat.key)
                      if (cents === 0) return null
                      return (
                        <div key={cat.key} className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-body text-xs text-kinship-on-surface-variant">{cat.label}</span>
                          <span className="font-body text-xs font-medium text-kinship-on-surface tabular-nums">
                            {formatCostFromCents(cents)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer total */}
        <div className="flex items-center gap-3 border-t-2 border-kinship-surface-container bg-kinship-surface-container/20 px-4 py-3">
          <span className="w-8 shrink-0 font-display text-sm font-semibold text-kinship-on-surface">Total</span>
          <div className="flex-1" />
          <span className="w-20 shrink-0 text-right font-display text-sm font-bold text-kinship-on-surface tabular-nums">
            {formatOrDash(grandTotal)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
            <span className="font-body text-xs text-kinship-on-surface-variant">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
