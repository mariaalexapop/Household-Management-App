import { Car, ChevronRight } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import Link from 'next/link'

export interface UpcomingCar {
  id: string
  make: string
  model: string
  motDueDate: Date | null
  taxDueDate: Date | null
  nextServiceDate: Date | null
}

interface CarDashboardCardProps {
  cars: UpcomingCar[]
}

interface CountdownChip {
  carLabel: string
  type: 'MOT' | 'Tax' | 'Service'
  days: number
}

function collectChips(cars: UpcomingCar[]): CountdownChip[] {
  const today = new Date()
  const chips: CountdownChip[] = []
  for (const c of cars) {
    const label = `${c.make} ${c.model}`
    if (c.motDueDate) {
      const days = differenceInCalendarDays(new Date(c.motDueDate), today)
      if (days >= -1) chips.push({ carLabel: label, type: 'MOT', days })
    }
    if (c.taxDueDate) {
      const days = differenceInCalendarDays(new Date(c.taxDueDate), today)
      if (days >= -1) chips.push({ carLabel: label, type: 'Tax', days })
    }
    if (c.nextServiceDate) {
      const days = differenceInCalendarDays(new Date(c.nextServiceDate), today)
      if (days >= -1) chips.push({ carLabel: label, type: 'Service', days })
    }
  }
  return chips.sort((a, b) => a.days - b.days).slice(0, 4)
}

function chipColour(days: number): string {
  if (days <= 0) return 'bg-red-100 text-red-700'
  if (days <= 14) return 'bg-amber-100 text-amber-700'
  return 'bg-[#ffe6cd] text-[#7a4000]'
}

export function CarDashboardCard({ cars }: CarDashboardCardProps) {
  const chips = collectChips(cars)

  return (
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      {/* Colored header */}
      <div className="bg-[#ffe6cd] px-3.5 py-2.5 flex items-center gap-2 text-[#7a4000]">
        <Car className="h-4 w-4" />
        <span className="font-display font-semibold text-[13px]">Cars</span>
        <span className="flex-1" />
        <span className="font-body text-[11px] font-medium opacity-80">
          {cars.length} {cars.length === 1 ? 'vehicle' : 'vehicles'}
        </span>
        <Link
          href="/cars"
          className="flex items-center gap-0.5 font-body text-[11px] font-medium hover:underline"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {/* Content - countdown chips */}
      <div className="px-3.5 py-2.5">
        {cars.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No cars tracked.
          </p>
        ) : chips.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No upcoming key dates.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <span
                key={`${chip.carLabel}-${chip.type}-${i}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[11px] font-medium ${chipColour(chip.days)}`}
              >
                <span className="font-semibold">{chip.type}</span>
                <span className="opacity-70">{chip.carLabel}</span>
                <span className="ml-0.5 font-semibold">
                  {chip.days <= 0 ? 'today' : `${chip.days}d`}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
