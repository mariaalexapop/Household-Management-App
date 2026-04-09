'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import type { CalendarEvent } from '@/lib/calendar/types'
import { CalendarEventDot } from './CalendarEventDot'

interface DayEventsPopoverProps {
  events: CalendarEvent[]
  date: Date
  onClose: () => void
}

export function DayEventsPopover({ events, date, onClose }: DayEventsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-xl shadow-float ring-miro p-3 min-w-48"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-xs font-semibold text-kinship-on-surface">
          {format(date, 'MMM d')}
        </span>
        <button
          onClick={onClose}
          className="p-0.5 rounded-lg hover:bg-kinship-surface-container text-kinship-on-surface-variant"
          aria-label="Close"
        >
          <X size={12} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {events.map((event) => (
          <CalendarEventDot
            key={event.id}
            event={event}
            onClick={() => {
              window.location.href = event.href
            }}
          />
        ))}
      </div>
    </div>
  )
}
