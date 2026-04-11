import { Car } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { Card } from '@/components/ui/card'

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

interface KeyDate {
  carLabel: string
  type: 'MOT' | 'Tax' | 'Service'
  date: Date
}

function collectKeyDates(cars: UpcomingCar[]): KeyDate[] {
  const today = new Date()
  const dates: KeyDate[] = []
  for (const c of cars) {
    const label = `${c.make} ${c.model}`
    if (c.motDueDate) dates.push({ carLabel: label, type: 'MOT', date: new Date(c.motDueDate) })
    if (c.taxDueDate) dates.push({ carLabel: label, type: 'Tax', date: new Date(c.taxDueDate) })
    if (c.nextServiceDate) dates.push({ carLabel: label, type: 'Service', date: new Date(c.nextServiceDate) })
  }
  return dates
    .filter((d) => differenceInCalendarDays(d.date, today) >= -1)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3)
}

export function CarDashboardCard({ cars }: CarDashboardCardProps) {
  const upcoming = collectKeyDates(cars)
  const today = new Date()

  return (
    <Card className="bg-kinship-surface-container-lowest p-6 flex flex-col gap-4">
      <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#ea580c]" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <Car className="h-5 w-5 text-[#ea580c]" aria-hidden="true" />
        <h3 className="font-display text-base font-semibold text-kinship-on-surface">Cars</h3>
      </div>

      {cars.length === 0 ? (
        <p className="font-body text-sm text-kinship-on-surface-variant">
          No cars tracked. Add a car to get started.
        </p>
      ) : upcoming.length === 0 ? (
        <p className="font-body text-sm text-kinship-on-surface-variant">
          No upcoming key dates.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((d, i) => {
            const days = differenceInCalendarDays(d.date, today)
            return (
              <li key={`${d.carLabel}-${d.type}-${i}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-body text-sm text-kinship-on-surface truncate">
                    {d.type}: {d.carLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-body text-xs text-kinship-on-surface-variant">
                    {format(d.date, 'EEE d MMM')}
                  </span>
                  <span
                    className="rounded-full px-2 py-px font-medium text-white shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: '#ea580c', fontSize: '11px', lineHeight: '18px' }}
                  >
                    {days <= 0 ? 'today' : `${days}d`}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="pt-2 border-t border-kinship-surface-container">
        <a href="/cars" className="font-body text-sm text-[#ea580c] hover:underline">
          View all cars →
        </a>
      </div>
    </Card>
  )
}
