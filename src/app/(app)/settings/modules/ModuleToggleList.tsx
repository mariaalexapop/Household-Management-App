'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { updateModules } from '@/app/actions/settings'

interface ModuleToggleListProps {
  initialActiveModules: string[]
  moduleLabels: Record<string, string>
}

const ALL_MODULES = ['chores', 'car', 'insurance', 'electronics', 'kids'] as const

/**
 * Client component: renders 5 module toggle switches with drag-to-reorder.
 * The order of active modules determines their dashboard display order.
 */
export function ModuleToggleList({
  initialActiveModules,
  moduleLabels,
}: ModuleToggleListProps) {
  // Maintain a full ordered list — active modules first (in their order), then inactive ones
  const [orderedModules, setOrderedModules] = useState<string[]>(() => {
    const active = initialActiveModules.filter((m) =>
      (ALL_MODULES as readonly string[]).includes(m)
    )
    const inactive = ALL_MODULES.filter((m) => !active.includes(m))
    return [...active, ...inactive]
  })
  const [activeSet, setActiveSet] = useState<Set<string>>(
    () => new Set(initialActiveModules)
  )
  const [isPending, startTransition] = useTransition()

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

  function persistModules(ordered: string[], active: Set<string>) {
    // Save only active modules in their current order
    const next = ordered.filter((m) => active.has(m))
    startTransition(async () => {
      const result = await updateModules(next)
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update modules')
      }
    })
  }

  function handleToggle(moduleKey: string, checked: boolean) {
    const nextActive = new Set(activeSet)
    if (checked) {
      nextActive.add(moduleKey)
      toast.success(`${moduleLabels[moduleKey] ?? moduleKey} enabled`)
    } else {
      nextActive.delete(moduleKey)
      toast.success(`${moduleLabels[moduleKey] ?? moduleKey} disabled`)
    }
    setActiveSet(nextActive)
    persistModules(orderedModules, nextActive)
  }

  // --- Drag handlers ---
  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Use a minimal drag image
    const el = e.currentTarget as HTMLElement
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2)
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    dragCounter.current++
    setOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setOverIndex(null)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragIndex === null || dragIndex === targetIndex) {
        setDragIndex(null)
        setOverIndex(null)
        dragCounter.current = 0
        return
      }
      setOrderedModules((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(targetIndex, 0, moved)
        // Persist after reorder
        setTimeout(() => persistModules(next, activeSet), 0)
        return next
      })
      setDragIndex(null)
      setOverIndex(null)
      dragCounter.current = 0
      toast.success('Module order updated')
    },
    [dragIndex, activeSet] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setOverIndex(null)
    dragCounter.current = 0
  }, [])

  return (
    <div className="space-y-2">
      {orderedModules.map((moduleKey, index) => {
        const isActive = activeSet.has(moduleKey)
        const label = moduleLabels[moduleKey] ?? moduleKey
        const isDragging = dragIndex === index
        const isOver = overIndex === index && dragIndex !== index

        return (
          <div
            key={moduleKey}
            draggable
            onDragStart={(e) => handleDragStart(index, e)}
            onDragEnter={() => handleDragEnter(index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 rounded-lg border bg-kinship-surface-container-lowest px-4 py-3 transition-all cursor-grab active:cursor-grabbing ${
              isDragging
                ? 'opacity-40 border-kinship-surface-container'
                : isOver
                  ? 'border-kinship-primary ring-1 ring-kinship-primary'
                  : 'border-kinship-surface-container'
            }`}
          >
            {/* Drag handle */}
            <GripVertical className="h-4 w-4 shrink-0 text-kinship-on-surface-variant" />

            {/* Label */}
            <span className="flex-1 font-body text-sm font-medium text-kinship-on-surface">
              {label}
            </span>

            {/* Toggle switch */}
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

      <p className="pt-1 font-body text-xs text-kinship-on-surface-variant">
        Drag modules to reorder how they appear on your dashboard.
      </p>
    </div>
  )
}
