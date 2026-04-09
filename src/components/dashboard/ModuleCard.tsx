import { CheckSquare, Car, Shield, Laptop, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ModuleKey } from '@/stores/onboarding'

interface ModuleMeta {
  label: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
}

const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  chores: {
    label: 'Home Chores',
    description: 'Tasks, recurring chores, assignments',
    Icon: CheckSquare,
  },
  car: {
    label: 'Car Maintenance',
    description: 'Service history, MOT, tax reminders',
    Icon: Car,
  },
  insurance: {
    label: 'Insurance',
    description: 'Policies, documents, expiry reminders',
    Icon: Shield,
  },
  electronics: {
    label: 'Electronics',
    description: 'Appliance registry, warranties, manuals',
    Icon: Laptop,
  },
  kids: {
    label: 'Kids Activities',
    description: 'Activities, calendar, reminders',
    Icon: Users,
  },
}

interface ModuleCardProps {
  moduleKey: ModuleKey
}

export function ModuleCard({ moduleKey }: ModuleCardProps) {
  const { label, description, Icon } = MODULE_META[moduleKey]

  return (
    <Card className="flex flex-col gap-3 p-6">
      <CardHeader className="p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kinship-primary/10">
            <Icon className="h-5 w-5 text-kinship-primary" />
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            Coming soon
          </Badge>
        </div>
        <CardTitle className="mt-3 font-display text-base font-semibold text-kinship-on-surface">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CardDescription className="font-body text-sm text-kinship-on-surface-variant">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
