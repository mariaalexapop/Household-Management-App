'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { TaskItem, MemberItem } from '@/app/(app)/chores/ChoresClient'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'in_progress') {
    return (
      <Badge className="rounded-full border border-kinship-primary bg-kinship-primary-surface text-kinship-primary font-body text-xs font-medium">In Progress</Badge>
    )
  }
  if (status === 'done') {
    return <Badge className="rounded-full border border-kinship-success bg-kinship-success-surface text-kinship-success font-body text-xs font-medium">Done</Badge>
  }
  // todo
  return <Badge className="rounded-full border border-kinship-outline bg-kinship-surface text-kinship-on-surface-variant font-body text-xs font-medium">To Do</Badge>
}

// ---------------------------------------------------------------------------
// TaskRow
// ---------------------------------------------------------------------------

interface TaskRowProps {
  task: TaskItem
  members: MemberItem[]
  currentUserId: string
  onStatusChange: (id: string, status: 'todo' | 'in_progress' | 'done') => void
  onDelete: (id: string) => void
  onEdit: (task: TaskItem) => void
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

export function TaskRow({ task, members, onStatusChange, onDelete, onEdit, selectMode = false, selected = false, onToggleSelect }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const owner = members.find((m) => m.id === task.ownerId)
  const isDone = task.status === 'done'

  function handleCheckbox() {
    if (isDone) {
      onStatusChange(task.id, 'todo')
    } else {
      onStatusChange(task.id, 'done')
    }
  }

  return (
    <Card
      className={`relative overflow-visible bg-white rounded-xl ring-miro border-0 px-3.5 py-3 transition-all ${isDone ? 'opacity-60' : ''} ${selected ? 'ring-2 ring-kinship-primary' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Select checkbox or Done checkbox */}
        {selectMode ? (
          <button
            type="button"
            onClick={() => onToggleSelect?.(task.id)}
            aria-label={`Select ${task.title}`}
            className={`mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
              selected
                ? 'border-kinship-primary bg-kinship-primary'
                : 'border-kinship-border-strong bg-white hover:border-kinship-primary'
            }`}
          >
            {selected && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCheckbox}
            aria-label={`Mark ${task.title} complete`}
            className={`mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
              isDone
                ? 'border-kinship-primary bg-kinship-primary'
                : 'border-kinship-border-strong bg-white hover:border-kinship-primary'
            }`}
          >
            {isDone && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Title */}
          <span
            className={`font-display text-sm font-semibold text-kinship-on-surface ${isDone ? 'line-through' : ''}`}
          >
            {task.title}
          </span>

          {/* Row 2: Area badge + Due date + Recurrence */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.areaName && (
              <span className="inline-flex shrink-0 rounded-md bg-module-chores-light px-2 py-0.5 font-body text-xs font-medium text-module-chores-dark">
                {task.areaName}
              </span>
            )}
            {task.startsAt && (
              <span className="font-body text-xs text-kinship-on-surface-variant">
                {format(task.startsAt, 'EEE, d MMM')}
              </span>
            )}
            {task.isRecurring && (
              <span className="font-body text-xs text-kinship-on-surface-variant" title="Recurring task">
                &#x21bb;
              </span>
            )}
          </div>
        </div>

        {/* Right side: Status + Avatar + Action menu */}
        <div className="flex shrink-0 items-center gap-2 self-center">
          <StatusBadge status={task.status} />
          {owner && (
            <Avatar size="sm">
              {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.displayName ?? ''} />}
              <AvatarFallback>{getInitials(owner.displayName)}</AvatarFallback>
            </Avatar>
          )}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] p-0"
              aria-label="Task actions"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                {/* Menu */}
                <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-xl bg-white py-1 ring-miro shadow-float">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left font-body text-sm text-kinship-on-surface hover:bg-kinship-surface"
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit(task)
                    }}
                  >
                    Edit task
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left font-body text-sm text-destructive hover:bg-kinship-surface"
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete(task.id)
                    }}
                  >
                    Delete task
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
