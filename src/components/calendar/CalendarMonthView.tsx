'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { isSameDay } from 'date-fns'
import type { DayProps } from 'react-day-picker'
import type { CalendarEvent } from '@/lib/calendar/types'
import { CalendarEventDot } from './CalendarEventDot'
import { DayEventsPopover } from './DayEventsPopover'

interface CalendarMonthViewProps {
  events: CalendarEvent[]
  currentMonth: Date
  onMonthChange: (month: Date) => void
}

interface EventCellProps {
  dayProps: DayProps
  events: CalendarEvent[]
  popoverDate: Date | null
  onOpenPopover: (date: Date) => void
  onClosePopover: () => void
}

function EventCell({ dayProps, events, popoverDate, onOpenPopover, onClosePopover }: EventCellProps) {
  const { day, modifiers, ...restProps } = dayProps
  const date = day.date
  const dayEvents = events.filter((e) => isSameDay(e.startsAt, date))
  const visibleEvents = dayEvents.slice(0, 2)
  const extraCount = dayEvents.length - 2
  const isPopoverOpen = popoverDate !== null && isSameDay(popoverDate, date)

  return (
    <td
      {...restProps}
      className={`align-top border border-kinship-outline-variant p-1 relative ${
        modifiers.outside ? 'opacity-40' : ''
      }`}
    >
      <span
        className={`w-7 h-7 rounded-full text-sm font-body flex items-center justify-center mx-auto mb-0.5 ${
          modifiers.today ? 'bg-kinship-primary-surface text-kinship-primary font-semibold' : 'text-kinship-on-surface'
        } ${modifiers.selected ? 'bg-kinship-primary text-white' : ''}`}
      >
        {date.getDate()}
      </span>
      {dayEvents.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {visibleEvents.map((event) => (
            <CalendarEventDot
              key={event.id}
              event={event}
              onClick={() => {
                window.location.href = event.href
              }}
            />
          ))}
          {extraCount > 0 && (
            <button
              className="text-left text-xs text-kinship-primary hover:underline px-1"
              onClick={(e) => {
                e.stopPropagation()
                onOpenPopover(date)
              }}
            >
              +{extraCount} more
            </button>
          )}
        </div>
      )}
      {isPopoverOpen && (
        <DayEventsPopover
          events={dayEvents}
          date={date}
          onClose={onClosePopover}
        />
      )}
    </td>
  )
}

export function CalendarMonthView({ events, currentMonth, onMonthChange }: CalendarMonthViewProps) {
  const [popoverDate, setPopoverDate] = useState<Date | null>(null)

  return (
    <div className="w-full overflow-auto">
      <DayPicker
        month={currentMonth}
        onMonthChange={onMonthChange}
        showOutsideDays
        classNames={{
          root: 'w-full',
          months: 'w-full',
          month: 'w-full',
          month_grid: 'w-full border-collapse',
          weekdays: '',
          weekday: 'text-center font-body text-xs text-kinship-on-surface-variant py-2',
          weeks: '',
          week: '',
          nav: 'flex justify-between mb-3 items-center',
          button_previous: 'p-1 hover:bg-kinship-surface-container rounded-lg font-body text-kinship-on-surface',
          button_next: 'p-1 hover:bg-kinship-surface-container rounded-lg font-body text-kinship-on-surface',
          month_caption: 'flex justify-center mb-2',
          caption_label: 'font-display font-semibold text-kinship-on-surface',
        }}
        components={{
          Day: (props: DayProps) => (
            <EventCell
              dayProps={props}
              events={events}
              popoverDate={popoverDate}
              onOpenPopover={setPopoverDate}
              onClosePopover={() => setPopoverDate(null)}
            />
          ),
        }}
      />
    </div>
  )
}
