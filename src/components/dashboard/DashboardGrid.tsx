'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, X, CheckSquare, CalendarHeart, Car, Shield, Monitor } from 'lucide-react'
import { EmptyModuleState } from './EmptyModuleState'
import { ChoresDashboardCard } from './ChoresDashboardCard'
import type { UpcomingTask } from './ChoresDashboardCard'
import { KidsDashboardCard } from './KidsDashboardCard'
import type { UpcomingActivity } from './KidsDashboardCard'
import { CarDashboardCard } from './CarDashboardCard'
import type { UpcomingCar } from './CarDashboardCard'
import { InsuranceDashboardCard } from './InsuranceDashboardCard'
import type { UpcomingPolicy } from './InsuranceDashboardCard'
import { ElectronicsDashboardCard } from './ElectronicsDashboardCard'
import type { UpcomingElectronic } from './ElectronicsDashboardCard'
import { WeekStrip } from './WeekStrip'
import type { WeekEvent } from './WeekStrip'
import { AiPinnedCard } from './AiPinnedCard'
import { ComingUpTimeline } from './ComingUpTimeline'
import type { TimelineItem } from './ComingUpTimeline'
import type { ModuleKey } from '@/stores/onboarding'

interface DashboardGridProps {
  activeModules: ModuleKey[]
  upcomingTasks: UpcomingTask[]
  upcomingActivities: UpcomingActivity[]
  upcomingCars: UpcomingCar[]
  upcomingPolicies: UpcomingPolicy[]
  upcomingElectronics: UpcomingElectronic[]
}

/** Check if a Date falls on a given YYYY-MM-DD string */
function matchesDate(d: Date | string | null | undefined, dateStr: string): boolean {
  if (!d) return false
  const iso = typeof d === 'string' ? d : d.toISOString()
  return iso.slice(0, 10) === dateStr
}

/** Build week-strip dot events from all data sources */
function buildWeekEvents(
  activeModules: ModuleKey[],
  tasks: UpcomingTask[],
  activities: UpcomingActivity[],
  cars: UpcomingCar[],
  policies: UpcomingPolicy[],
): WeekEvent[] {
  const events: WeekEvent[] = []

  if (activeModules.includes('chores')) {
    for (const t of tasks) {
      if (t.startsAt) events.push({ date: new Date(t.startsAt).toISOString(), module: 'chores' })
    }
  }
  if (activeModules.includes('kids')) {
    for (const a of activities) {
      if (a.startsAt) events.push({ date: new Date(a.startsAt).toISOString(), module: 'kids' })
    }
  }
  if (activeModules.includes('car')) {
    for (const c of cars) {
      if (c.motDueDate) events.push({ date: new Date(c.motDueDate).toISOString(), module: 'car' })
      if (c.taxDueDate) events.push({ date: new Date(c.taxDueDate).toISOString(), module: 'car' })
      if (c.nextServiceDate) events.push({ date: new Date(c.nextServiceDate).toISOString(), module: 'car' })
    }
  }
  if (activeModules.includes('insurance')) {
    for (const p of policies) {
      if (p.expiryDate) events.push({ date: new Date(p.expiryDate).toISOString(), module: 'insurance' })
    }
  }
  return events
}

/** Build cross-module timeline items */
function buildTimeline(
  activeModules: ModuleKey[],
  tasks: UpcomingTask[],
  activities: UpcomingActivity[],
  cars: UpcomingCar[],
  policies: UpcomingPolicy[],
  electronics: UpcomingElectronic[],
): TimelineItem[] {
  const items: TimelineItem[] = []
  const now = new Date()

  if (activeModules.includes('chores')) {
    for (const t of tasks) {
      if (t.startsAt) {
        items.push({ id: t.id, title: t.title, date: new Date(t.startsAt), module: 'chores' })
      }
    }
  }
  if (activeModules.includes('kids')) {
    for (const a of activities) {
      if (a.startsAt) {
        items.push({ id: a.id, title: a.title, date: new Date(a.startsAt), module: 'kids' })
      }
    }
  }
  if (activeModules.includes('car')) {
    for (const c of cars) {
      if (c.motDueDate && new Date(c.motDueDate) >= now) {
        items.push({ id: `${c.id}-mot`, title: `MOT: ${c.make} ${c.model}`, date: new Date(c.motDueDate), module: 'car' })
      }
      if (c.taxDueDate && new Date(c.taxDueDate) >= now) {
        items.push({ id: `${c.id}-tax`, title: `Tax: ${c.make} ${c.model}`, date: new Date(c.taxDueDate), module: 'car' })
      }
      if (c.nextServiceDate && new Date(c.nextServiceDate) >= now) {
        items.push({ id: `${c.id}-svc`, title: `Service: ${c.make} ${c.model}`, date: new Date(c.nextServiceDate), module: 'car' })
      }
    }
  }
  if (activeModules.includes('insurance')) {
    for (const p of policies) {
      if (p.expiryDate && new Date(p.expiryDate) >= now) {
        items.push({ id: p.id, title: `${p.insurer} ${p.policyType} expiry`, date: new Date(p.expiryDate), module: 'insurance' })
      }
    }
  }
  if (activeModules.includes('electronics')) {
    for (const e of electronics) {
      if (e.warrantyExpiryDate && new Date(e.warrantyExpiryDate) >= now) {
        items.push({ id: e.id, title: `${e.name} warranty`, date: new Date(e.warrantyExpiryDate), module: 'electronics' })
      }
    }
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8)
}

const ADD_OPTIONS: { moduleKey: ModuleKey; label: string; href: string; icon: typeof CheckSquare; bg: string; text: string }[] = [
  { moduleKey: 'chores', label: 'Add Task', href: '/chores?action=new', icon: CheckSquare, bg: 'bg-[#c3faf5]', text: 'text-[#187574]' },
  { moduleKey: 'kids', label: 'Add Activity', href: '/kids?action=new', icon: CalendarHeart, bg: 'bg-[#ffc6c6]', text: 'text-[#600000]' },
  { moduleKey: 'car', label: 'Add Car', href: '/cars?action=new', icon: Car, bg: 'bg-[#ffe6cd]', text: 'text-[#7a4000]' },
  { moduleKey: 'insurance', label: 'Add Policy', href: '/insurance?action=new', icon: Shield, bg: 'bg-[#d9d4ff]', text: 'text-[#3d2a8a]' },
  { moduleKey: 'electronics', label: 'Add Item', href: '/electronics?action=new', icon: Monitor, bg: 'bg-[#d4f5c3]', text: 'text-[#1f5c1f]' },
]

export function DashboardGrid({
  activeModules,
  upcomingTasks,
  upcomingActivities,
  upcomingCars,
  upcomingPolicies,
  upcomingElectronics,
}: DashboardGridProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close add menu on outside click or Escape
  useEffect(() => {
    if (!addMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [addMenuOpen])

  const visibleAddOptions = ADD_OPTIONS.filter((o) => activeModules.includes(o.moduleKey))

  if (activeModules.length === 0) {
    return <EmptyModuleState />
  }

  const weekEvents = buildWeekEvents(activeModules, upcomingTasks, upcomingActivities, upcomingCars, upcomingPolicies)
  const timelineItems = buildTimeline(activeModules, upcomingTasks, upcomingActivities, upcomingCars, upcomingPolicies, upcomingElectronics)

  // Filter data when a date is selected
  const filteredTasks = selectedDate
    ? upcomingTasks.filter((t) => matchesDate(t.startsAt, selectedDate))
    : upcomingTasks

  const filteredActivities = selectedDate
    ? upcomingActivities.filter((a) => matchesDate(a.startsAt, selectedDate))
    : upcomingActivities

  const filteredCars = selectedDate
    ? upcomingCars.filter((c) =>
        matchesDate(c.motDueDate, selectedDate) ||
        matchesDate(c.taxDueDate, selectedDate) ||
        matchesDate(c.nextServiceDate, selectedDate)
      )
    : upcomingCars

  const filteredPolicies = selectedDate
    ? upcomingPolicies.filter((p) =>
        matchesDate(p.expiryDate, selectedDate) ||
        matchesDate(p.nextPaymentDate, selectedDate)
      )
    : upcomingPolicies

  const filteredElectronics = selectedDate
    ? upcomingElectronics.filter((e) => matchesDate(e.warrantyExpiryDate, selectedDate))
    : upcomingElectronics

  const filteredTimeline = selectedDate
    ? timelineItems.filter((item) => format(item.date, 'yyyy-MM-dd') === selectedDate)
    : timelineItems

  /* Collect the module cards that are active AND have data (when filtered) */
  const moduleCards: React.ReactNode[] = []
  if (activeModules.includes('chores') && (!selectedDate || filteredTasks.length > 0)) {
    moduleCards.push(<ChoresDashboardCard key="chores" tasks={filteredTasks} />)
  }
  if (activeModules.includes('kids') && (!selectedDate || filteredActivities.length > 0)) {
    moduleCards.push(<KidsDashboardCard key="kids" activities={filteredActivities} />)
  }
  if (activeModules.includes('car') && (!selectedDate || filteredCars.length > 0)) {
    moduleCards.push(<CarDashboardCard key="car" cars={filteredCars} />)
  }
  if (activeModules.includes('insurance') && (!selectedDate || filteredPolicies.length > 0)) {
    moduleCards.push(<InsuranceDashboardCard key="insurance" policies={filteredPolicies} />)
  }
  if (activeModules.includes('electronics') && (!selectedDate || filteredElectronics.length > 0)) {
    moduleCards.push(<ElectronicsDashboardCard key="electronics" items={filteredElectronics} />)
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Left column (~60%) */}
      <div className="flex flex-col gap-4 lg:w-[60%]">
        <WeekStrip events={weekEvents} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        {selectedDate && moduleCards.length === 0 ? (
          <div className="rounded-2xl bg-white ring-miro p-6 text-center">
            <p className="font-body text-sm text-kinship-on-surface-variant">
              Nothing scheduled for {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, d MMMM')}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {moduleCards}
          </div>
        )}
      </div>

      {/* Right column (~40%) */}
      <div className="flex flex-col gap-4 lg:w-[40%]">
        <AiPinnedCard />

        {/* Electronics warranty watch — show in right column if active */}
        {!selectedDate && activeModules.includes('electronics') && upcomingElectronics.length > 0 && (
          <div className="bg-white rounded-2xl ring-miro overflow-hidden">
            <div className="bg-[#d4f5c3] px-3.5 py-2.5 flex items-center gap-2 text-[#1f5c1f]">
              <span className="font-display font-semibold text-[13px]">Warranty watch</span>
            </div>
            <div className="px-3.5 py-2.5">
              <ul className="flex flex-col">
                {upcomingElectronics
                  .filter((e) => e.warrantyExpiryDate)
                  .sort((a, b) => new Date(a.warrantyExpiryDate!).getTime() - new Date(b.warrantyExpiryDate!).getTime())
                  .slice(0, 3)
                  .map((item) => {
                    const days = Math.ceil(
                      (new Date(item.warrantyExpiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="font-body text-sm text-kinship-on-surface truncate">
                          {item.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-px font-body text-[10px] font-semibold shrink-0 ${
                            days <= 0
                              ? 'bg-red-100 text-red-700'
                              : days <= 30
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-[#d4f5c3] text-[#1f5c1f]'
                          }`}
                        >
                          {days <= 0 ? 'Expired' : `${days}d left`}
                        </span>
                      </li>
                    )
                  })}
              </ul>
            </div>
          </div>
        )}

        <ComingUpTimeline items={filteredTimeline} />
      </div>

      {/* Floating add button with category picker */}
      {visibleAddOptions.length > 0 && (
        <div className="fixed bottom-20 right-4 z-30 md:hidden" ref={addMenuRef}>
          {/* Category menu */}
          {addMenuOpen && (
            <div className="absolute bottom-16 right-0 mb-2 w-52 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2">
              <p className="px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-wider text-kinship-placeholder">
                Add new
              </p>
              {visibleAddOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.moduleKey}
                    onClick={() => {
                      setAddMenuOpen(false)
                      router.push(option.href)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-kinship-surface-container`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${option.bg}`}>
                      <Icon className={`h-4 w-4 ${option.text}`} />
                    </div>
                    <span className="font-body text-[13px] font-medium text-kinship-on-surface">
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* FAB */}
          <button
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            aria-label="Add new item"
            className={`flex h-14 w-14 items-center justify-center rounded-full bg-kinship-primary text-white shadow-lg transition-transform active:scale-95 ${addMenuOpen ? 'rotate-45' : ''}`}
          >
            {addMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
      )}
    </div>
  )
}
