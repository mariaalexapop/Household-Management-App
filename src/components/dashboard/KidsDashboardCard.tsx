import { CalendarHeart, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { childHex } from '@/lib/kids/child-colours'

export interface UpcomingActivity {
  id: string
  title: string
  childName: string | null
  childId: string | null
  startsAt: Date | null
}

interface KidsDashboardCardProps {
  activities: UpcomingActivity[]
}

export function KidsDashboardCard({ activities }: KidsDashboardCardProps) {
  return (
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      {/* Colored header */}
      <div className="bg-[#ffc6c6] px-3.5 py-2.5 flex items-center gap-2 text-[#600000]">
        <CalendarHeart className="h-4 w-4" />
        <span className="font-display font-semibold text-[13px]">Kids Activities</span>
        <span className="flex-1" />
        <span className="font-body text-[11px] font-medium opacity-80">
          {activities.length} upcoming
        </span>
        <Link
          href="/kids"
          className="flex items-center gap-0.5 font-body text-[11px] font-medium hover:underline"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {/* Content */}
      <div className="px-3.5 py-2.5">
        {activities.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No upcoming activities.
          </p>
        ) : (
          <ul className="flex flex-col">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between gap-2 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-body text-sm text-kinship-on-surface truncate">
                    {activity.title}
                  </span>
                  {activity.childId && activity.childName && (
                    <span
                      className="rounded-full px-2 py-px font-medium text-white shrink-0 whitespace-nowrap"
                      style={{ backgroundColor: childHex(activity.childId), fontSize: '10px', lineHeight: '16px' }}
                    >
                      {activity.childName}
                    </span>
                  )}
                </div>
                <div className="flex items-center shrink-0">
                  {activity.startsAt && (
                    <span className="font-body text-[11px] text-kinship-on-surface-variant">
                      {format(new Date(activity.startsAt), 'MMM d')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
