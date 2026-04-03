import { CheckSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'

export interface UpcomingTask {
  id: string
  title: string
  areaName: string | null
  startsAt: Date | null
}

interface ChoresDashboardCardProps {
  tasks: UpcomingTask[]
}

export function ChoresDashboardCard({ tasks }: ChoresDashboardCardProps) {
  return (
    <Card className="bg-kinship-surface-container-lowest p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-[#0053dc]" aria-hidden="true" />
        <h3 className="font-display text-base font-semibold text-kinship-on-surface">Home Chores</h3>
      </div>

      {tasks.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">
          No upcoming tasks. Add a task to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between gap-2">
              <span className="font-body text-sm text-kinship-on-surface truncate">{task.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                {task.areaName && (
                  <span className="font-body text-xs text-muted-foreground">{task.areaName}</span>
                )}
                {task.startsAt && (
                  <span className="font-body text-xs text-muted-foreground">
                    {format(new Date(task.startsAt), 'EEE d MMM')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2 border-t border-kinship-surface-container">
        <a
          href="/chores"
          className="font-body text-sm text-[#0053dc] hover:underline"
        >
          View all tasks →
        </a>
      </div>
    </Card>
  )
}
