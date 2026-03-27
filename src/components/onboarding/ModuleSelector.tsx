'use client'

import { CheckSquare, Car, Shield, Laptop, Users, Check } from 'lucide-react'
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

const MODULES: ModuleKey[] = ['chores', 'car', 'insurance', 'electronics', 'kids']

interface ModuleSelectorProps {
  selected: ModuleKey[]
  onToggle: (module: ModuleKey) => void
}

export function ModuleSelector({ selected, onToggle }: ModuleSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {MODULES.map((key) => {
        const { label, description, Icon } = MODULE_META[key]
        const isSelected = selected.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={[
              'flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors',
              isSelected
                ? 'border-kinship-primary bg-kinship-primary/5'
                : 'border-kinship-surface-container bg-kinship-surface-container-lowest hover:border-kinship-primary/40',
            ].join(' ')}
          >
            <Icon
              className={[
                'h-5 w-5 shrink-0',
                isSelected ? 'text-kinship-primary' : 'text-kinship-on-surface/50',
              ].join(' ')}
            />
            <div className="flex-1">
              <p
                className={[
                  'font-display text-sm font-semibold',
                  isSelected ? 'text-kinship-primary' : 'text-kinship-on-surface',
                ].join(' ')}
              >
                {label}
              </p>
              <p className="font-body text-xs text-kinship-on-surface/60">{description}</p>
            </div>
            {isSelected && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-kinship-primary">
                <Check className="h-3 w-3 text-white" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
