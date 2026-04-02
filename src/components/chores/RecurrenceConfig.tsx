'use client'

import type { RecurrenceRule } from '@/lib/chores/recurrence'

interface RecurrenceConfigProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

/**
 * RecurrenceConfig — sub-form for configuring recurring task frequency.
 *
 * Renders:
 * - Frequency select (Daily/Weekly/Monthly/Yearly)
 * - Interval number input (e.g. "every N days/weeks/months/years")
 * - "On" field:
 *   - Weekly: day-of-week select (Mon–Sun)
 *   - Monthly/Yearly: day-of-month number input (1–31)
 *   - Daily: hidden
 */
export function RecurrenceConfig({ value, onChange }: RecurrenceConfigProps) {
  const frequency = value?.frequency ?? 'daily'
  const interval = value?.interval ?? 1

  function handleFrequencyChange(newFrequency: RecurrenceRule['frequency']) {
    onChange({
      frequency: newFrequency,
      interval,
      on_day_of_week: newFrequency === 'weekly' ? (value?.on_day_of_week ?? null) : null,
      on_day_of_month:
        newFrequency === 'monthly' || newFrequency === 'yearly'
          ? (value?.on_day_of_month ?? null)
          : null,
    })
  }

  function handleIntervalChange(newInterval: number) {
    if (!value) return
    onChange({ ...value, interval: newInterval })
  }

  function handleDayOfWeekChange(day: number) {
    if (!value) return
    onChange({ ...value, on_day_of_week: day })
  }

  function handleDayOfMonthChange(day: number) {
    if (!value) return
    onChange({ ...value, on_day_of_month: day })
  }

  if (!value) return null

  return (
    <div className="flex flex-col gap-3">
      {/* Frequency */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-[var(--text-secondary)] w-16 shrink-0">
          Repeat
        </label>
        <select
          value={frequency}
          onChange={(e) => handleFrequencyChange(e.target.value as RecurrenceRule['frequency'])}
          className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interval */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-[var(--text-secondary)] w-16 shrink-0">
          Every
        </label>
        <input
          type="number"
          min={1}
          max={99}
          value={interval}
          onChange={(e) => handleIntervalChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <span className="text-sm text-[var(--text-secondary)]">
          {frequency === 'daily'
            ? interval === 1
              ? 'day'
              : 'days'
            : frequency === 'weekly'
              ? interval === 1
                ? 'week'
                : 'weeks'
              : frequency === 'monthly'
                ? interval === 1
                  ? 'month'
                  : 'months'
                : interval === 1
                  ? 'year'
                  : 'years'}
        </span>
      </div>

      {/* On — day of week (weekly only) */}
      {frequency === 'weekly' && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] w-16 shrink-0">
            On
          </label>
          <select
            value={value.on_day_of_week ?? ''}
            onChange={(e) => handleDayOfWeekChange(parseInt(e.target.value, 10))}
            className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">Any day</option>
            {DAY_OF_WEEK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* On — day of month (monthly/yearly only) */}
      {(frequency === 'monthly' || frequency === 'yearly') && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] w-16 shrink-0">
            On day
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={value.on_day_of_month ?? ''}
            placeholder="e.g. 15"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val >= 1 && val <= 31) {
                handleDayOfMonthChange(val)
              } else if (e.target.value === '') {
                onChange({ ...value, on_day_of_month: null })
              }
            }}
            className="w-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">of the month</span>
        </div>
      )}
    </div>
  )
}
