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
import { createChild, deleteActivity } from '@/app/actions/kids'

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-kinship-on-surface">Kids Activities</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={`rounded p-2 ${
              view === 'list'
                ? 'bg-kinship-primary text-white'
                : 'hover:bg-kinship-surface-container text-kinship-on-surface'
            }`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`rounded p-2 ${
              view === 'calendar'
                ? 'bg-kinship-primary text-white'
                : 'hover:bg-kinship-surface-container text-kinship-on-surface'
            }`}
            aria-label="Calendar view"
          >
            <Calendar size={18} />
          </button>
          <Button
            onClick={handleAdd}
            className="ml-2 rounded-full bg-kinship-primary text-white hover:bg-kinship-primary/90"
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
        <div className="rounded-lg bg-kinship-surface-container-lowest p-6">
          <p className="font-body text-center text-kinship-on-surface/60">
            Calendar view — implemented in Plan 06
          </p>
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
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
