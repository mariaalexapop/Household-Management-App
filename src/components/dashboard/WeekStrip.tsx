'use client'

import { startOfWeek, addDays, format, isToday } from 'date-fns'
import type { ModuleKey } from '@/stores/onboarding'

/* Dot colours per module */
const DOT_COLOURS: Record<ModuleKey, string> = {
  chores: '#187574',
  kids: '#e05252',
  car: '#c67d2a',
  insurance: '#6a55d9',
  electronics: '#3f9b3f',
}

export interface WeekEvent {
  date: string        // ISO date string (YYYY-MM-DD)
  module: ModuleKey
}

interface WeekStripProps {
  events: WeekEvent[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}

export function WeekStrip({ events, selectedDate, onSelectDate }: WeekStripProps) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  /* Group events by date string */
  const eventsByDate = new Map<string, Set<ModuleKey>>()
  for (const e of events) {
    const key = e.date.slice(0, 10)
    if (!eventsByDate.has(key)) eventsByDate.set(key, new Set())
    eventsByDate.get(key)!.add(e.module)
  }

  return (
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-semibold text-kinship-on-surface">This week</h2>
        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="rounded-full bg-kinship-primary-surface px-2.5 py-0.5 font-body text-[11px] font-medium text-kinship-primary hover:bg-kinship-primary/20 transition-colors"
          >
            Show all week
          </button>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const current = isToday(day)
          const isSelected = selectedDate === dateStr
          const modules = eventsByDate.get(dateStr)
          const hasEvents = !!modules && modules.size > 0

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className="flex flex-col items-center gap-1 rounded-lg py-1 transition-colors hover:bg-kinship-surface-container"
            >
              <span className="font-body text-[10px] uppercase tracking-wide text-kinship-on-surface-variant">
                {format(day, 'EEE')}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-body text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'bg-kinship-on-surface text-white'
                    : current
                      ? 'bg-kinship-primary text-white'
                      : hasEvents
                        ? 'text-kinship-on-surface'
                        : 'text-kinship-on-surface-variant'
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="flex items-center gap-0.5 h-2">
                {modules
                  ? Array.from(modules).slice(0, 3).map((mod) => (
                      <span
                        key={mod}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: DOT_COLOURS[mod] }}
                      />
                    ))
                  : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
