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
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        onClick={onSelectAll}
        className={`rounded-full px-4 py-1.5 text-sm font-body transition-all ${
          allSelected
            ? 'bg-kinship-primary text-white font-semibold shadow-sm'
            : 'bg-kinship-surface-container text-kinship-on-surface hover:bg-kinship-surface-container-low'
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
            className={`rounded-full px-4 py-1.5 text-sm font-body transition-all flex items-center gap-2 ${
              isSelected
                ? 'text-white font-semibold shadow-sm'
                : 'bg-kinship-surface-container text-kinship-on-surface hover:bg-kinship-surface-container-low'
            }`}
            style={isSelected ? { backgroundColor: childHex(child.id) } : undefined}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : childHex(child.id) }}
            />
            {child.name}
          </button>
        )
      })}
    </div>
  )
}
