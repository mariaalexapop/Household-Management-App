'use client'

import { useSearchParams } from 'next/navigation'
import { UnifiedCalendar } from '@/components/calendar/UnifiedCalendar'
import type { CalendarEvent } from '@/lib/calendar/types'
import type { FilterCategory } from '@/lib/calendar/types'
import { FILTER_ORDER } from '@/lib/calendar/types'

interface CalendarClientProps {
  events: CalendarEvent[]
}

export function CalendarClient({ events }: CalendarClientProps) {
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter') as FilterCategory | null
  const activeOnly = filterParam && FILTER_ORDER.includes(filterParam) ? filterParam : null

  return <UnifiedCalendar events={events} defaultView="month" activeOnly={activeOnly} />
}
