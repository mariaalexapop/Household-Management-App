'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export interface ActivityFeedItem {
  id: string
  householdId: string
  actorId: string
  eventType: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface RealtimeContextValue {
  status: ConnectionStatus
  activityItems: ActivityFeedItem[]
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ConnectionContext = createContext<RealtimeContextValue>({
  status: 'connecting',
  activityItems: [],
})

/**
 * Hook to read realtime connection status and activity feed items from context.
 * Must be used inside a RealtimeProvider.
 */
export function useRealtime(): RealtimeContextValue {
  return useContext(ConnectionContext)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RealtimeProviderProps {
  householdId: string
  children: ReactNode
}

export function RealtimeProvider({ householdId, children }: RealtimeProviderProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [activityItems, setActivityItems] = useState<ActivityFeedItem[]>([])

  // Use a stable ref to avoid stale closure issues
  const householdIdRef = useRef(householdId)
  householdIdRef.current = householdId

  const prependActivity = useCallback((item: ActivityFeedItem) => {
    setActivityItems((prev) => [item, ...prev])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channelName = `household:${householdId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          // Trigger Server Component re-render when membership changes
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const newItem = payload.new as ActivityFeedItem
          prependActivity(newItem)
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (subscribeStatus === 'CHANNEL_ERROR') {
          setStatus('disconnected')
        } else if (subscribeStatus === 'TIMED_OUT') {
          setStatus('disconnected')
        }
      })

    // Monitor for silent disconnects via heartbeat
    // @ts-expect-error — onHeartbeat is available at runtime but not always typed
    if (typeof channel.onHeartbeat === 'function') {
      // @ts-expect-error — see above
      channel.onHeartbeat((heartbeatStatus: string) => {
        if (heartbeatStatus === 'timeout' || heartbeatStatus === 'disconnected') {
          setStatus('disconnected')
        } else if (heartbeatStatus === 'ok') {
          setStatus('connected')
        }
      })
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, router, prependActivity])

  return (
    <ConnectionContext.Provider value={{ status, activityItems }}>
      {children}
    </ConnectionContext.Provider>
  )
}
