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
}

export function WeekStrip({ events }: WeekStripProps) {
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
      <div className="px-3.5 py-2.5">
        <h2 className="font-display text-[13px] font-semibold text-kinship-on-surface">This week</h2>
      </div>
      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const current = isToday(day)
          const modules = eventsByDate.get(dateStr)

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1">
              <span className="font-body text-[10px] uppercase tracking-wide text-kinship-on-surface-variant">
                {format(day, 'EEE')}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-body text-sm font-semibold ${
                  current
                    ? 'bg-kinship-primary text-white'
                    : 'text-kinship-on-surface'
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
