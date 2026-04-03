'use client'

import { useState, useRef, useEffect } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string // yyyy-MM-dd
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSelect(date: Date | undefined) {
    onChange(date ? format(date, 'yyyy-MM-dd') : '')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? format(selected, 'd MMM yyyy') : (placeholder ?? 'Pick a date')}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-[300] mt-1 w-[280px] rounded-xl border border-border p-3 shadow-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? new Date()}
            components={{
              PreviousMonthButton: (props) => (
                <button {...props} className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-kinship-surface-container text-kinship-on-surface">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ),
              NextMonthButton: (props) => (
                <button {...props} className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-kinship-surface-container text-kinship-on-surface">
                  <ChevronRight className="h-4 w-4" />
                </button>
              ),
            }}
            classNames={{
              root: 'w-full',
              months: 'w-full',
              month: 'w-full space-y-2',
              month_caption: 'relative flex items-center justify-center py-1',
              caption_label: 'font-display text-sm font-semibold text-kinship-on-surface',
              nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'flex-1 text-center font-body text-xs text-muted-foreground py-1',
              weeks: 'mt-1',
              week: 'flex',
              day: 'flex-1 flex items-center justify-center p-0',
              day_button: [
                'h-8 w-8 rounded-md font-body text-sm text-kinship-on-surface',
                'flex items-center justify-center',
                'hover:bg-kinship-surface-container',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ].join(' '),
              selected: '[&>button]:bg-[#0053dc] [&>button]:text-white [&>button]:hover:bg-[#0044bb]',
              today: '[&>button]:font-bold [&>button]:border [&>button]:border-[#0053dc]',
              outside: '[&>button]:text-muted-foreground [&>button]:opacity-40',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
              hidden: 'invisible',
            }}
          />
        </div>
      )}
    </div>
  )
}
