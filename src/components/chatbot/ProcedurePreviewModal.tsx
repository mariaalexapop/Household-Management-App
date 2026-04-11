'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createTask } from '@/app/actions/tasks'

interface ProcedureStep {
  title: string
  description?: string
}

interface ProcedurePreviewModalProps {
  procedure: {
    title: string
    steps: ProcedureStep[]
  }
  onClose: () => void
  onCreated: () => void
}

/**
 * Modal that renders the steps emitted by the `extract_procedure` tool call
 * as a checkbox list. On confirm, each selected step is turned into a task
 * via the existing `createTask` server action. Target section is Chores
 * (MVP scope per INS-09).
 */
export function ProcedurePreviewModal({ procedure, onClose, onCreated }: ProcedurePreviewModalProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(procedure.steps.map((_, i) => i))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)

    const chosen = procedure.steps.filter((_, i) => selected.has(i))
    if (chosen.length === 0) {
      setError('Select at least one step to create a task.')
      setSubmitting(false)
      return
    }

    // Stagger start dates one day apart starting tomorrow so they feel scheduled.
    const baseMs = Date.now() + 24 * 60 * 60 * 1000
    let successCount = 0
    const failures: string[] = []

    for (let i = 0; i < chosen.length; i++) {
      const step = chosen[i]
      const startsAt = new Date(baseMs + i * 24 * 60 * 60 * 1000).toISOString()
      const res = await createTask({
        title: step.title,
        notes: step.description ?? null,
        startsAt,
      })
      if (res.success) {
        successCount++
      } else {
        failures.push(`${step.title}: ${res.error ?? 'unknown error'}`)
      }
    }

    setSubmitting(false)

    if (failures.length === 0) {
      toast.success(
        successCount === 1
          ? 'Task added to Chores'
          : `${successCount} tasks added to Chores`
      )
      onCreated()
      return
    }

    if (successCount > 0) {
      toast.success(`Created ${successCount} task${successCount === 1 ? '' : 's'}`)
    }
    setError(`Failed to create ${failures.length} task${failures.length === 1 ? '' : 's'}: ${failures[0]}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Turn procedure into tasks"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-[#e0e2e8]">
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-[#1c1c1e]">
            Turn into tasks
          </h2>
          <p className="mt-1 font-body text-sm text-[#555a6a]">{procedure.title}</p>
          <p className="mt-2 font-body text-xs text-[#8a8f9c]">
            These will be added to <span className="font-semibold text-[#1c1c1e]">Chores</span>.
          </p>
        </div>

        <ul className="mb-4 flex max-h-80 flex-col gap-2 overflow-y-auto">
          {procedure.steps.map((step, i) => {
            const checked = selected.has(i)
            return (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 ring-1 ring-[#e0e2e8] hover:bg-[#fafbfc]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(i)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#5b76fe]"
                    aria-label={`Include step: ${step.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-semibold text-[#1c1c1e]">
                      {step.title}
                    </p>
                    {step.description ? (
                      <p className="mt-0.5 font-body text-xs text-[#555a6a]">
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                </label>
              </li>
            )
          })}
        </ul>

        {error ? (
          <p
            className="mb-3 rounded-xl bg-red-50 px-3 py-2 font-body text-xs text-red-700 ring-1 ring-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-2 font-body text-sm font-medium text-[#555a6a] transition hover:bg-[#f0f0f2] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || selected.size === 0}
            className="rounded-full bg-[#5b76fe] px-5 py-2 font-body text-sm font-semibold text-white transition hover:bg-[#2a41b6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating…' : `Create ${selected.size} task${selected.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
