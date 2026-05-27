'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

const STORAGE_KEY = 'kinship-dashboard-card-order'

interface CardDef {
  id: string
  visible: boolean
  node: ReactNode
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md text-kinship-placeholder opacity-0 group-hover:opacity-100 hover:bg-kinship-surface-container hover:text-kinship-on-surface-variant transition-all cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  )
}

export function SortableCardGrid({ cards }: { cards: CardDef[] }) {
  const visibleCards = cards.filter((c) => c.visible)
  const visibleIds = visibleCards.map((c) => c.id)

  const [orderedIds, setOrderedIds] = useState<string[]>(visibleIds)

  // Load saved order from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as string[]
        // Merge: keep saved order for cards that are still visible, append new ones at end
        const ordered: string[] = []
        for (const id of parsed) {
          if (visibleIds.includes(id)) ordered.push(id)
        }
        for (const id of visibleIds) {
          if (!ordered.includes(id)) ordered.push(id)
        }
        setOrderedIds(ordered)
      } else {
        setOrderedIds(visibleIds)
      }
    } catch {
      setOrderedIds(visibleIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.join(',')])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedIds((prev) => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        const next = arrayMove(prev, oldIndex, newIndex)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    }
  }

  const cardMap = new Map(visibleCards.map((c) => [c.id, c]))
  const sortedCards = orderedIds.map((id) => cardMap.get(id)).filter(Boolean) as CardDef[]

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {sortedCards.map((card) => (
            <SortableCard key={card.id} id={card.id}>
              {card.node}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
