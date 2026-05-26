import { CheckSquare, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-kinship-primary" aria-hidden="true" />
          <h3 className="font-display text-base font-semibold text-kinship-on-surface">Home Chores</h3>
        </div>
        <Link
          href="/chores?action=new"
          className="flex h-7 w-7 items-center justify-center rounded-full text-kinship-primary hover:bg-kinship-primary/10 transition-colors"
          aria-label="Add new task"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="font-body text-sm text-kinship-on-surface-variant text-center">
            No upcoming tasks.
          </p>
          <Link
            href="/chores?action=new"
            className="rounded-full bg-kinship-primary px-4 py-1.5 font-body text-sm font-medium text-white hover:bg-kinship-primary/90 transition-colors"
          >
            Add your first task
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between gap-2">
              <span className="font-body text-sm text-kinship-on-surface truncate">{task.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                {task.areaName && (
                  <span className="font-body text-xs text-kinship-on-surface-variant">{task.areaName}</span>
                )}
                {task.startsAt && (
                  <span className="font-body text-xs text-kinship-on-surface-variant">
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
          className="font-body text-sm text-kinship-primary hover:underline"
        >
          View all tasks →
        </a>
      </div>
    </Card>
  )
}
