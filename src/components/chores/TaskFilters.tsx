'use client'

import type { AreaItem, FilterState } from '@/app/(app)/chores/ChoresClient'

interface TaskFiltersProps {
  areas: AreaItem[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export function TaskFilters({ areas, filters, onFiltersChange }: TaskFiltersProps) {
  function toggleStatus(status: string) {
    const current = filters.statusFilter
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    onFiltersChange({ ...filters, statusFilter: next })
  }

  function handleAreaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({ ...filters, areaFilter: e.target.value || null })
  }

  function toggleSort() {
    onFiltersChange({ ...filters, sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })
  }

  function toggleHideDone() {
    onFiltersChange({ ...filters, hideDone: !filters.hideDone })
  }

  const isStatusActive = (status: string) => filters.statusFilter.includes(status)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status multi-select buttons */}
      <div className="flex items-center gap-1">
        <span className="font-body text-sm text-kinship-on-surface/60 mr-1">Status:</span>
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleStatus(value)}
            className={`rounded-md border px-3 py-1 font-body text-sm transition-colors min-h-[36px] ${
              isStatusActive(value)
                ? 'border-[#0053dc] text-[#0053dc] bg-[#0053dc]/8'
                : 'border-border text-kinship-on-surface/70 hover:border-kinship-on-surface/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Area dropdown */}
      <select
        value={filters.areaFilter ?? ''}
        onChange={handleAreaChange}
        className="h-9 rounded-md border border-border bg-white px-3 font-body text-sm text-kinship-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by area"
      >
        <option value="">All areas</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>

      {/* Sort direction toggle */}
      <button
        type="button"
        onClick={toggleSort}
        className="rounded-md border border-border px-3 py-1 font-body text-sm text-kinship-on-surface/70 hover:border-kinship-on-surface/40 min-h-[36px]"
        aria-label="Toggle sort direction"
      >
        {filters.sortDir === 'asc' ? '↑ Date' : '↓ Date'}
      </button>

      {/* Hide done toggle */}
      <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-kinship-on-surface/70">
        <input
          type="checkbox"
          checked={filters.hideDone}
          onChange={toggleHideDone}
          className="h-4 w-4 rounded border-border"
        />
        Hide done
      </label>
    </div>
  )
}
