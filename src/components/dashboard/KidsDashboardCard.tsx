import { CalendarHeart } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'

export interface UpcomingActivity {
  id: string
  title: string
  childName: string | null
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
        <p className="font-body text-sm text-muted-foreground">
          No upcoming activities. Add one to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-center justify-between gap-2">
              <span className="font-body text-sm text-kinship-on-surface truncate">
                {activity.title}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {activity.childName && (
                  <span className="font-body text-xs text-muted-foreground">
                    {activity.childName}
                  </span>
                )}
                {activity.startsAt && (
                  <span className="font-body text-xs text-muted-foreground">
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
