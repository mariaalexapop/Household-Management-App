import { ModuleCard } from './ModuleCard'
import { EmptyModuleState } from './EmptyModuleState'
import { ChoresDashboardCard } from './ChoresDashboardCard'
import type { UpcomingTask } from './ChoresDashboardCard'
import { KidsDashboardCard } from './KidsDashboardCard'
import type { UpcomingActivity } from './KidsDashboardCard'
import { CarDashboardCard } from './CarDashboardCard'
import type { UpcomingCar } from './CarDashboardCard'
import { InsuranceDashboardCard } from './InsuranceDashboardCard'
import type { UpcomingPolicy } from './InsuranceDashboardCard'
import { ElectronicsDashboardCard } from './ElectronicsDashboardCard'
import type { UpcomingElectronic } from './ElectronicsDashboardCard'
import type { ModuleKey } from '@/stores/onboarding'

interface DashboardGridProps {
  activeModules: ModuleKey[]
  upcomingTasks: UpcomingTask[]
  upcomingActivities: UpcomingActivity[]
  upcomingCars: UpcomingCar[]
  upcomingPolicies: UpcomingPolicy[]
  upcomingElectronics: UpcomingElectronic[]
}

export function DashboardGrid({
  activeModules,
  upcomingTasks,
  upcomingActivities,
  upcomingCars,
  upcomingPolicies,
  upcomingElectronics,
}: DashboardGridProps) {
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
        if (key === 'car') {
          return <CarDashboardCard key="car" cars={upcomingCars} />
        }
        if (key === 'insurance') {
          return <InsuranceDashboardCard key="insurance" policies={upcomingPolicies} />
        }
        if (key === 'electronics') {
          return <ElectronicsDashboardCard key="electronics" items={upcomingElectronics} />
        }
        return <ModuleCard key={key} moduleKey={key} />
      })}
    </div>
  )
}
