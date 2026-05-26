import { Monitor, ChevronRight } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import Link from 'next/link'

export interface UpcomingElectronic {
  id: string
  name: string
  warrantyExpiryDate: Date | null
}

interface ElectronicsDashboardCardProps {
  items: UpcomingElectronic[]
}

function warrantyBadge(expiryDate: Date | null): { label: string; className: string } {
  if (!expiryDate) return { label: 'No warranty', className: 'bg-gray-100 text-gray-500' }
  const days = differenceInCalendarDays(new Date(expiryDate), new Date())
  if (days < 0) return { label: 'Expired', className: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `${days}d left`, className: 'bg-amber-100 text-amber-700' }
  if (days <= 90) return { label: `${days}d left`, className: 'bg-[#d4f5c3] text-[#1f5c1f]' }
  return { label: 'Active', className: 'bg-[#d4f5c3] text-[#1f5c1f]' }
}

export function ElectronicsDashboardCard({ items }: ElectronicsDashboardCardProps) {
  /* Show items sorted by warranty expiry (soonest first), limit to 4 */
  const sorted = [...items]
    .sort((a, b) => {
      if (!a.warrantyExpiryDate) return 1
      if (!b.warrantyExpiryDate) return -1
      return new Date(a.warrantyExpiryDate).getTime() - new Date(b.warrantyExpiryDate).getTime()
    })
    .slice(0, 4)

  return (
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      {/* Colored header */}
      <div className="bg-[#d4f5c3] px-3.5 py-2.5 flex items-center gap-2 text-[#1f5c1f]">
        <Monitor className="h-4 w-4" />
        <span className="font-display font-semibold text-[13px]">Electronics</span>
        <span className="flex-1" />
        <span className="font-body text-[11px] font-medium opacity-80">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
        <Link
          href="/electronics"
          className="flex items-center gap-0.5 font-body text-[11px] font-medium hover:underline"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {/* Content */}
      <div className="px-3.5 py-2.5">
        {items.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No electronics tracked.
          </p>
        ) : (
          <ul className="flex flex-col">
            {sorted.map((item) => {
              const badge = warrantyBadge(item.warrantyExpiryDate)
              return (
                <li key={item.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="font-body text-sm text-kinship-on-surface truncate">
                    {item.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-px font-body text-[10px] font-semibold shrink-0 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
