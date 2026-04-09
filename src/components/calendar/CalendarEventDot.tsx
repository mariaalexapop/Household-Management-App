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
      title={event.childName ? `${event.title} · ${event.childName}` : event.title}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.colour }}
      />
      <span className="truncate text-kinship-on-surface font-body">
        {event.label ?? event.title.slice(0, 16)}
      </span>
      {event.childName && (
        <span
          className="rounded-full px-1 text-[9px] leading-[14px] font-semibold text-white shrink-0"
          style={{ backgroundColor: event.childColour ?? event.colour }}
        >
          {event.childName}
        </span>
      )}
    </button>
  )
}
