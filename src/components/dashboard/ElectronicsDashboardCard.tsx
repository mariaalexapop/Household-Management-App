import { Monitor } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { Card } from '@/components/ui/card'

export interface UpcomingElectronic {
  id: string
  name: string
  warrantyExpiryDate: Date | null
}

interface ElectronicsDashboardCardProps {
  items: UpcomingElectronic[]
}

export function ElectronicsDashboardCard({ items }: ElectronicsDashboardCardProps) {
  const today = new Date()
  const upcoming = items
    .filter((i) => i.warrantyExpiryDate != null)
    .map((i) => ({ ...i, warrantyExpiryDate: new Date(i.warrantyExpiryDate as Date) }))
    .filter((i) => differenceInCalendarDays(i.warrantyExpiryDate, today) >= -1)
    .sort((a, b) => a.warrantyExpiryDate.getTime() - b.warrantyExpiryDate.getTime())
    .slice(0, 3)

  return (
    <Card className="bg-kinship-surface-container-lowest p-6 flex flex-col gap-4">
      <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#0d9488]" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5 text-[#0d9488]" aria-hidden="true" />
        <h3 className="font-display text-base font-semibold text-kinship-on-surface">Electronics</h3>
      </div>

      {items.length === 0 ? (
        <p className="font-body text-sm text-kinship-on-surface-variant">
          No electronics tracked. Add an item to get started.
        </p>
      ) : upcoming.length === 0 ? (
        <p className="font-body text-sm text-kinship-on-surface-variant">
          No upcoming warranty expiries.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((i) => {
            const days = differenceInCalendarDays(i.warrantyExpiryDate, today)
            return (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-body text-sm text-kinship-on-surface truncate">
                    {i.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-body text-xs text-kinship-on-surface-variant">
                    {format(i.warrantyExpiryDate, 'EEE d MMM')}
                  </span>
                  <span
                    className="rounded-full px-2 py-px font-medium text-white shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: '#0d9488', fontSize: '11px', lineHeight: '18px' }}
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
        <a href="/electronics" className="font-body text-sm text-[#0d9488] hover:underline">
          View all electronics →
        </a>
      </div>
    </Card>
  )
}
