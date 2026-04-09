'use client'

interface ReminderConfigProps {
  label: string
  value: number
  onChange: (days: number) => void
}

const REMINDER_OPTIONS = [
  { value: 7, label: '7 days before' },
  { value: 14, label: '14 days before' },
  { value: 30, label: '30 days before' },
  { value: 60, label: '60 days before' },
  { value: 90, label: '90 days before' },
]

export function ReminderConfig({ label, value, onChange }: ReminderConfigProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-sm font-medium text-kinship-on-surface">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-kinship-outline-variant bg-kinship-surface-container-lowest px-3 py-2 font-body text-sm text-kinship-on-surface outline-none transition-colors focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
      >
        {REMINDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
