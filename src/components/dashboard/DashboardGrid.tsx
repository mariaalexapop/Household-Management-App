import { ModuleCard } from './ModuleCard'
import { EmptyModuleState } from './EmptyModuleState'
import type { ModuleKey } from '@/stores/onboarding'

interface DashboardGridProps {
  activeModules: ModuleKey[]
}

export function DashboardGrid({ activeModules }: DashboardGridProps) {
  if (activeModules.length === 0) {
    return <EmptyModuleState />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeModules.map((key) => (
        <ModuleCard key={key} moduleKey={key} />
      ))}
    </div>
  )
}
