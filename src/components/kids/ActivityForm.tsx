'use client'
// Stub — full implementation in Plan 03-06
// Satisfies KidsClient.tsx import to unblock the build.

import type { ActivityItem, ChildItem, MemberItem } from '@/app/(app)/kids/KidsClient'

interface ActivityFormProps {
  mode: 'create' | 'edit'
  activity?: ActivityItem
  childList: ChildItem[]
  members: MemberItem[]
  currentUserId: string
  onSuccess: () => void
  onCancel: () => void
  onCreateChild: (name: string) => Promise<ChildItem>
}

export function ActivityForm({ onCancel }: ActivityFormProps) {
  return (
    <div className="p-4">
      <p className="font-body text-kinship-on-surface/60 text-sm">
        Activity form — implemented in Plan 06.
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 font-body text-sm text-kinship-primary hover:underline"
      >
        Cancel
      </button>
    </div>
  )
}
