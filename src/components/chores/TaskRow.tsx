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
      <Badge className="border border-[#0053dc] bg-[#0053dc]/8 text-[#0053dc]">In Progress</Badge>
    )
  }
  if (status === 'done') {
    return <Badge variant="secondary">Done</Badge>
  }
  // todo
  return <Badge variant="outline">To Do</Badge>
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
}

export function TaskRow({ task, members, onStatusChange, onDelete, onEdit }: TaskRowProps) {
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
      className={`relative overflow-visible bg-white rounded-lg p-4 transition-opacity ${isDone ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckbox}
          aria-label={`Mark ${task.title} complete`}
          className={`h-5 w-5 shrink-0 flex items-center justify-center rounded border-2 transition-colors ${
            isDone
              ? 'border-kinship-primary bg-kinship-primary'
              : 'border-kinship-on-surface/30 bg-white hover:border-kinship-primary'
          }`}
        >
          {isDone && (
            <svg
              className="h-3 w-3 text-white"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Title + Area badge + Due date */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-body text-base font-medium text-kinship-on-surface ${isDone ? 'line-through' : ''}`}
            >
              {task.title}
            </span>
            {task.areaName && (
              <Badge variant="outline" className="shrink-0">
                {task.areaName}
              </Badge>
            )}
            {task.startsAt && (
              <span className="font-body text-sm text-kinship-on-surface/60">
                {format(task.startsAt, 'EEE, d MMM')}
              </span>
            )}
          </div>

          {/* Row 2: Notes excerpt */}
          {task.notes && (
            <p className="mt-1 font-body text-sm text-kinship-on-surface/60 line-clamp-1">
              {task.notes}
            </p>
          )}

          {/* Row 3: Owner */}
          <div className="mt-2 flex items-center gap-2">
            {owner ? (
              <>
                <Avatar size="sm">
                  {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.displayName ?? ''} />}
                  <AvatarFallback>{getInitials(owner.displayName)}</AvatarFallback>
                </Avatar>
                <span className="font-body text-sm text-kinship-on-surface/70">
                  {owner.displayName ?? 'Unknown'}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Status + Action menu */}
        <div className="flex shrink-0 self-center items-center gap-1">
          <StatusBadge status={task.status} />
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
                <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-lg border border-border bg-white py-1 shadow-lg">
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
