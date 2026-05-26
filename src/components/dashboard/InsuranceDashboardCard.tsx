import { Shield, ChevronRight } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import Link from 'next/link'

export interface UpcomingPolicy {
  id: string
  insurer: string
  policyType: string
  expiryDate: Date | null
  nextPaymentDate: Date | null
}

interface InsuranceDashboardCardProps {
  policies: UpcomingPolicy[]
}

export function InsuranceDashboardCard({ policies }: InsuranceDashboardCardProps) {
  const today = new Date()
  const upcoming = [...policies]
    .filter((p) => p.expiryDate && differenceInCalendarDays(new Date(p.expiryDate), today) >= -1)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 3)

  return (
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      {/* Colored header */}
      <div className="bg-[#d9d4ff] px-3.5 py-2.5 flex items-center gap-2 text-[#3d2a8a]">
        <Shield className="h-4 w-4" />
        <span className="font-display font-semibold text-[13px]">Insurance</span>
        <span className="flex-1" />
        <span className="font-body text-[11px] font-medium opacity-80">
          {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
        </span>
        <Link
          href="/insurance"
          className="flex items-center gap-0.5 font-body text-[11px] font-medium hover:underline"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {/* Content */}
      <div className="px-3.5 py-2.5">
        {policies.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No policies tracked.
          </p>
        ) : upcoming.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No upcoming expiries.
          </p>
        ) : (
          <ul className="flex flex-col">
            {upcoming.map((p) => {
              const date = new Date(p.expiryDate!)
              const days = differenceInCalendarDays(date, today)
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="font-body text-sm text-kinship-on-surface truncate">
                    {p.insurer} {p.policyType}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-body text-[11px] text-kinship-on-surface-variant">
                      {format(date, 'EEE d MMM')}
                    </span>
                    <span
                      className={`rounded-full px-2 py-px font-body text-[10px] font-semibold ${
                        days <= 14 ? 'bg-amber-100 text-amber-700' : 'bg-[#d9d4ff] text-[#3d2a8a]'
                      }`}
                    >
                      {days <= 0 ? 'today' : `${days}d`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
