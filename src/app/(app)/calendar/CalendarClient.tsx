'use client'
import type { CalendarEvent } from '@/lib/calendar/types'

interface CalendarClientProps {
  events: CalendarEvent[]
}

export function CalendarClient({ events }: CalendarClientProps) {
  // Full implementation in Plan 06 (03-06-PLAN.md)
  return (
    <div className="rounded-lg bg-kinship-surface-container-lowest p-6">
      <p className="font-body text-kinship-on-surface/60">
        Calendar rendering — implemented in Plan 06.
        {events.length > 0 && ` (${events.length} events loaded)`}
      </p>
    </div>
  )
}
