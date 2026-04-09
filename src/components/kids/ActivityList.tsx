'use client'

import { useState } from 'react'
import { ChildTabs } from './ChildTabs'
import { ActivityRow } from './ActivityRow'
import type { ActivityItem, ChildItem, MemberItem } from '@/app/(app)/kids/KidsClient'

interface ActivityListProps {
  activities: ActivityItem[]
  childList: ChildItem[]
  members: MemberItem[]
  onEdit: (a: ActivityItem) => void
  onDelete: (a: ActivityItem) => void
}

export function ActivityList({ activities, childList, members, onEdit, onDelete }: ActivityListProps) {
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set())

  const filtered = selectedChildIds.size > 0
    ? activities.filter((a) => selectedChildIds.has(a.childId))
    : activities

  const childMap = new Map(childList.map((c) => [c.id, c]))
  const memberMap = new Map(members.map((m) => [m.id, m]))

  return (
    <div>
      <ChildTabs
        children={childList}
        selectedChildIds={selectedChildIds}
        onToggle={(id) => {
          setSelectedChildIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        }}
        onSelectAll={() => setSelectedChildIds(new Set())}
      />
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center font-body text-kinship-on-surface-variant">
            No activities yet. Add one to get started.
          </p>
        ) : (
          filtered.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              child={childMap.get(activity.childId)}
              assignee={activity.assigneeId ? memberMap.get(activity.assigneeId) : undefined}
              onEdit={() => onEdit(activity)}
              onDelete={() => onDelete(activity)}
            />
          ))
        )}
      </div>
    </div>
  )
}
