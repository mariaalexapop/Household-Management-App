'use client'

import { TaskRow } from './TaskRow'
import type { TaskItem, MemberItem } from '@/app/(app)/chores/ChoresClient'

interface TaskListProps {
  tasks: TaskItem[]
  members: MemberItem[]
  currentUserId: string
  onStatusChange: (id: string, status: 'todo' | 'in_progress' | 'done') => void
  onDelete: (id: string) => void
  onEdit: (task: TaskItem) => void
}

export function TaskList({
  tasks,
  members,
  currentUserId,
  onStatusChange,
  onDelete,
  onEdit,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-lg font-semibold text-kinship-on-surface">No tasks yet</p>
        <p className="font-body text-base text-kinship-on-surface-variant">
          Your household has no tasks. Add your first task to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          members={members}
          currentUserId={currentUserId}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
