'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTask, updateTask, createChoreArea } from '@/app/actions/tasks'
import type { TaskItem, AreaItem, MemberItem } from '@/app/(app)/chores/ChoresClient'

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const taskFormSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(200, 'Task name must be 200 characters or fewer'),
  notes: z.string().optional(),
  areaId: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  reminderOffsetMinutes: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISOWithOffset(date: string, time: string): string {
  const timeStr = time || '00:00'
  const localDatetime = `${date}T${timeStr}:00`
  const d = new Date(localDatetime)
  // Use local timezone offset
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const minutes = String(absOffset % 60).padStart(2, '0')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00${sign}${hours}:${minutes}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TaskFormProps {
  areas: AreaItem[]
  members: MemberItem[]
  editingTask: TaskItem | null
  currentUserId: string
  onSuccess: (task?: TaskItem) => void
  onCancel: () => void
}

export function TaskForm({
  areas,
  members,
  editingTask,
  currentUserId,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // "Create new area" inline state
  const [showNewArea, setShowNewArea] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')
  const [newAreaError, setNewAreaError] = useState<string | null>(null)
  const [areasList, setAreasList] = useState<AreaItem[]>(areas)

  // Default values for edit mode
  const defaultValues: TaskFormValues = editingTask
    ? {
        title: editingTask.title,
        notes: editingTask.notes ?? '',
        areaId: editingTask.areaId ?? '',
        ownerId: editingTask.ownerId ?? '',
        startDate: editingTask.startsAt ? format(editingTask.startsAt, 'yyyy-MM-dd') : '',
        startTime: editingTask.startsAt ? format(editingTask.startsAt, 'HH:mm') : '',
        endDate: editingTask.endsAt ? format(editingTask.endsAt, 'yyyy-MM-dd') : '',
        endTime: editingTask.endsAt ? format(editingTask.endsAt, 'HH:mm') : '',
        reminderOffsetMinutes: editingTask.reminderOffsetMinutes
          ? String(editingTask.reminderOffsetMinutes)
          : '',
      }
    : {
        title: '',
        notes: '',
        areaId: '',
        ownerId: currentUserId,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endDate: '',
        endTime: '',
        reminderOffsetMinutes: '',
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  })

  const watchedAreaId = watch('areaId')

  async function handleCreateArea() {
    setNewAreaError(null)
    if (!newAreaName.trim()) {
      setNewAreaError('Area name is required')
      return
    }
    const result = await createChoreArea({ name: newAreaName.trim() })
    if (!result.success) {
      setNewAreaError(result.error ?? 'Failed to create area')
      return
    }
    if (result.data) {
      const created = { id: result.data.id, name: result.data.name }
      setAreasList((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setValue('areaId', created.id)
    }
    setNewAreaName('')
    setShowNewArea(false)
  }

  async function onSubmit(values: TaskFormValues) {
    setServerError(null)
    setIsSubmitting(true)

    try {
      const startsAt = toISOWithOffset(values.startDate, values.startTime ?? '')
      const endsAt =
        values.endDate
          ? toISOWithOffset(values.endDate, values.endTime ?? '')
          : null

      const payload = {
        title: values.title,
        notes: values.notes || null,
        areaId: values.areaId || null,
        ownerId: values.ownerId || null,
        startsAt,
        endsAt,
        reminderOffsetMinutes: values.reminderOffsetMinutes
          ? parseInt(values.reminderOffsetMinutes, 10)
          : null,
      }

      if (editingTask) {
        const result = await updateTask({ ...payload, id: editingTask.id })
        if (!result.success) {
          setServerError(result.error ?? 'Failed to update task')
          return
        }
        onSuccess()
      } else {
        const result = await createTask(payload)
        if (!result.success) {
          setServerError(result.error ?? 'Failed to create task')
          return
        }
        onSuccess()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClassName =
    'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="title" className="font-body text-sm">
          Task name <span className="text-destructive">*</span>
        </Label>
        <Input id="title" placeholder="e.g. Clean the kitchen" {...register('title')} />
        {errors.title && (
          <p className="font-body text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Area */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="areaId" className="font-body text-sm">
          Area
        </Label>
        <select
          id="areaId"
          className={inputClassName}
          {...register('areaId')}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setShowNewArea(true)
              setValue('areaId', '')
            } else {
              setShowNewArea(false)
              setValue('areaId', e.target.value)
            }
          }}
          value={watchedAreaId}
        >
          <option value="">No area</option>
          {areasList.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
          <option value="__new__">Create new area...</option>
        </select>

        {showNewArea && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Area name"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={handleCreateArea} variant="outline">
              Create Area
            </Button>
          </div>
        )}
        {newAreaError && (
          <p className="font-body text-xs text-destructive">{newAreaError}</p>
        )}
      </div>

      {/* Start date + time */}
      <div className="flex flex-col gap-1">
        <Label className="font-body text-sm">
          Start date <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            className={`${inputClassName} flex-1`}
            {...register('startDate')}
          />
          <input
            type="time"
            className={`${inputClassName} w-32`}
            {...register('startTime')}
          />
        </div>
        {errors.startDate && (
          <p className="font-body text-xs text-destructive">{errors.startDate.message}</p>
        )}
      </div>

      {/* End date + time (optional) */}
      <div className="flex flex-col gap-1">
        <Label className="font-body text-sm">End date (optional)</Label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            className={`${inputClassName} flex-1`}
            {...register('endDate')}
          />
          <input
            type="time"
            className={`${inputClassName} w-32`}
            {...register('endTime')}
          />
        </div>
      </div>

      {/* Owner */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="ownerId" className="font-body text-sm">
          Assigned to
        </Label>
        <select id="ownerId" className={inputClassName} {...register('ownerId')}>
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName ?? 'Member'}
              {member.userId === currentUserId ? ' (you)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="notes" className="font-body text-sm">
          Notes (optional)
        </Label>
        <textarea
          id="notes"
          rows={3}
          className={`${inputClassName} h-auto resize-none`}
          placeholder="Any additional details..."
          {...register('notes')}
        />
      </div>

      {/* Reminder */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="reminderOffsetMinutes" className="font-body text-sm">
          Reminder
        </Label>
        <select
          id="reminderOffsetMinutes"
          className={inputClassName}
          {...register('reminderOffsetMinutes')}
        >
          <option value="">No reminder</option>
          <option value="60">1 hour before</option>
          <option value="180">3 hours before</option>
          <option value="1440">1 day before</option>
          <option value="2880">2 days before</option>
        </select>
      </div>

      {/* Server error */}
      {serverError && (
        <p className="font-body text-sm text-destructive">{serverError}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-kinship-primary text-white hover:bg-kinship-primary/90"
        >
          {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Add Task'}
        </Button>
      </div>
    </form>
  )
}
