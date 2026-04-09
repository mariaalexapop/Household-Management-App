'use client'

import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityItem, ChildItem, MemberItem } from '@/app/(app)/kids/KidsClient'

const CATEGORY_COLOURS: Record<string, string> = {
  school:  'bg-blue-100 text-blue-700',
  medical: 'bg-red-100 text-red-700',
  sport:   'bg-orange-100 text-orange-700',
  hobby:   'bg-purple-100 text-purple-700',
  social:  'bg-green-100 text-green-700',
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
    <div className="flex items-center justify-between border-b border-kinship-surface-container py-3 last:border-0">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-body font-medium text-kinship-on-surface">{activity.title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-body capitalize ${
              CATEGORY_COLOURS[activity.category] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {activity.category}
          </span>
          {child && (
            <span className="font-body text-xs text-kinship-on-surface/60">{child.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3 font-body text-xs text-kinship-on-surface/60">
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
