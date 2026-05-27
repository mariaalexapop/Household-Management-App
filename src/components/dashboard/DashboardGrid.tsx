'use client'

import { useState } from 'react'
import { format } from 'date-fns'
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

export function DashboardGrid({
  activeModules,
  upcomingTasks,
  upcomingActivities,
  upcomingCars,
  upcomingPolicies,
  upcomingElectronics,
}: DashboardGridProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
    </div>
  )
}
