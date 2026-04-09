'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { CalendarEvent } from '@/lib/calendar/types'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarWeekView } from './CalendarWeekView'

interface UnifiedCalendarProps {
  events: CalendarEvent[]
  defaultView?: 'month' | 'week'
}

export function UnifiedCalendar({ events, defaultView = 'month' }: UnifiedCalendarProps) {
  const [view, setView] = useState<'month' | 'week'>(defaultView)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())

  return (
    <div className="w-full">
      {/* View toggle */}
      <div className="flex justify-end mb-4 gap-1">
        <button
          onClick={() => setView('month')}
          className={`p-2 rounded text-sm font-body transition-colors ${
            view === 'month'
              ? 'bg-kinship-primary text-white'
              : 'hover:bg-kinship-surface-container text-kinship-on-surface'
          }`}
          aria-label="Month view"
          title="Month view"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => setView('week')}
          className={`p-2 rounded text-sm font-body transition-colors ${
            view === 'week'
              ? 'bg-kinship-primary text-white'
              : 'hover:bg-kinship-surface-container text-kinship-on-surface'
          }`}
          aria-label="Week view"
          title="Week view"
        >
          <List size={16} />
        </button>
      </div>

      {view === 'month' ? (
        <CalendarMonthView
          events={events}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      ) : (
        <CalendarWeekView
          events={events}
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
        />
      )}
    </div>
  )
}
