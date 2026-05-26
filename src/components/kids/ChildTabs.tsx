'use client'

import type { ChildItem } from '@/app/(app)/kids/KidsClient'
import { childHex } from '@/lib/kids/child-colours'

interface ChildTabsProps {
  children: ChildItem[]
  selectedChildIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
}

export function ChildTabs({ children, selectedChildIds, onToggle, onSelectAll }: ChildTabsProps) {
  const allSelected = selectedChildIds.size === 0

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        onClick={onSelectAll}
        className={`rounded-full px-4 py-1.5 text-sm font-body font-medium transition-all ${
          allSelected
            ? 'bg-module-kids-light text-module-kids-dark font-semibold shadow-sm border border-module-kids-dark/20'
            : 'bg-white border border-kinship-outline-variant text-kinship-on-surface hover:bg-kinship-surface-container-low'
        }`}
      >
        All
      </button>
      {children.map((child) => {
        const isSelected = selectedChildIds.has(child.id)
        return (
          <button
            key={child.id}
            onClick={() => onToggle(child.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-body font-medium transition-all flex items-center gap-2 ${
              isSelected
                ? 'bg-module-kids-light text-module-kids-dark font-semibold shadow-sm border border-module-kids-dark/20'
                : 'bg-white border border-kinship-outline-variant text-kinship-on-surface hover:bg-kinship-surface-container-low'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: isSelected ? childHex(child.id) : childHex(child.id) }}
            />
            {child.name}
          </button>
        )
      })}
    </div>
  )
}
