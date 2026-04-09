'use client'

import { UnifiedCalendar } from '@/components/calendar/UnifiedCalendar'
import type { CalendarEvent } from '@/lib/calendar/types'

interface CalendarClientProps {
  events: CalendarEvent[]
}

export function CalendarClient({ events }: CalendarClientProps) {
  return <UnifiedCalendar events={events} defaultView="month" />
}
