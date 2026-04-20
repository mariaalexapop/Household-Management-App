'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { List, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ActivityList } from '@/components/kids/ActivityList'
import { ActivityForm } from '@/components/kids/ActivityForm'
import { UnifiedCalendar } from '@/components/calendar/UnifiedCalendar'
import { MODULE_COLOURS, type CalendarEvent } from '@/lib/calendar/types'
import { createChild, deleteChild, deleteActivity } from '@/app/actions/kids'
import { registerChildren } from '@/lib/kids/child-colours'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityItem = {
  id: string
  childId: string
  title: string
  category: string
  location: string | null
  assigneeId: string | null
  startsAt: Date | null
  endsAt: Date | null
  notes: string | null
  reminderOffsetMinutes: number | null
  isRecurring: boolean
  recurrenceRule: unknown
  parentActivityId: string | null
  createdBy: string
}

export type ChildItem = {
  id: string
  name: string
}

export type MemberItem = {
  id: string
  displayName: string | null
  userId: string
}

interface KidsClientProps {
  initialActivities: ActivityItem[]
  childList: ChildItem[]
  members: MemberItem[]
  currentUserId: string
  householdId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KidsClient({
  initialActivities,
  childList,
  members,
  currentUserId,
  householdId,
}: KidsClientProps) {
  const router = useRouter()
  const [optimisticActivities, setOptimisticActivities] = useState(initialActivities)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [localChildList, setLocalChildList] = useState(childList)

  useEffect(() => {
    setOptimisticActivities(initialActivities)
  }, [initialActivities])

  // Register child colour assignments synchronously so first render is correct
  registerChildren(localChildList.map((c) => c.id))

  function handleAdd() {
    setSelectedActivity(null)
    setDialogOpen(true)
  }

  function handleEdit(activity: ActivityItem) {
    setSelectedActivity(activity)
    setDialogOpen(true)
  }

  async function handleDelete(activity: ActivityItem) {
    await deleteActivity({ id: activity.id, deleteFuture: false })
    router.refresh()
  }

  async function handleCreateChild(name: string): Promise<ChildItem> {
    const result = await createChild({ name })
    if (!result.success) throw new Error(result.error ?? 'Failed to create child')
    const newChild = result.data as ChildItem
    setLocalChildList((prev) => [...prev, newChild].sort((a, b) => a.name.localeCompare(b.name)))
    return newChild
  }

  async function handleDeleteChild(childId: string): Promise<void> {
    const result = await deleteChild({ id: childId })
    if (!result.success) throw new Error(result.error ?? 'Failed to delete child')
    setLocalChildList((prev) => prev.filter((c) => c.id !== childId))
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface sm:text-[32px]">Kids Activities</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={`min-h-11 min-w-11 rounded-lg p-2 flex items-center justify-center ${
              view === 'list'
                ? 'bg-module-kids-light text-module-kids-dark'
                : 'hover:bg-kinship-surface-container text-kinship-on-surface'
            }`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
          <a
            href="/calendar?filter=kids_activities"
            className="min-h-11 min-w-11 rounded-lg p-2 flex items-center justify-center hover:bg-kinship-surface-container text-kinship-on-surface"
            aria-label="View in calendar"
          >
            <Calendar size={18} />
          </a>
          <Button
            onClick={handleAdd}
            className="ml-2 min-h-11 rounded-full bg-kinship-primary text-white hover:bg-kinship-primary/90"
          >
            + Add Activity
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <ActivityList
          activities={optimisticActivities}
          childList={localChildList}
          members={members}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="bg-white rounded-2xl ring-miro p-3 sm:p-6">
          <UnifiedCalendar
            events={optimisticActivities
              .filter((a) => a.startsAt !== null)
              .map((a): CalendarEvent => ({
                id: a.id,
                title: a.title,
                startsAt: a.startsAt as Date,
                endsAt: a.endsAt,
                module: 'kids',
                href: '/kids',
                colour: MODULE_COLOURS.kids,
                label: a.title.slice(0, 20),
                filterCategory: 'kids_activities',
              }))}
            defaultView="month"
          />
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-semibold text-kinship-on-surface">
              {selectedActivity ? 'Edit Activity' : 'Add Activity'}
            </DialogTitle>
          </DialogHeader>
          <ActivityForm
            mode={selectedActivity ? 'edit' : 'create'}
            activity={selectedActivity ?? undefined}
            childList={localChildList}
            members={members}
            currentUserId={currentUserId}
            onSuccess={() => {
              setDialogOpen(false)
              router.refresh()
            }}
            onCancel={() => setDialogOpen(false)}
            onCreateChild={handleCreateChild}
            onDeleteChild={handleDeleteChild}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
