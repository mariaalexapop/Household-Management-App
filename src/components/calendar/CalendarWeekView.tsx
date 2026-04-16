'use client'

import { Fragment, useEffect, useCallback } from 'react'
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

  const handlePrev = useCallback(() => onWeekChange(addWeeks(currentWeek, -1)), [currentWeek, onWeekChange])
  const handleNext = useCallback(() => onWeekChange(addWeeks(currentWeek, 1)), [currentWeek, onWeekChange])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev() }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handlePrev, handleNext])

  const today = new Date()

  // Precompute all-day tint colour per day (first all-day event's colour)
  const dayTint = new Map<string, string>()
  for (const day of days) {
    const key = day.toISOString()
    const allDay = events.find(
      (e) => isSameDay(e.startsAt, day) && (e.startsAt.getHours() < START_HOUR || e.startsAt.getHours() >= END_HOUR)
    )
    if (allDay) dayTint.set(key, allDay.colour)
  }

  return (
    <div className="w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrev}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-kinship-surface-container active:bg-kinship-surface-container text-kinship-on-surface transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-display font-semibold text-kinship-on-surface text-sm">
          {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
        </span>
        <button
          onClick={handleNext}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-kinship-surface-container active:bg-kinship-surface-container text-kinship-on-surface transition-colors"
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

          {/* All-day row for events without a specific hour (midnight or outside grid) */}
          <div className="flex items-start justify-end pr-2 pt-1 font-body text-xs text-kinship-on-surface-variant min-h-[2rem] border-b border-kinship-outline-variant">
            All day
          </div>
          {days.map((day) => {
            const allDayEvents = events.filter(
              (e) => isSameDay(e.startsAt, day) && (e.startsAt.getHours() < START_HOUR || e.startsAt.getHours() >= END_HOUR)
            )
            const tint = dayTint.get(day.toISOString())
            return (
              <div
                key={`allday-${day.toISOString()}`}
                className="min-h-[2rem] border-b border-l border-kinship-outline-variant p-0.5"
                style={tint ? { backgroundColor: `${tint}18` } : undefined}
              >
                {allDayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => { window.location.href = event.href }}
                    className="rounded-md px-1 py-0.5 text-xs text-white cursor-pointer w-full text-left mb-0.5 flex items-center gap-1"
                    style={{ backgroundColor: event.colour }}
                    title={event.childName ? `${event.title} · ${event.childName}` : event.title}
                  >
                    <span className="truncate">{event.label ?? event.title.slice(0, 16)}</span>
                  </button>
                ))}
              </div>
            )
          })}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <Fragment key={`hour-${hour}`}>
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
                const tint = dayTint.get(day.toISOString())
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="h-12 border-b border-l border-kinship-outline-variant p-0.5 relative"
                    style={tint ? { backgroundColor: `${tint}10` } : undefined}
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
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
