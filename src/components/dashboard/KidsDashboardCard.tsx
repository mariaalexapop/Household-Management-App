import { CalendarHeart } from 'lucide-react'
import { format } from 'date-fns'
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
      <div className="flex items-center gap-2">
        <CalendarHeart className="h-5 w-5 text-[#16a34a]" aria-hidden="true" />
        <h3 className="font-display text-base font-semibold text-kinship-on-surface">Kids Activities</h3>
      </div>

      {activities.length === 0 ? (
        <p className="font-body text-sm text-kinship-on-surface-variant">
          No upcoming activities. Add one to get started.
        </p>
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
                    className="rounded-full px-1.5 font-medium text-white shrink-0 inline-block"
                    style={{ backgroundColor: childHex(activity.childId), fontSize: '10px', lineHeight: '16px' }}
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
