'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { createActivity, updateActivity } from '@/app/actions/kids'
import type { ActivityItem, ChildItem, MemberItem } from '@/app/(app)/kids/KidsClient'

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  childId: z.string().min(1, 'Please select or add a child'),
  title: z.string().min(1, 'Title is required').max(200),
  category: z.enum(['school', 'medical', 'sport', 'hobby', 'social']),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().max(300).optional(),
  assigneeId: z.string().optional(),
  notes: z.string().optional(),
  reminderOffsetMinutes: z.string().optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']),
  interval: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISOWithOffset(date: string, time: string): string {
  const timeStr = time || '00:00'
  const localDatetime = `${date}T${timeStr}:00`
  const d = new Date(localDatetime)
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const minutes = String(absOffset % 60).padStart(2, '0')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00${sign}${hours}:${minutes}`
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ActivityFormProps {
  mode: 'create' | 'edit'
  activity?: ActivityItem
  childList: ChildItem[]
  members: MemberItem[]
  currentUserId: string
  onSuccess: () => void
  onCancel: () => void
  onCreateChild: (name: string) => Promise<ChildItem>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityForm({
  mode,
  activity,
  childList,
  members,
  currentUserId,
  onSuccess,
  onCancel,
  onCreateChild,
}: ActivityFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline "add new child" state
  const [showNewChild, setShowNewChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [newChildError, setNewChildError] = useState<string | null>(null)
  const [localChildList, setLocalChildList] = useState<ChildItem[]>(childList)

  // Find default assignee (member whose userId === currentUserId)
  const defaultAssignee = members.find((m) => m.userId === currentUserId)

  // Derive default repeat value from existing activity
  function getDefaultRepeat(a?: ActivityItem): 'none' | 'daily' | 'weekly' | 'monthly' {
    if (!a?.isRecurring || !a.recurrenceRule) return 'none'
    const rule = a.recurrenceRule as { frequency?: string }
    if (rule.frequency === 'daily') return 'daily'
    if (rule.frequency === 'weekly') return 'weekly'
    if (rule.frequency === 'monthly') return 'monthly'
    return 'none'
  }

  const defaultValues: FormValues = activity
    ? {
        childId: activity.childId,
        title: activity.title,
        category: activity.category as FormValues['category'],
        startDate: activity.startsAt ? format(activity.startsAt, 'yyyy-MM-dd') : '',
        startTime: activity.startsAt ? format(activity.startsAt, 'HH:mm') : '',
        endDate: activity.endsAt ? format(activity.endsAt, 'yyyy-MM-dd') : '',
        endTime: activity.endsAt ? format(activity.endsAt, 'HH:mm') : '',
        location: activity.location ?? '',
        assigneeId: activity.assigneeId ?? defaultAssignee?.id ?? '',
        notes: activity.notes ?? '',
        reminderOffsetMinutes: activity.reminderOffsetMinutes
          ? String(activity.reminderOffsetMinutes)
          : '1440',
        repeat: getDefaultRepeat(activity),
        interval: (() => {
          const rule = activity.recurrenceRule as { interval?: number } | null
          return rule?.interval ? String(rule.interval) : '1'
        })(),
      }
    : {
        childId: localChildList[0]?.id ?? '',
        title: '',
        category: 'school',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        assigneeId: defaultAssignee?.id ?? '',
        notes: '',
        reminderOffsetMinutes: '1440',
        repeat: 'none',
        interval: '1',
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const watchedChildId = watch('childId')
  const watchedRepeat = watch('repeat')

  // ---------------------------------------------------------------------------
  // "Add new child" inline handler
  // ---------------------------------------------------------------------------

  async function handleCreateChild() {
    setNewChildError(null)
    if (!newChildName.trim()) {
      setNewChildError('Child name is required')
      return
    }
    try {
      const newChild = await onCreateChild(newChildName.trim())
      setLocalChildList((prev) =>
        [...prev, newChild].sort((a, b) => a.name.localeCompare(b.name))
      )
      setValue('childId', newChild.id)
      setNewChildName('')
      setShowNewChild(false)
    } catch (err) {
      setNewChildError(err instanceof Error ? err.message : 'Failed to add child')
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsSubmitting(true)

    try {
      const startsAt = toISOWithOffset(values.startDate, values.startTime ?? '')
      const endsAt = values.endDate ? toISOWithOffset(values.endDate, values.endTime ?? '') : null

      const isRecurring = values.repeat !== 'none'
      const recurrenceRule = isRecurring
        ? {
            frequency: values.repeat as 'daily' | 'weekly' | 'monthly',
            interval: values.interval ? parseInt(values.interval, 10) : 1,
          }
        : null

      const payload = {
        childId: values.childId,
        title: values.title,
        category: values.category,
        startsAt,
        endsAt,
        location: values.location || null,
        assigneeId: values.assigneeId || null,
        notes: values.notes || null,
        reminderOffsetMinutes: values.reminderOffsetMinutes
          ? parseInt(values.reminderOffsetMinutes, 10)
          : null,
        isRecurring,
        recurrenceRule,
      }

      if (mode === 'edit' && activity) {
        const result = await updateActivity({ ...payload, id: activity.id })
        if (!result.success) {
          setServerError(result.error ?? 'Failed to update activity')
          return
        }
      } else {
        const result = await createActivity(payload)
        if (!result.success) {
          setServerError(result.error ?? 'Failed to create activity')
          return
        }
      }

      onSuccess()
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClassName =
    'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  const inlineFieldClassName =
    'h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {/* Child */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="childId" className="font-body text-sm">
          Child <span className="text-destructive">*</span>
        </Label>
        <select
          id="childId"
          className={inputClassName}
          {...register('childId')}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setShowNewChild(true)
              setValue('childId', '')
            } else {
              setShowNewChild(false)
              setValue('childId', e.target.value)
            }
          }}
          value={watchedChildId}
        >
          <option value="">Select a child...</option>
          {localChildList.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
          <option value="__new__">Add new child...</option>
        </select>

        {showNewChild && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Child's name"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={handleCreateChild} variant="outline">
              Add
            </Button>
          </div>
        )}
        {newChildError && (
          <p className="font-body text-xs text-destructive">{newChildError}</p>
        )}
        {errors.childId && (
          <p className="font-body text-xs text-destructive">{errors.childId.message}</p>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="title" className="font-body text-sm">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input id="title" placeholder="e.g. Soccer practice" {...register('title')} />
        {errors.title && (
          <p className="font-body text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="category" className="font-body text-sm">
          Category <span className="text-destructive">*</span>
        </Label>
        <select id="category" className={inputClassName} {...register('category')}>
          <option value="school">School</option>
          <option value="medical">Medical</option>
          <option value="sport">Sport</option>
          <option value="hobby">Hobby</option>
          <option value="social">Social</option>
        </select>
        {errors.category && (
          <p className="font-body text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Start date + time */}
      <div className="flex flex-col gap-1">
        <Label className="font-body text-sm">
          Starts <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Pick a date"
                className="min-w-0 flex-1"
              />
            )}
          />
          <input
            type="time"
            className={`${inlineFieldClassName} w-32 shrink-0`}
            {...register('startTime')}
          />
        </div>
        {errors.startDate && (
          <p className="font-body text-xs text-destructive">{errors.startDate.message}</p>
        )}
      </div>

      {/* End date + time (optional) */}
      <div className="flex flex-col gap-1">
        <Label className="font-body text-sm">Ends (optional)</Label>
        <div className="flex gap-2">
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Pick a date (optional)"
                className="min-w-0 flex-1"
              />
            )}
          />
          <input
            type="time"
            className={`${inlineFieldClassName} w-32 shrink-0`}
            {...register('endTime')}
          />
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="location" className="font-body text-sm">
          Location (optional)
        </Label>
        <Input
          id="location"
          placeholder="e.g. Community sports centre"
          {...register('location')}
        />
        {errors.location && (
          <p className="font-body text-xs text-destructive">{errors.location.message}</p>
        )}
      </div>

      {/* Assignee */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="assigneeId" className="font-body text-sm">
          Assigned to
        </Label>
        <select id="assigneeId" className={inputClassName} {...register('assigneeId')}>
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName ?? 'Member'}
              {member.userId === currentUserId ? ' (you)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Repeat */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="repeat" className="font-body text-sm">
          Repeat
        </Label>
        <div className="flex items-center gap-3">
          <select id="repeat" className={`${inputClassName} flex-1`} {...register('repeat')}>
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {watchedRepeat !== 'none' && (
            <div className="flex shrink-0 items-center gap-2">
              <Label className="whitespace-nowrap font-body text-sm">Every</Label>
              <input
                type="number"
                min={1}
                className={`${inlineFieldClassName} w-16`}
                {...register('interval')}
              />
              <span className="font-body text-sm text-kinship-on-surface-variant">
                {watchedRepeat === 'daily'
                  ? 'day(s)'
                  : watchedRepeat === 'weekly'
                    ? 'week(s)'
                    : 'month(s)'}
              </span>
            </div>
          )}
        </div>
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
          <option value="30">30 minutes before</option>
          <option value="60">1 hour before</option>
          <option value="180">3 hours before</option>
          <option value="1440">1 day before</option>
          <option value="2880">2 days before</option>
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

      {/* Server error */}
      {serverError && (
        <p className="font-body text-sm text-destructive">{serverError}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border-kinship-outline">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-kinship-primary text-white hover:bg-kinship-primary/90"
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Activity' : 'Add Activity'}
        </Button>
      </div>
    </form>
  )
}
