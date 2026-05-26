'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TaskList } from '@/components/chores/TaskList'
import { TaskForm } from '@/components/chores/TaskForm'
import { TaskFilters } from '@/components/chores/TaskFilters'
import { updateTaskStatus, deleteTask, bulkUpdateTaskStatus, bulkDeleteTasks } from '@/app/actions/tasks'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskItem {
  id: string
  title: string
  notes: string | null
  status: string
  startsAt: Date | null
  endsAt: Date | null
  isRecurring: boolean
  recurrenceRule: unknown
  parentTaskId: string | null
  ownerId: string | null
  areaId: string | null
  areaName: string | null
  reminderOffsetMinutes: number | null
  createdBy: string
}

export interface AreaItem {
  id: string
  name: string
}

export interface MemberItem {
  id: string
  displayName: string | null
  avatarUrl: string | null
  userId: string
}

interface ChoresClientProps {
  initialTasks: TaskItem[]
  areas: AreaItem[]
  members: MemberItem[]
  currentUserId: string
}

export interface FilterState {
  statusFilter: string[]
  areaFilter: string | null
  sortDir: 'asc' | 'desc'
  hideDone: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChoresClient({
  initialTasks,
  areas,
  members,
  currentUserId,
}: ChoresClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Optimistic task list — sync when server refreshes with new data
  const [optimisticTasks, setOptimisticTasks] = useState<TaskItem[]>(initialTasks)
  useEffect(() => {
    setOptimisticTasks(initialTasks)
  }, [initialTasks])

  // Auto-open add dialog from ?action=new
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddDialogOpen(true)
      router.replace('/chores', { scroll: false })
    }
  }, [searchParams, router])

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)

  // Delete confirmation state
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(taskIds: string[]) {
    setSelectedIds((prev) => {
      const allSelected = taskIds.every((id) => prev.has(id))
      if (allSelected) return new Set()
      return new Set(taskIds)
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function handleBulkDone() {
    const ids = Array.from(selectedIds)
    const previous = optimisticTasks
    setOptimisticTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, status: 'done' } : t)))
    exitSelectMode()
    const result = await bulkUpdateTaskStatus(ids, 'done')
    if (!result.success) setOptimisticTasks(previous)
    startTransition(() => router.refresh())
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    const previous = optimisticTasks
    setOptimisticTasks((prev) => prev.filter((t) => !ids.includes(t.id)))
    exitSelectMode()
    const result = await bulkDeleteTasks(ids)
    if (!result.success) setOptimisticTasks(previous)
    startTransition(() => router.refresh())
  }

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    statusFilter: [],
    areaFilter: null,
    sortDir: 'asc',
    hideDone: false,
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleFiltersChange(newFilters: FilterState) {
    setFilters(newFilters)

    // URL-reflect filters via router.push
    const params = new URLSearchParams()
    if (newFilters.statusFilter.length > 0) params.set('status', newFilters.statusFilter.join(','))
    if (newFilters.areaFilter) params.set('areaId', newFilters.areaFilter)
    if (newFilters.sortDir === 'desc') params.set('sort', 'desc')
    if (newFilters.hideDone) params.set('hideDone', 'true')

    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `/chores?${qs}` : '/chores')
    })
  }

  async function handleStatusChange(id: string, status: 'todo' | 'in_progress' | 'done') {
    // Optimistic update
    const previous = optimisticTasks
    setOptimisticTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))

    const result = await updateTaskStatus({ id, status })
    if (!result.success) {
      // Revert on error
      setOptimisticTasks(previous)
    }
  }

  function handleDeleteRequest(id: string) {
    setDeletingTaskId(id)
    setIsDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deletingTaskId) return

    const id = deletingTaskId
    // Optimistic removal
    const previous = optimisticTasks
    setOptimisticTasks((prev) => prev.filter((t) => t.id !== id))
    setIsDeleteDialogOpen(false)
    setDeletingTaskId(null)

    const result = await deleteTask(id)
    if (!result.success) {
      // Revert on error
      setOptimisticTasks(previous)
    }
  }

  function handleEdit(task: TaskItem) {
    setEditingTask(task)
    setIsAddDialogOpen(true)
  }

  function handleFormSuccess(newTask?: TaskItem) {
    setIsAddDialogOpen(false)
    setEditingTask(null)
    if (newTask) {
      setOptimisticTasks((prev) => {
        // Replace if editing, insert sorted by startsAt if new
        const existing = prev.find((t) => t.id === newTask.id)
        if (existing) {
          return prev.map((t) => (t.id === newTask.id ? newTask : t))
        }
        return [...prev, newTask].sort((a, b) => {
          if (!a.startsAt) return 1
          if (!b.startsAt) return -1
          return a.startsAt.getTime() - b.startsAt.getTime()
        })
      })
    }
    // Refresh server data
    startTransition(() => {
      router.refresh()
    })
  }

  // Apply client-side filters to optimistic list
  const visibleTasks = optimisticTasks.filter((t) => {
    if (t.isRecurring && t.parentTaskId === null) return false
    if (filters.hideDone && t.status === 'done') return false
    if (filters.statusFilter.length > 0 && !filters.statusFilter.includes(t.status)) return false
    if (filters.areaFilter && t.areaId !== filters.areaFilter) return false
    return true
  })

  const sortedTasks =
    filters.sortDir === 'asc'
      ? [...visibleTasks].sort((a, b) => {
          if (!a.startsAt) return 1
          if (!b.startsAt) return -1
          return a.startsAt.getTime() - b.startsAt.getTime()
        })
      : [...visibleTasks].sort((a, b) => {
          if (!a.startsAt) return -1
          if (!b.startsAt) return 1
          return b.startsAt.getTime() - a.startsAt.getTime()
        })

  const deletingTaskTitle = optimisticTasks.find((t) => t.id === deletingTaskId)?.title ?? 'this task'

  return (
    <div className="flex flex-col gap-4">
      {/* Bulk action bar */}
      {selectMode && (
        <div className="flex items-center justify-between rounded-xl bg-kinship-primary/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSelectAll(sortedTasks.map((t) => t.id))}
              className="font-body text-sm text-kinship-primary hover:underline"
            >
              {sortedTasks.every((t) => selectedIds.has(t.id)) ? 'Deselect all' : 'Select all'}
            </button>
            <span className="font-body text-sm text-kinship-on-surface-variant">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={handleBulkDone}
              className="rounded-full bg-kinship-primary text-white hover:bg-kinship-primary/90 disabled:opacity-40"
            >
              Mark done
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0}
              onClick={handleBulkDelete}
              className="rounded-full border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exitSelectMode}
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Filter bar + Add Task button */}
      <div className="flex flex-col gap-3 bg-kinship-surface-container rounded-xl p-4 sm:flex-row sm:items-end sm:justify-between">
        <TaskFilters areas={areas} filters={filters} onFiltersChange={handleFiltersChange} />
        <div className="flex items-center gap-2">
          {!selectMode && sortedTasks.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setSelectMode(true)}
              className="min-h-[44px] shrink-0 rounded-full border-kinship-outline"
            >
              Select
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsAddDialogOpen(true)
            }}
            className="min-h-[44px] shrink-0 rounded-full bg-kinship-primary text-white hover:bg-kinship-primary/90"
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Task list */}
      <TaskList
        tasks={sortedTasks}
        members={members}
        currentUserId={currentUserId}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteRequest}
        onEdit={handleEdit}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      {/* Add / Edit Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white rounded-2xl ring-miro p-4 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface sm:text-[32px]">{editingTask ? 'Edit task' : 'Add a task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            areas={areas}
            members={members}
            editingTask={editingTask}
            currentUserId={currentUserId}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsAddDialogOpen(false)
              setEditingTask(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white rounded-2xl ring-miro p-4 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface sm:text-[32px]">Delete task?</DialogTitle>
          </DialogHeader>
          <p className="font-body text-base text-kinship-on-surface-variant">
            Are you sure you want to delete &ldquo;{deletingTaskTitle}&rdquo;? This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-lg border-kinship-outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingTaskId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
            >
              Delete task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
