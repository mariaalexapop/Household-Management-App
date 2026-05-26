'use client'

import { ChevronDown } from 'lucide-react'
import type { AreaItem, FilterState } from '@/app/(app)/chores/ChoresClient'

interface TaskFiltersProps {
  areas: AreaItem[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function TaskFilters({ areas, filters, onFiltersChange }: TaskFiltersProps) {
  function setStatusFilter(status: string) {
    if (status === '') {
      onFiltersChange({ ...filters, statusFilter: [] })
    } else {
      onFiltersChange({ ...filters, statusFilter: [status] })
    }
  }

  function handleAreaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({ ...filters, areaFilter: e.target.value || null })
  }

  function toggleHideDone() {
    onFiltersChange({ ...filters, hideDone: !filters.hideDone })
  }

  const activeStatus = filters.statusFilter.length === 1 ? filters.statusFilter[0] : ''

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status pill buttons */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.map(({ value, label }) => {
          const isActive = value === activeStatus
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-full border px-3.5 py-1.5 font-body text-sm font-medium transition-colors min-h-[36px] ${
                isActive
                  ? 'bg-kinship-primary-surface text-kinship-primary border-kinship-primary'
                  : 'border-kinship-outline-variant text-kinship-on-surface-variant hover:border-kinship-on-surface/40 bg-white'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-kinship-outline-variant" aria-hidden="true" />

      {/* Area dropdown pill */}
      <div className="relative">
        <select
          value={filters.areaFilter ?? ''}
          onChange={handleAreaChange}
          className="h-9 appearance-none rounded-full border border-kinship-outline-variant bg-white pl-3.5 pr-8 font-body text-sm text-kinship-on-surface-variant focus:outline-none focus:ring-2 focus:ring-kinship-primary"
          aria-label="Filter by area"
        >
          <option value="">Area: All</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kinship-on-surface-variant" />
      </div>

      {/* Hide done toggle */}
      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-kinship-outline-variant bg-white px-3.5 py-1.5 font-body text-sm text-kinship-on-surface-variant transition-colors hover:border-kinship-on-surface/40">
        <input
          type="checkbox"
          checked={filters.hideDone}
          onChange={toggleHideDone}
          className="h-4 w-4 rounded border-kinship-outline accent-kinship-primary"
        />
        Hide done
      </label>
    </div>
  )
}
