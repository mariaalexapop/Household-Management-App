'use client'

import { useState, useMemo } from 'react'
import { format, isToday, isBefore, parseISO, startOfDay, differenceInCalendarDays, addDays } from 'date-fns'
import { Check, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ModuleKey } from '@/stores/onboarding'

/* ── Module colors ───────────────────────────────────────────── */
const MOD: Record<ModuleKey, { dot: string; light: string; dark: string }> = {
  chores:      { dot: '#187574', light: '#c3faf5', dark: '#187574' },
  kids:        { dot: '#e05252', light: '#ffc6c6', dark: '#600000' },
  car:         { dot: '#c67d2a', light: '#ffe6cd', dark: '#7a4000' },
  insurance:   { dot: '#6a55d9', light: '#d9d4ff', dark: '#3d2a8a' },
  electronics: { dot: '#3f9b3f', light: '#d4f5c3', dark: '#1f5c1f' },
}

/* ── Types ───────────────────────────────────────────────────── */
interface TimelineRow {
  id: string
  day: string
  when?: string
  title: string
  module: ModuleKey
  whoInitials?: string
  whoColor?: string
  amount?: string
  isOverdue?: boolean
  lateDays?: string
  isDone?: boolean
  sortKey: number
}

interface SerializedMember {
  id: string; displayName: string | null; avatarUrl: string | null; userId: string
}

interface Props {
  activeModules: ModuleKey[]
  tasks: { id: string; title: string; areaName: string | null; startsAt: string | null; ownerId: string | null; status: string }[]
  activities: { id: string; title: string; childName: string | null; childId: string | null; startsAt: string | null; assigneeId: string | null }[]
  cars: { id: string; make: string; model: string; motDueDate: string | null; taxDueDate: string | null; nextServiceDate: string | null }[]
  policies: { id: string; insurer: string; policyType: string; expiryDate: string | null; nextPaymentDate: string | null; premiumCents: number | null; paymentSchedule: string | null }[]
  electronics: { id: string; name: string; warrantyExpiryDate: string | null }[]
  members: SerializedMember[]
  weekStartIso: string
  weekEndIso: string
  nextWeekEndIso: string
}

/* ── Helpers ─────────────────────────────────────────────────── */
function memberInitials(members: SerializedMember[], memberId: string | null): { initials: string; color: string } | null {
  if (!memberId) return null
  const m = members.find((x) => x.id === memberId)
  if (!m || !m.displayName) return null
  const initials = m.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  // Stable color from name
  let hash = 0
  for (const c of m.displayName) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0
  const colors = ['#e05252', '#5b76fe', '#187574', '#c67d2a', '#6a55d9', '#b34a9c', '#3f9b3f']
  return { initials, color: colors[Math.abs(hash) % colors.length] }
}

function dayLabel(dateStr: string, weekStart: Date): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  return format(d, 'EEE')
}

function timeLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  const h = d.getHours()
  const m = d.getMinutes()
  if (h === 0 && m === 0) return ''
  return format(d, 'h:mma').toLowerCase()
}

/* ── Main component ──────────────────────────────────────────── */
export function DashboardTimeline({
  activeModules, tasks, activities, cars, policies, electronics, members,
  weekStartIso, weekEndIso, nextWeekEndIso,
}: Props) {
  const weekStart = parseISO(weekStartIso)
  const weekEnd = parseISO(weekEndIso)
  const now = new Date()

  // Build unified timeline rows
  const { overdue, thisWeek, nextWeek } = useMemo(() => {
    const rows: TimelineRow[] = []

    // Tasks
    for (const t of tasks) {
      if (!t.startsAt) continue
      const d = parseISO(t.startsAt)
      const before = isBefore(startOfDay(d), startOfDay(weekStart))
      const isOv = before && t.status !== 'done'
      const who = memberInitials(members, t.ownerId)
      rows.push({
        id: `task-${t.id}`,
        day: isOv ? format(d, 'MMM d') : dayLabel(t.startsAt, weekStart),
        when: timeLabel(t.startsAt),
        title: t.title,
        module: 'chores',
        whoInitials: who?.initials,
        whoColor: who?.color,
        isOverdue: isOv,
        lateDays: isOv ? `${differenceInCalendarDays(now, d)}d late` : undefined,
        isDone: t.status === 'done',
        sortKey: d.getTime(),
      })
    }

    // Activities
    for (const a of activities) {
      if (!a.startsAt) continue
      const d = parseISO(a.startsAt)
      const label = a.childName ? `${a.childName} — ${a.title}` : a.title
      const who = memberInitials(members, a.assigneeId)
      rows.push({
        id: `act-${a.id}`,
        day: dayLabel(a.startsAt, weekStart),
        when: timeLabel(a.startsAt),
        title: label,
        module: 'kids',
        whoInitials: who?.initials,
        whoColor: who?.color,
        sortKey: d.getTime(),
      })
    }

    // Car deadlines
    for (const c of cars) {
      const deadlines = [
        { date: c.motDueDate, label: `MOT — ${c.make} ${c.model}` },
        { date: c.taxDueDate, label: `Tax — ${c.make} ${c.model}` },
        { date: c.nextServiceDate, label: `Service — ${c.make} ${c.model}` },
      ]
      for (const dl of deadlines) {
        if (!dl.date) continue
        const d = parseISO(dl.date)
        if (d < weekStart || d >= parseISO(nextWeekEndIso)) continue
        rows.push({
          id: `car-${c.id}-${dl.label}`,
          day: dayLabel(dl.date, weekStart),
          when: '',
          title: dl.label,
          module: 'car',
          sortKey: d.getTime(),
        })
      }
    }

    // Insurance deadlines
    for (const p of policies) {
      const dates = [
        { date: p.expiryDate, label: `${p.insurer} — ${p.policyType} expiry` },
        { date: p.nextPaymentDate, label: `${p.insurer} — payment due` },
      ]
      for (const dl of dates) {
        if (!dl.date) continue
        const d = parseISO(dl.date)
        if (d < weekStart || d >= parseISO(nextWeekEndIso)) continue
        rows.push({
          id: `ins-${p.id}-${dl.label}`,
          day: dayLabel(dl.date, weekStart),
          when: '',
          title: dl.label,
          module: 'insurance',
          sortKey: d.getTime(),
        })
      }
    }

    // Split into sections
    const overdue = rows.filter((r) => r.isOverdue).sort((a, b) => a.sortKey - b.sortKey)
    const thisWeek = rows
      .filter((r) => !r.isOverdue && r.sortKey >= weekStart.getTime() && r.sortKey < weekEnd.getTime())
      .sort((a, b) => a.sortKey - b.sortKey)
    const nextWeek = rows
      .filter((r) => !r.isOverdue && r.sortKey >= weekEnd.getTime())
      .sort((a, b) => a.sortKey - b.sortKey)

    return { overdue, thisWeek, nextWeek }
  }, [tasks, activities, cars, policies, weekStart, weekEnd, nextWeekEndIso, members, now])

  // Done toggle state
  const [doneSet, setDoneSet] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const r of [...overdue, ...thisWeek, ...nextWeek]) {
      if (r.isDone) s.add(r.id)
    }
    return s
  })
  const toggleDone = (id: string) => setDoneSet((s) => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  // Money pulse — upcoming payments from policies
  const upcomingPayments = useMemo(() => {
    const items: { date: string; title: string; sub: string; amount: number; module: ModuleKey }[] = []
    for (const p of policies) {
      if (p.nextPaymentDate && p.premiumCents) {
        const d = parseISO(p.nextPaymentDate)
        if (d >= now && d <= new Date(now.getTime() + 30 * 86400000)) {
          items.push({
            date: format(d, 'MMM d'),
            title: p.insurer,
            sub: `${p.policyType} ${p.paymentSchedule ?? 'payment'}`,
            amount: p.premiumCents,
            module: 'insurance',
          })
        }
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [policies, now])
  const paymentTotal = upcomingPayments.reduce((s, x) => s + x.amount, 0)

  // Find next event after this+next week for tail text
  const allDates = [...thisWeek, ...nextWeek].map((r) => r.sortKey)
  const lastEvent = allDates.length > 0 ? new Date(Math.max(...allDates)) : null
  const tailText = thisWeek.length === 0 && nextWeek.length === 0
    ? 'Nothing scheduled. Enjoy the calm.'
    : null

  const weekRange = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'd')}`
  const nextWeekRange = `${format(weekEnd, 'MMM d')} – ${format(addDays(weekEnd, 6), 'MMM d')}`

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* LEFT — unified action list */}
      <div className="flex flex-col gap-7 lg:flex-[1.7]">

        {/* THIS WEEK */}
        <section>
          <SectionHead title="This week" dateRange={weekRange} />

          {overdue.length > 0 && (
            <div className="mt-3 mb-1">
              <div className="font-display text-[11.5px] font-bold uppercase tracking-wider text-amber-600">
                Overdue · {overdue.length}
              </div>
              {overdue.map((r) => (
                <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r.id)} />
              ))}
            </div>
          )}

          <div className={overdue.length > 0 ? 'mt-4' : 'mt-2'}>
            {thisWeek.length === 0 && overdue.length === 0 ? (
              <p className="py-4 font-body text-sm text-kinship-on-surface-variant italic">
                Nothing scheduled this week.
              </p>
            ) : (
              thisWeek.map((r) => (
                <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r.id)} />
              ))
            )}
          </div>
        </section>

        {/* NEXT WEEK */}
        {nextWeek.length > 0 && (
          <section>
            <SectionHead title="Next week" dateRange={nextWeekRange} muted />
            <div className="mt-2">
              {nextWeek.map((r) => (
                <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r.id)} muted />
              ))}
            </div>
            {tailText && (
              <p className="pt-3 font-body text-[13px] text-kinship-placeholder italic">{tailText}</p>
            )}
          </section>
        )}

        {tailText && nextWeek.length === 0 && (
          <p className="font-body text-[13px] text-kinship-placeholder italic">{tailText}</p>
        )}
      </div>

      {/* RIGHT — snapshots */}
      <div className="flex flex-col gap-4 lg:flex-1">
        {/* Balance widget */}
        <BalanceWidget tasks={tasks} members={members} />

        {/* Money pulse */}
        {upcomingPayments.length > 0 && (
          <MoneyPulseCard payments={upcomingPayments} total={paymentTotal} />
        )}
      </div>
    </div>
  )
}

/* ── Section header ──────────────────────────────────────────── */
function SectionHead({ title, dateRange, muted }: { title: string; dateRange: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-kinship-surface-container pb-2">
      <h2 className={`font-display font-semibold tracking-tight ${muted ? 'text-[16px] text-kinship-on-surface-variant' : 'text-[20px] text-kinship-on-surface'}`}>
        {title}
      </h2>
      <span className="font-mono text-[11.5px] tracking-wide text-kinship-placeholder">{dateRange}</span>
    </div>
  )
}

/* ── Action row ──────────────────────────────────────────────── */
function ActionRow({ row, done, onToggle, muted }: { row: TimelineRow; done: boolean; onToggle: () => void; muted?: boolean }) {
  return (
    <div
      className="grid items-center gap-3 border-t border-kinship-surface-container py-3"
      style={{
        gridTemplateColumns: '24px 60px 52px 1fr auto',
        opacity: done ? 0.5 : muted ? 0.85 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
          done
            ? 'bg-kinship-success text-white'
            : 'ring-[1.5px] ring-inset ring-kinship-on-surface-variant/30 hover:ring-kinship-primary'
        }`}
      >
        {done && <Check className="h-3 w-3" />}
      </button>

      {/* Day */}
      <span className={`font-display text-[13.5px] font-semibold ${
        row.isOverdue ? 'text-amber-600' : isToday(new Date()) && row.day === 'Today' ? 'text-kinship-primary' : 'text-kinship-on-surface'
      } ${done ? 'line-through' : ''}`}>
        {row.day}
      </span>

      {/* Time */}
      <span className="font-mono text-[11.5px] text-kinship-placeholder">{row.when || ''}</span>

      {/* Title + dot */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="h-[7px] w-[7px] shrink-0 rounded-full"
          style={{ backgroundColor: MOD[row.module]?.dot ?? '#999' }}
        />
        <span className={`truncate font-body text-[14.5px] font-medium text-kinship-on-surface ${done ? 'line-through' : ''} ${muted ? 'text-[13.5px]' : ''}`}>
          {row.title}
        </span>
        {done && <span className="shrink-0 text-[10.5px] font-semibold text-kinship-success tracking-wide">done</span>}
        {row.isOverdue && row.lateDays && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
            {row.lateDays}
          </span>
        )}
      </div>

      {/* Avatar / amount */}
      <div className="flex items-center gap-2.5 justify-end">
        {row.amount && <span className="font-mono text-[13.5px] font-medium text-kinship-on-surface">{row.amount}</span>}
        {row.whoInitials && (
          <div
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: row.whoColor ?? '#999' }}
          >
            {row.whoInitials}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Balance widget ──────────────────────────────────────────── */
function BalanceWidget({ tasks, members }: {
  tasks: { ownerId: string | null; status: string }[]
  members: SerializedMember[]
}) {
  // Count tasks per member
  const counts = new Map<string, number>()
  for (const t of tasks) {
    if (t.ownerId) counts.set(t.ownerId, (counts.get(t.ownerId) ?? 0) + 1)
  }
  const total = tasks.length || 1
  const bars = members
    .map((m) => ({
      name: m.displayName?.split(' ')[0] ?? '?',
      pct: Math.round(((counts.get(m.id) ?? 0) / total) * 100),
      color: memberInitials([m], m.id)?.color ?? '#999',
    }))
    .filter((b) => b.pct > 0)
    .sort((a, b) => b.pct - a.pct)

  if (bars.length === 0) return null

  const top = bars[0]

  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-2 w-24 shrink-0 overflow-hidden rounded-full ring-1 ring-kinship-surface-container">
          {bars.map((b, i) => (
            <div key={i} style={{ width: `${b.pct}%`, backgroundColor: b.color }} className="h-full" />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[13px] text-kinship-on-surface leading-snug">
            <strong>{top.name}</strong> is holding <strong>{top.pct}%</strong> this week.
          </p>
          {bars.length > 1 && (
            <Link href="/settings/household" className="font-body text-[12px] font-semibold text-kinship-primary mt-0.5 flex items-center gap-0.5">
              See balance <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Money pulse ─────────────────────────────────────────────── */
function MoneyPulseCard({ payments, total }: {
  payments: { date: string; title: string; sub: string; amount: number; module: ModuleKey }[]
  total: number
}) {
  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-4 py-3">
        <TrendingUp className="h-[15px] w-[15px] text-kinship-on-surface" />
        <span className="font-display text-[14px] font-semibold text-kinship-on-surface">Money pulse</span>
        <div className="flex-1" />
        <span className="font-body text-[11px] text-kinship-placeholder">next 30 days</span>
      </div>

      {/* Coming out */}
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-body text-[10.5px] font-bold uppercase tracking-wider text-kinship-placeholder">Coming out</span>
          <span className="font-mono text-[11px] text-kinship-placeholder">{payments.length} charges</span>
        </div>
        {payments.map((p, i) => (
          <div
            key={i}
            className={`grid items-center gap-2.5 py-2 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}
            style={{ gridTemplateColumns: '52px 1fr auto' }}
          >
            <span className="font-mono text-[11px] text-kinship-placeholder">{p.date}</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: MOD[p.module]?.dot ?? '#999' }} />
              <div className="min-w-0">
                <div className="font-body text-[12.5px] font-medium text-kinship-on-surface truncate">{p.title}</div>
                <div className="font-body text-[10.5px] text-kinship-placeholder">{p.sub}</div>
              </div>
            </div>
            <span className="font-mono text-[13px] font-semibold text-kinship-on-surface">
              €{(p.amount / 100).toFixed(0)}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="mt-3 flex items-baseline gap-2 rounded-xl bg-kinship-surface p-3">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-kinship-on-surface-variant">Estimated total</span>
          <div className="flex-1" />
          <span className="font-display text-[20px] font-semibold text-kinship-on-surface">€{(total / 100).toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
