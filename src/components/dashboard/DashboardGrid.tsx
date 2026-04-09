import { ModuleCard } from './ModuleCard'
import { EmptyModuleState } from './EmptyModuleState'
import { ChoresDashboardCard } from './ChoresDashboardCard'
import type { UpcomingTask } from './ChoresDashboardCard'
import { KidsDashboardCard } from './KidsDashboardCard'
import type { UpcomingActivity } from './KidsDashboardCard'
import type { ModuleKey } from '@/stores/onboarding'

interface DashboardGridProps {
  activeModules: ModuleKey[]
  upcomingTasks: UpcomingTask[]
  upcomingActivities: UpcomingActivity[]
}

export function DashboardGrid({ activeModules, upcomingTasks, upcomingActivities }: DashboardGridProps) {
  if (activeModules.length === 0) {
    return <EmptyModuleState />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeModules.map((key) => {
        if (key === 'chores') {
          return <ChoresDashboardCard key="chores" tasks={upcomingTasks} />
        }
        if (key === 'kids') {
          return <KidsDashboardCard key="kids" activities={upcomingActivities} />
        }
        return <ModuleCard key={key} moduleKey={key} />
      })}
    </div>
  )
}
