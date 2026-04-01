'use client'

import { formatDistanceToNow } from 'date-fns'
import { useRealtime, type ActivityFeedItem } from '@/components/realtime/RealtimeProvider'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export const MAX_ITEMS = 20

// ---------------------------------------------------------------------------
// Exported pure utility — used in component and testable without React
// ---------------------------------------------------------------------------

/**
 * Merges realtime and initial items.
 * Deduplicates by id (realtime items take priority).
 * Sorts by created_at descending, returns max MAX_ITEMS.
 */
export function mergeActivityItems(
  realtimeItems: ActivityFeedItem[],
  initialItems: ActivityFeedItem[]
): ActivityFeedItem[] {
  const seen = new Set<string>()
  const combined = [...realtimeItems, ...initialItems]
  const unique = combined.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return unique.slice(0, MAX_ITEMS)
}

// ---------------------------------------------------------------------------
// ActivityFeed
// ---------------------------------------------------------------------------

interface ActivityFeedProps {
  /** Server-fetched initial items (sorted by created_at desc). */
  initialItems: ActivityFeedItem[]
}

export function ActivityFeed({ initialItems }: ActivityFeedProps) {
  const { activityItems: realtimeItems } = useRealtime()
  const mergedItems = mergeActivityItems(realtimeItems, initialItems)

  if (mergedItems.length === 0) {
    return (
      <p className="text-sm text-kinship-on-surface/50">No activity yet.</p>
    )
  }

  return (
    <ul className="space-y-3">
      {mergedItems.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-kinship-primary/40" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-kinship-on-surface">{getEventText(item)}</p>
            <p className="text-xs text-kinship-on-surface/50">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
