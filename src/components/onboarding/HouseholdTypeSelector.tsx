'use client'

import { Heart, Home, Users, User } from 'lucide-react'
import type { HouseholdType } from '@/stores/onboarding'

interface HouseholdTypeMeta {
  label: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
}

const TYPE_META: Record<HouseholdType, HouseholdTypeMeta> = {
  couple: {
    label: 'Couple',
    description: 'Two adults sharing a home',
    Icon: Heart,
  },
  family_with_kids: {
    label: 'Family with Kids',
    description: 'Parents and children under one roof',
    Icon: Users,
  },
  flatmates: {
    label: 'Flatmates',
    description: 'Housemates sharing a rental',
    Icon: Home,
  },
  single: {
    label: 'Single',
    description: 'Living alone',
    Icon: User,
  },
}

const TYPES: HouseholdType[] = ['couple', 'family_with_kids', 'flatmates', 'single']

interface HouseholdTypeSelectorProps {
  selected: HouseholdType | null
  onSelect: (type: HouseholdType) => void
}

export function HouseholdTypeSelector({ selected, onSelect }: HouseholdTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TYPES.map((type) => {
        const { label, description, Icon } = TYPE_META[type]
        const isSelected = selected === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={[
              'flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors',
              isSelected
                ? 'border-kinship-primary bg-kinship-primary/5'
                : 'border-kinship-surface-container bg-kinship-surface-container-lowest hover:border-kinship-primary/40',
            ].join(' ')}
          >
            <Icon
              className={[
                'h-5 w-5',
                isSelected ? 'text-kinship-primary' : 'text-kinship-on-surface-variant',
              ].join(' ')}
            />
            <div>
              <p
                className={[
                  'font-display text-sm font-semibold',
                  isSelected ? 'text-kinship-primary' : 'text-kinship-on-surface',
                ].join(' ')}
              >
                {label}
              </p>
              <p className="font-body text-xs text-kinship-on-surface-variant">{description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
