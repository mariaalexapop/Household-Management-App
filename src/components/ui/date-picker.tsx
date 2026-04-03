'use client'

import { useState, useRef, useEffect } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import 'react-day-picker/style.css'

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

  // Close on outside click
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

      {open && (
        <div className="absolute left-0 top-full z-[300] mt-1 rounded-xl border border-border bg-background p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? new Date()}
            classNames={{
              root: '',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex items-center justify-between px-1 py-1',
              caption_label: 'font-display text-sm font-semibold text-kinship-on-surface',
              nav: 'flex items-center gap-1',
              button_previous: 'h-7 w-7 rounded-md border border-border bg-transparent hover:bg-kinship-surface-container flex items-center justify-center text-kinship-on-surface',
              button_next: 'h-7 w-7 rounded-md border border-border bg-transparent hover:bg-kinship-surface-container flex items-center justify-center text-kinship-on-surface',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'flex-1 text-center font-body text-xs text-muted-foreground py-1',
              week: 'flex mt-1',
              day: 'flex-1 text-center',
              day_button: 'mx-auto h-8 w-8 rounded-md font-body text-sm text-kinship-on-surface hover:bg-kinship-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center',
              selected: '[&>button]:bg-kinship-primary [&>button]:text-white [&>button]:hover:bg-kinship-primary/90',
              today: '[&>button]:font-bold [&>button]:border [&>button]:border-kinship-primary',
              outside: '[&>button]:text-muted-foreground [&>button]:opacity-50',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
            }}
          />
        </div>
      )}
    </div>
  )
}
