'use client'

import { useState, useMemo } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { CalendarEvent, FilterCategory } from '@/lib/calendar/types'
import { FILTER_COLOURS, FILTER_LABELS, FILTER_ORDER } from '@/lib/calendar/types'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarWeekView } from './CalendarWeekView'

interface UnifiedCalendarProps {
  events: CalendarEvent[]
  defaultView?: 'month' | 'week'
  activeOnly?: FilterCategory | null
}

export function UnifiedCalendar({ events, defaultView = 'month', activeOnly = null }: UnifiedCalendarProps) {
  const [view, setView] = useState<'month' | 'week'>(defaultView)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())

  // Determine which filter categories are present in the data
  const availableFilters = useMemo(() => {
    const set = new Set<FilterCategory>()
    for (const e of events) set.add(e.filterCategory)
    return FILTER_ORDER.filter((f) => set.has(f))
  }, [events])

  const [hiddenFilters, setHiddenFilters] = useState<Set<FilterCategory>>(() => {
    if (!activeOnly) return new Set()
    return new Set(FILTER_ORDER.filter((f) => f !== activeOnly))
  })

  function toggleFilter(cat: FilterCategory) {
    setHiddenFilters((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const filteredEvents = useMemo(
    () => events.filter((e) => !hiddenFilters.has(e.filterCategory)),
    [events, hiddenFilters]
  )

  return (
    <div className="w-full">
      {/* Top bar: filters + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Module filter chips */}
        <div className="flex flex-wrap gap-2">
          {availableFilters.map((cat) => {
            const active = !hiddenFilters.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleFilter(cat)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-medium transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-kinship-surface-container text-kinship-on-surface-variant opacity-60'
                }`}
                style={active ? { backgroundColor: FILTER_COLOURS[cat] } : undefined}
              >
                <span
                  className={`w-2 h-2 rounded-full ${active ? 'bg-white/80' : ''}`}
                  style={!active ? { backgroundColor: FILTER_COLOURS[cat] } : undefined}
                />
                {FILTER_LABELS[cat]}
              </button>
            )
          })}
        </div>

        {/* View toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setView('month')}
            className={`p-2 rounded-lg text-sm font-body transition-colors ${
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
            className={`p-2 rounded-lg text-sm font-body transition-colors ${
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
      </div>

      <div className="bg-white rounded-2xl ring-miro p-4">
        {view === 'month' ? (
          <CalendarMonthView
            events={filteredEvents}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        ) : (
          <CalendarWeekView
            events={filteredEvents}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
          />
        )}
      </div>
    </div>
  )
}
