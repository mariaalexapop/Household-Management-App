import { ModuleCard } from './ModuleCard'
import { EmptyModuleState } from './EmptyModuleState'
import { ChoresDashboardCard } from './ChoresDashboardCard'
import type { UpcomingTask } from './ChoresDashboardCard'
import type { ModuleKey } from '@/stores/onboarding'

interface DashboardGridProps {
  activeModules: ModuleKey[]
  upcomingTasks: UpcomingTask[]
}

export function DashboardGrid({ activeModules, upcomingTasks }: DashboardGridProps) {
  if (activeModules.length === 0) {
    return <EmptyModuleState />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeModules.map((key) => {
        if (key === 'chores') {
          return <ChoresDashboardCard key="chores" tasks={upcomingTasks} />
        }
        return <ModuleCard key={key} moduleKey={key} />
      })}
    </div>
  )
}
