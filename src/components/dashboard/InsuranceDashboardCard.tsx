import { Shield, Plus } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

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
    <Card className="bg-kinship-surface-container-lowest p-6 flex flex-col gap-4">
      <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#9333ea]" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#9333ea]" aria-hidden="true" />
          <h3 className="font-display text-base font-semibold text-kinship-on-surface">Insurance</h3>
        </div>
        <Link
          href="/insurance?action=new"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#9333ea] hover:bg-[#9333ea]/10 transition-colors"
          aria-label="Add new policy"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="font-body text-sm text-kinship-on-surface-variant text-center">
            No policies tracked.
          </p>
          <Link
            href="/insurance?action=new"
            className="rounded-full bg-[#9333ea] px-4 py-1.5 font-body text-sm font-medium text-white hover:bg-[#9333ea]/90 transition-colors"
          >
            Add your first policy
          </Link>
        </div>
      ) : upcoming.length === 0 ? (
        <p className="font-body text-sm text-kinship-on-surface-variant">
          No upcoming expiries.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((p) => {
            const date = new Date(p.expiryDate!)
            const days = differenceInCalendarDays(date, today)
            return (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-body text-sm text-kinship-on-surface truncate">
                    {p.insurer} {p.policyType}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-body text-xs text-kinship-on-surface-variant">
                    {format(date, 'EEE d MMM')}
                  </span>
                  <span
                    className="rounded-full px-2 py-px font-medium text-white shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: '#9333ea', fontSize: '11px', lineHeight: '18px' }}
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
        <a href="/insurance" className="font-body text-sm text-[#9333ea] hover:underline">
          View all policies →
        </a>
      </div>
    </Card>
  )
}
