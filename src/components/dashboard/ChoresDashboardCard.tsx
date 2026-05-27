import { CheckSquare, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

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
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      {/* Colored header */}
      <div className="bg-[#c3faf5] px-3.5 py-2.5 flex items-center gap-2 text-[#187574]">
        <CheckSquare className="h-4 w-4" />
        <span className="font-display font-semibold text-[13px]">Tasks</span>
        <span className="flex-1" />
        <span className="font-body text-[11px] font-medium opacity-80">
          {tasks.length} upcoming
        </span>
        <Link
          href="/chores"
          className="flex items-center gap-0.5 font-body text-[11px] font-medium hover:underline"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {/* Content */}
      <div className="px-3.5 py-2.5">
        {tasks.length === 0 ? (
          <p className="font-body text-sm text-kinship-on-surface-variant py-1">
            No upcoming tasks.
          </p>
        ) : (
          <ul className="flex flex-col">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="font-body text-sm text-kinship-on-surface truncate">
                  {task.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {task.areaName && (
                    <span className="font-body text-[11px] text-kinship-on-surface-variant">
                      {task.areaName}
                    </span>
                  )}
                  {task.startsAt && (
                    <span className="font-body text-[11px] text-kinship-on-surface-variant">
                      {format(new Date(task.startsAt), 'EEE d MMM')}
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
