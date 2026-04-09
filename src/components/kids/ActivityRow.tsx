'use client'

import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityItem, ChildItem, MemberItem } from '@/app/(app)/kids/KidsClient'

const CATEGORY_COLOURS: Record<string, string> = {
  school:  'bg-category-school-light text-category-school-dark',
  medical: 'bg-category-medical-light text-category-medical-dark',
  sport:   'bg-category-sport-light text-category-sport-dark',
  hobby:   'bg-category-hobby-light text-category-hobby-dark',
  social:  'bg-kinship-surface-container text-kinship-on-surface',
}

interface ActivityRowProps {
  activity: ActivityItem
  child: ChildItem | undefined
  assignee: MemberItem | undefined
  onEdit: () => void
  onDelete: () => void
}

export function ActivityRow({ activity, child, assignee, onEdit, onDelete }: ActivityRowProps) {
  return (
    <div className="bg-white rounded-xl ring-miro p-4 flex items-center justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-base font-semibold text-kinship-on-surface">{activity.title}</span>
          <span
            className={`rounded-md px-2 py-1 text-sm font-body capitalize ${
              CATEGORY_COLOURS[activity.category] ?? 'bg-kinship-surface-container text-kinship-on-surface'
            }`}
          >
            {activity.category}
          </span>
          {child && (
            <span className="font-body text-xs text-kinship-on-surface-variant">{child.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3 font-body text-xs text-kinship-on-surface-variant">
          {activity.startsAt && (
            <span>{format(activity.startsAt, 'MMM d, yyyy \u00b7 h:mm a')}</span>
          )}
          <span>{assignee?.displayName ?? 'Unassigned'}</span>
        </div>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit activity">
          <Pencil size={14} />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete activity">
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  )
}
