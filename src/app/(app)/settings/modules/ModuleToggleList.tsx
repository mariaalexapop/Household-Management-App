'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateModules } from '@/app/actions/settings'

interface ModuleToggleListProps {
  initialActiveModules: string[]
  moduleLabels: Record<string, string>
}

const ALL_MODULES = ['chores', 'car', 'insurance', 'electronics', 'kids'] as const

/**
 * Client component: renders 5 module toggle switches.
 * Calls the updateModules Server Action on each toggle change.
 */
export function ModuleToggleList({
  initialActiveModules,
  moduleLabels,
}: ModuleToggleListProps) {
  const [activeModules, setActiveModules] = useState<string[]>(initialActiveModules)
  const [isPending, startTransition] = useTransition()

  function handleToggle(moduleKey: string, checked: boolean) {
    const next = checked
      ? [...activeModules, moduleKey]
      : activeModules.filter((m) => m !== moduleKey)

    setActiveModules(next)

    startTransition(async () => {
      const result = await updateModules(next)
      if (result.success) {
        toast.success(
          checked
            ? `${moduleLabels[moduleKey] ?? moduleKey} enabled`
            : `${moduleLabels[moduleKey] ?? moduleKey} disabled`
        )
      } else {
        // Revert on error
        setActiveModules(activeModules)
        toast.error(result.error ?? 'Failed to update modules')
      }
    })
  }

  return (
    <div className="space-y-4">
      {ALL_MODULES.map((moduleKey) => {
        const isActive = activeModules.includes(moduleKey)
        const label = moduleLabels[moduleKey] ?? moduleKey

        return (
          <div
            key={moduleKey}
            className="flex items-center justify-between rounded-lg border border-kinship-surface-container bg-kinship-surface-container-lowest px-4 py-3"
          >
            <span className="font-body text-sm font-medium text-kinship-on-surface">
              {label}
            </span>
            {/* Switch — accessible toggle */}
            <button
              role="switch"
              aria-checked={isActive}
              aria-label={`Toggle ${label}`}
              disabled={isPending}
              onClick={() => handleToggle(moduleKey, !isActive)}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kinship-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isActive ? 'bg-kinship-primary' : 'bg-kinship-surface-container',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  isActive ? 'translate-x-5' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
