'use client'

import type { ChildItem } from '@/app/(app)/kids/KidsClient'
import { childHex } from '@/lib/kids/child-colours'

interface ChildTabsProps {
  children: ChildItem[]
  selectedChildId: string | null
  onSelect: (id: string | null) => void
}

export function ChildTabs({ children, selectedChildId, onSelect }: ChildTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-1.5 text-sm font-body transition-colors ${
          selectedChildId === null
            ? 'bg-module-kids-light text-module-kids-dark font-semibold'
            : 'bg-kinship-surface-container text-kinship-on-surface hover:bg-kinship-surface-container/80'
        }`}
      >
        All
      </button>
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-body transition-colors flex items-center gap-2 ${
            selectedChildId === child.id
              ? 'bg-kinship-surface-container-low text-kinship-on-surface font-semibold'
              : 'bg-kinship-surface-container text-kinship-on-surface hover:bg-kinship-surface-container/80'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: childHex(child.id) }}
          />
          {child.name}
        </button>
      ))}
    </div>
  )
}
