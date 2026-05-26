'use client'

import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ActivityItem, ChildItem, MemberItem } from '@/app/(app)/kids/KidsClient'
import { childHex } from '@/lib/kids/child-colours'

const CATEGORY_COLOURS: Record<string, string> = {
  school:  'bg-category-school-light text-category-school-dark',
  medical: 'bg-category-medical-light text-category-medical-dark',
  sport:   'bg-category-sport-light text-category-sport-dark',
  hobby:   'bg-category-hobby-light text-category-hobby-dark',
  social:  'bg-kinship-surface-container text-kinship-on-surface',
}

const CATEGORY_DOT_COLOURS: Record<string, string> = {
  school:  'bg-category-school-dark',
  medical: 'bg-category-medical-dark',
  sport:   'bg-category-sport-dark',
  hobby:   'bg-[#b34a9c]',
  social:  'bg-[#1f5c1f]',
}

interface ActivityRowProps {
  activity: ActivityItem
  child: ChildItem | undefined
  assignee: MemberItem | undefined
  onEdit: () => void
  onDelete: () => void
}

export function ActivityRow({ activity, child, assignee, onEdit, onDelete }: ActivityRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl ring-miro px-3.5 py-3 flex items-center gap-3">
      {/* Category-colored dot */}
      <span
        className={`h-3.5 w-3.5 shrink-0 rounded-full ${
          CATEGORY_DOT_COLOURS[activity.category] ?? 'bg-kinship-on-surface-variant'
        }`}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-sm font-semibold text-kinship-on-surface">{activity.title}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-body font-medium capitalize ${
              CATEGORY_COLOURS[activity.category] ?? 'bg-kinship-surface-container text-kinship-on-surface'
            }`}
          >
            {activity.category}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-body text-xs text-kinship-on-surface-variant">
          {activity.startsAt && (
            <span>{format(activity.startsAt, 'MMM d, yyyy \u00b7 h:mm a')}</span>
          )}
          {activity.location && (
            <span>{activity.location}</span>
          )}
        </div>
      </div>

      {/* Right side: child badge + assignee + more menu */}
      <div className="flex shrink-0 items-center gap-2">
        {child && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-body font-semibold text-white"
            style={{ backgroundColor: childHex(child.id) }}
          >
            {child.name}
          </span>
        )}
        {assignee && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kinship-surface-container font-body text-[10px] font-semibold text-kinship-on-surface" title={assignee.displayName ?? ''}>
            {(assignee.displayName ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </span>
        )}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] p-0"
            aria-label="Activity actions"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-xl bg-white py-1 ring-miro shadow-float">
                <button type="button" className="w-full px-4 py-2 text-left font-body text-sm text-kinship-on-surface hover:bg-kinship-surface" onClick={() => { setMenuOpen(false); onEdit() }}>
                  Edit
                </button>
                <button type="button" className="w-full px-4 py-2 text-left font-body text-sm text-destructive hover:bg-kinship-surface" onClick={() => { setMenuOpen(false); onDelete() }}>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
