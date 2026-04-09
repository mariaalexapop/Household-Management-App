'use client'

import { addWeeks, startOfWeek, addDays, format, isSameHour, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarEvent } from '@/lib/calendar/types'

interface CalendarWeekViewProps {
  events: CalendarEvent[]
  currentWeek: Date
  onWeekChange: (week: Date) => void
}

const START_HOUR = 7
const END_HOUR = 22
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

export function CalendarWeekView({ events, currentWeek, onWeekChange }: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function handlePrev() {
    onWeekChange(addWeeks(currentWeek, -1))
  }

  function handleNext() {
    onWeekChange(addWeeks(currentWeek, 1))
  }

  const today = new Date()

  return (
    <div className="w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrev}
          className="p-1 hover:bg-kinship-surface-container rounded-lg text-kinship-on-surface"
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-display font-semibold text-kinship-on-surface text-sm">
          {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
        </span>
        <button
          onClick={handleNext}
          className="p-1 hover:bg-kinship-surface-container rounded-lg text-kinship-on-surface"
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <div className="grid grid-cols-8 min-w-[600px]">
          {/* Header row */}
          <div className="col-span-1" />
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={day.toISOString()}
                className={`text-center font-body text-xs font-semibold py-2 border-b border-kinship-outline-variant ${
                  isToday
                    ? 'bg-kinship-primary-surface text-kinship-primary'
                    : 'text-kinship-on-surface-variant'
                }`}
              >
                {format(day, 'EEE d')}
              </div>
            )
          })}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <>
              {/* Time label */}
              <div
                key={`label-${hour}`}
                className="h-12 flex items-start justify-end pr-2 pt-1 font-body text-xs text-kinship-on-surface-variant"
              >
                {`${String(hour).padStart(2, '0')}:00`}
              </div>

              {/* Day cells for this hour */}
              {days.map((day) => {
                const cellEvents = events.filter(
                  (e) => isSameDay(e.startsAt, day) && isSameHour(e.startsAt, new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))
                )
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="h-12 border-b border-l border-kinship-outline-variant p-0.5 relative"
                  >
                    {cellEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => { window.location.href = event.href }}
                        className="rounded-md px-1 py-0.5 text-xs text-white cursor-pointer w-full text-left mb-0.5 flex items-center gap-1"
                        style={{ backgroundColor: event.colour }}
                        title={event.childName ? `${event.title} · ${event.childName}` : event.title}
                      >
                        <span className="truncate">{event.label ?? event.title.slice(0, 16)}</span>
                        {event.childName && (
                          <span className="rounded-full bg-white/30 px-1 text-[10px] font-semibold shrink-0">
                            {event.childName}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
