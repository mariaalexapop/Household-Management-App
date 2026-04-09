'use client'

import type { ChildItem } from '@/app/(app)/kids/KidsClient'

const CHILD_COLOURS = [
  { active: 'bg-module-kids-light text-module-kids-dark', idle: 'bg-module-kids-light/30 text-module-kids-dark' },
  { active: 'bg-category-school-light text-category-school-dark', idle: 'bg-category-school-light/30 text-category-school-dark' },
  { active: 'bg-category-sport-light text-category-sport-dark', idle: 'bg-category-sport-light/30 text-category-sport-dark' },
  { active: 'bg-category-hobby-light text-category-hobby-dark', idle: 'bg-category-hobby-light/30 text-category-hobby-dark' },
  { active: 'bg-[#fffacd] text-[#746019]', idle: 'bg-[#fffacd]/30 text-[#746019]' },
  { active: 'bg-kinship-primary-surface text-kinship-primary', idle: 'bg-kinship-primary-surface/30 text-kinship-primary' },
]

function childColourIndex(childId: string): number {
  let hash = 0
  for (let i = 0; i < childId.length; i++) {
    hash = (hash * 31 + childId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % CHILD_COLOURS.length
}

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
      {children.map((child) => {
        const colours = CHILD_COLOURS[childColourIndex(child.id)]
        return (
          <button
            key={child.id}
            onClick={() => onSelect(child.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-body transition-colors ${
              selectedChildId === child.id
                ? `${colours.active} font-semibold`
                : `${colours.idle} hover:opacity-80`
            }`}
          >
            {child.name}
          </button>
        )
      })}
    </div>
  )
}
