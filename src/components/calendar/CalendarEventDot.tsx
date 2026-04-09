'use client'

import type { CalendarEvent } from '@/lib/calendar/types'

interface CalendarEventDotProps {
  event: CalendarEvent
  onClick: () => void
}

export function CalendarEventDot({ event, onClick }: CalendarEventDotProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs hover:opacity-80 cursor-pointer w-full text-left truncate"
      title={event.title}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.colour }}
      />
      <span className="truncate text-kinship-on-surface font-body">
        {event.label ?? event.title.slice(0, 16)}
      </span>
    </button>
  )
}
