import { CalendarHeart, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
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
    <Card className="bg-kinship-surface-container-lowest p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-[#16a34a]" aria-hidden="true" />
          <h3 className="font-display text-base font-semibold text-kinship-on-surface">Kids Activities</h3>
        </div>
        <Link
          href="/kids?action=new"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#16a34a] hover:bg-[#16a34a]/10 transition-colors"
          aria-label="Add new activity"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="font-body text-sm text-kinship-on-surface-variant text-center">
            No upcoming activities.
          </p>
          <Link
            href="/kids?action=new"
            className="rounded-full bg-[#16a34a] px-4 py-1.5 font-body text-sm font-medium text-white hover:bg-[#16a34a]/90 transition-colors"
          >
            Add your first activity
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-body text-sm text-kinship-on-surface truncate">
                  {activity.title}
                </span>
                {activity.childId && activity.childName && (
                  <span
                    className="rounded-full px-2 py-px font-medium text-white shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: childHex(activity.childId), fontSize: '11px', lineHeight: '18px' }}
                  >
                    {activity.childName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activity.startsAt && (
                  <span className="font-body text-xs text-kinship-on-surface-variant">
                    {format(new Date(activity.startsAt), 'MMM d')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2 border-t border-kinship-surface-container">
        <a
          href="/kids"
          className="font-body text-sm text-[#16a34a] hover:underline"
        >
          View all activities →
        </a>
      </div>
    </Card>
  )
}
