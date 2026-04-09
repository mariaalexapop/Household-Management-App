'use client'

import type { ChildItem } from '@/app/(app)/kids/KidsClient'

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
            ? 'bg-kinship-primary text-white'
            : 'bg-kinship-surface-container text-kinship-on-surface hover:bg-kinship-surface-container/80'
        }`}
      >
        All
      </button>
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-body transition-colors ${
            selectedChildId === child.id
              ? 'bg-kinship-primary text-white'
              : 'bg-kinship-surface-container text-kinship-on-surface hover:bg-kinship-surface-container/80'
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  )
}
