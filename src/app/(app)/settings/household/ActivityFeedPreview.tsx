'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useRealtime, type ActivityFeedItem } from '@/components/realtime/RealtimeProvider'
import { mergeActivityItems } from '@/components/household/ActivityFeed'

const PREVIEW_LIMIT = 5

function getEventText(item: ActivityFeedItem): string {
  const meta = item.metadata as Record<string, string> | null | undefined
  const actorName = meta?.actorName ?? 'Someone'

  switch (item.eventType) {
    case 'household_created':
      return `${actorName} created the household`
    case 'member_joined':
      return `${actorName} joined the household`
    case 'member_removed': {
      const removedName = meta?.removedMemberName ?? 'a member'
      return `${actorName} removed ${removedName}`
    }
    case 'modules_updated': {
      const added = (meta?.addedModules as unknown as string[] | undefined) ?? []
      const removed = (meta?.removedModules as unknown as string[] | undefined) ?? []
      if (added.length > 0 && removed.length > 0) {
        return `${actorName} updated household modules`
      } else if (added.length > 0) {
        return `${actorName} added module${added.length > 1 ? 's' : ''}: ${added.join(', ')}`
      } else if (removed.length > 0) {
        return `${actorName} removed module${removed.length > 1 ? 's' : ''}: ${removed.join(', ')}`
      }
      return `${actorName} updated household modules`
    }
    case 'profile_updated':
      return `${actorName} updated their profile`
    case 'invite_sent': {
      const invitedEmail = meta?.invitedEmail ?? 'someone'
      return `${actorName} invited ${invitedEmail}`
    }
    default:
      return `${actorName} performed an action`
  }
}

interface ActivityFeedPreviewProps {
  initialItems: ActivityFeedItem[]
}

export function ActivityFeedPreview({ initialItems }: ActivityFeedPreviewProps) {
  const { activityItems: realtimeItems } = useRealtime()
  const allItems = mergeActivityItems(realtimeItems, initialItems)
  const hasMore = allItems.length > PREVIEW_LIMIT
  const previewItems = allItems.slice(0, PREVIEW_LIMIT)

  if (previewItems.length === 0) {
    return (
      <p className="text-sm text-kinship-on-surface-variant">No activity yet.</p>
    )
  }

  return (
    <div>
      <ul className="space-y-3">
        {previewItems.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-kinship-primary/40" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-kinship-on-surface">{getEventText(item)}</p>
              <p className="text-xs text-kinship-on-surface-variant" suppressHydrationWarning>
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {hasMore && (
        <Link
          href="/settings/household/activity"
          className="mt-4 inline-block font-body text-sm text-kinship-primary hover:underline"
        >
          View all activity
        </Link>
      )}
    </div>
  )
}
