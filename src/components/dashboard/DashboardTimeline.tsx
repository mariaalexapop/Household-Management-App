'use client'

import { useState, useMemo, useTransition } from 'react'
import { format, isToday, isTomorrow, isBefore, parseISO, startOfDay, differenceInCalendarDays, addDays } from 'date-fns'
import { Check, TrendingUp, ChevronRight, Upload, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateTaskStatus } from '@/app/actions/tasks'
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
  realId?: string
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
  isTask?: boolean
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
  let hash = 0
  for (const c of m.displayName) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0
  const colors = ['#e05252', '#5b76fe', '#187574', '#c67d2a', '#6a55d9', '#b34a9c', '#3f9b3f']
  return { initials, color: colors[Math.abs(hash) % colors.length] }
}

function dayLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE d')
}

function timeLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (d.getHours() === 0 && d.getMinutes() === 0) return ''
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { overdue, thisWeek, nextWeek } = useMemo(() => {
    const rows: TimelineRow[] = []

    for (const t of tasks) {
      if (!t.startsAt) continue
      const d = parseISO(t.startsAt)
      const before = isBefore(startOfDay(d), startOfDay(weekStart))
      const isOv = before && t.status !== 'done'
      const who = memberInitials(members, t.ownerId)
      rows.push({
        id: `task-${t.id}`, realId: t.id,
        day: isOv ? format(d, 'MMM d') : dayLabel(t.startsAt),
        when: timeLabel(t.startsAt), title: t.title, module: 'chores',
        whoInitials: who?.initials, whoColor: who?.color,
        isOverdue: isOv,
        lateDays: isOv ? `${differenceInCalendarDays(now, d)}d late` : undefined,
        isDone: t.status === 'done', isTask: true, sortKey: d.getTime(),
      })
    }

    for (const a of activities) {
      if (!a.startsAt) continue
      const d = parseISO(a.startsAt)
      const label = a.childName ? `${a.childName} — ${a.title}` : a.title
      const who = memberInitials(members, a.assigneeId)
      rows.push({
        id: `act-${a.id}`, day: dayLabel(a.startsAt), when: timeLabel(a.startsAt),
        title: label, module: 'kids', whoInitials: who?.initials, whoColor: who?.color,
        sortKey: d.getTime(),
      })
    }

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
          id: `car-${c.id}-${dl.label}`, day: dayLabel(dl.date), when: '',
          title: dl.label, module: 'car', sortKey: d.getTime(),
        })
      }
    }

    for (const p of policies) {
      const dates = [
        { date: p.expiryDate, label: `${p.insurer} — ${p.policyType} expiry`, amount: undefined as string | undefined },
        { date: p.nextPaymentDate, label: `${p.insurer} — payment due`, amount: p.premiumCents ? `€${(p.premiumCents / 100).toFixed(2)}` : undefined },
      ]
      for (const dl of dates) {
        if (!dl.date) continue
        const d = parseISO(dl.date)
        if (d < weekStart || d >= parseISO(nextWeekEndIso)) continue
        rows.push({
          id: `ins-${p.id}-${dl.label}`, day: dayLabel(dl.date), when: '',
          title: dl.label, module: 'insurance', amount: dl.amount, sortKey: d.getTime(),
        })
      }
    }

    return {
      overdue: rows.filter((r) => r.isOverdue).sort((a, b) => a.sortKey - b.sortKey),
      thisWeek: rows.filter((r) => !r.isOverdue && r.sortKey >= weekStart.getTime() && r.sortKey < weekEnd.getTime()).sort((a, b) => a.sortKey - b.sortKey),
      nextWeek: rows.filter((r) => !r.isOverdue && r.sortKey >= weekEnd.getTime()).sort((a, b) => a.sortKey - b.sortKey),
    }
  }, [tasks, activities, cars, policies, weekStart, weekEnd, nextWeekEndIso, members, now])

  // Done toggle — persists to DB for tasks
  const [doneSet, setDoneSet] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const r of [...overdue, ...thisWeek, ...nextWeek]) { if (r.isDone) s.add(r.id) }
    return s
  })
  const toggleDone = (row: TimelineRow) => {
    const newDone = !doneSet.has(row.id)
    setDoneSet((s) => { const n = new Set(s); newDone ? n.add(row.id) : n.delete(row.id); return n })
    if (row.isTask && row.realId) {
      startTransition(async () => {
        await updateTaskStatus({ id: row.realId!, status: newDone ? 'done' : 'todo' })
        router.refresh()
      })
    }
  }

  // Money pulse
  const upcomingPayments = useMemo(() => {
    const items: { date: string; title: string; sub: string; amount: number; module: ModuleKey }[] = []
    for (const p of policies) {
      if (p.nextPaymentDate && p.premiumCents) {
        const d = parseISO(p.nextPaymentDate)
        if (d >= now && d <= new Date(now.getTime() + 30 * 86400000)) {
          items.push({
            date: format(d, 'MMM d'), title: p.insurer,
            sub: `${p.policyType} ${p.paymentSchedule ?? 'payment'}`,
            amount: p.premiumCents, module: 'insurance',
          })
        }
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [policies, now])
  const paymentTotal = upcomingPayments.reduce((s, x) => s + x.amount, 0)

  // Balance — tasks per member
  const balance = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tasks) { if (t.ownerId) counts.set(t.ownerId, (counts.get(t.ownerId) ?? 0) + 1) }
    const total = tasks.length || 1
    return members
      .map((m) => {
        const count = counts.get(m.id) ?? 0
        return {
          id: m.id, name: m.displayName?.split(' ')[0] ?? '?',
          pct: Math.round((count / total) * 100),
          color: memberInitials([m], m.id)?.color ?? '#999', count,
        }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [tasks, members])
  const topMember = balance[0]
  const othersWithLess = balance.filter((b) => b.pct > 0 && b.id !== topMember?.id)

  const weekRange = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'd')}`
  const nextWeekRange = `${format(weekEnd, 'MMM d')} – ${format(addDays(weekEnd, 6), 'MMM d')}`

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* LEFT — action list */}
      <div className="flex flex-col gap-6 lg:flex-[1.7] min-w-0">

        {/* Inbox banner */}
        <Link href="/notifications"
          className="flex items-center gap-2.5 rounded-xl bg-kinship-primary-surface px-3.5 py-2.5 text-kinship-primary transition-colors hover:bg-kinship-primary/10">
          <Upload className="h-[14px] w-[14px] shrink-0" />
          <span className="font-body text-[12.5px] font-medium">
            Drop a receipt, photo or PDF — Kinship files it for you.
          </span>
          <span className="flex-1" />
          <span className="rounded-full bg-white/70 px-2.5 py-1 font-body text-[11px] font-semibold text-kinship-primary">+ Add</span>
        </Link>

        {/* THIS WEEK */}
        <section>
          <SectionHead title="This week" dateRange={weekRange} />
          {overdue.length > 0 && (
            <div className="mt-2.5">
              <div className="font-display text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">
                Overdue · {overdue.length}
              </div>
              {overdue.map((r) => (
                <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} />
              ))}
            </div>
          )}
          <div className={overdue.length > 0 ? 'mt-3' : 'mt-1'}>
            {thisWeek.length === 0 && overdue.length === 0 ? (
              <p className="py-3 font-body text-sm text-kinship-on-surface-variant italic">Nothing scheduled this week.</p>
            ) : (
              thisWeek.map((r) => (
                <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} />
              ))
            )}
          </div>
        </section>

        {/* NEXT WEEK — always show heading */}
        <section>
          <SectionHead title="Next week" dateRange={nextWeekRange} muted />
          <div className="mt-1">
            {nextWeek.length === 0 ? (
              <p className="py-3 font-body text-[13px] text-kinship-placeholder italic">Nothing scheduled. Enjoy the calm.</p>
            ) : (
              nextWeek.map((r) => (
                <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} muted />
              ))
            )}
          </div>
        </section>
      </div>

      {/* RIGHT — snapshots */}
      <div className="flex flex-col gap-4 lg:flex-1">
        {/* Household balance */}
        {topMember && topMember.pct > 0 && (
          <BalanceCard topMember={topMember} others={othersWithLess} bars={balance.filter((b) => b.pct > 0)} />
        )}

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
    <div className="flex items-baseline gap-3 border-b border-kinship-surface-container pb-1.5">
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
      className="grid items-center gap-x-3.5 border-t border-kinship-surface-container"
      style={{
        gridTemplateColumns: '24px 72px 62px 1fr auto',
        padding: '12px 0',
        opacity: done ? 0.55 : muted ? 0.92 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        style={{
          width: 20, height: 20, padding: 0, border: 'none', borderRadius: 10, cursor: 'pointer',
          background: done ? '#00b473' : 'transparent',
          boxShadow: done ? 'none' : 'inset 0 0 0 1.5px #b0b3c0',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .12s, box-shadow .12s',
        }}
      >
        {done && <Check className="h-3 w-3" />}
      </button>

      {/* Day + date */}
      <span className={`font-display text-[13.5px] font-semibold ${
        row.isOverdue ? 'text-amber-600' : (row.day === 'Today' || row.day === 'Tomorrow') ? 'text-kinship-primary' : 'text-kinship-on-surface'
      } ${done ? 'line-through' : ''}`}>
        {row.day}
      </span>

      {/* Time */}
      <span className="font-mono text-[11.5px] text-kinship-placeholder">{row.when || ''}</span>

      {/* Module dot + title + badges */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: MOD[row.module]?.dot ?? '#999' }} />
        <span className={`truncate text-kinship-on-surface ${done ? 'line-through' : ''} ${muted ? 'text-[13.5px]' : 'text-[14.5px]'}`}
          style={{ fontWeight: 500 }}>
          {row.title}
        </span>
        {done && <span className="shrink-0 text-[10.5px] font-semibold tracking-wide" style={{ color: '#00b473' }}>done</span>}
        {row.isOverdue && row.lateDays && (
          <span className="shrink-0 rounded-full px-[7px] py-[2px] text-[10px] font-bold uppercase tracking-wider"
            style={{ background: '#fff3e0', color: '#d97706', letterSpacing: '0.4px' }}>
            {row.lateDays}
          </span>
        )}
      </div>

      {/* Amount + avatar */}
      <div className="flex items-center gap-2.5 justify-end">
        {row.amount && <span className="font-mono text-[13.5px] text-kinship-on-surface" style={{ fontWeight: 500 }}>{row.amount}</span>}
        {row.whoInitials && (
          <div className="flex items-center justify-center rounded-full text-white"
            style={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, backgroundColor: row.whoColor ?? '#999' }}>
            {row.whoInitials}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Household balance card ──────────────────────────────────── */
function BalanceCard({ topMember, others, bars }: {
  topMember: { name: string; pct: number; color: string }
  others: { name: string; pct: number; count: number }[]
  bars: { name: string; pct: number; color: string }[]
}) {
  const [open, setOpen] = useState(false)
  // Suggest items other members could pick up
  const suggestions = others.length > 0
    ? `${others.reduce((s, o) => s + o.count, 0)} things ${others.map((o) => o.name).join(' or ')} could pick up`
    : null

  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      {/* Header — same pattern as Money pulse */}
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-4 py-2.5">
        <Users className="h-[14px] w-[14px] text-kinship-on-surface" />
        <span className="font-display text-[14px] font-semibold text-kinship-on-surface">Household balance</span>
        <div className="flex-1" />
        <span className="font-body text-[11px] text-kinship-placeholder">this week</span>
      </div>

      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-4 py-3 hover:bg-kinship-surface-container/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-2 w-24 shrink-0 overflow-hidden rounded-full ring-1 ring-kinship-surface-container">
            {bars.map((b, i) => (
              <div key={i} style={{ width: `${b.pct}%`, backgroundColor: b.color }} className="h-full" />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-[13px] text-kinship-on-surface leading-snug">
              <strong>{topMember.name}</strong> is holding <strong>{topMember.pct}%</strong> this week.
            </p>
            {suggestions && (
              <p className="font-body text-[12px] font-semibold text-kinship-primary mt-0.5 flex items-center gap-0.5">
                {suggestions} <ChevronRight className="h-2.5 w-2.5" />
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Expanded breakdown */}
      {open && (
        <div className="border-t border-kinship-surface-container px-4 py-2 bg-kinship-surface/50">
          {bars.map((b, i) => (
            <div key={i} className={`flex items-center gap-2.5 py-1.5 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}>
              <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="font-body text-[12px] font-medium text-kinship-on-surface flex-1">{b.name}</span>
              <span className="font-mono text-[11px] text-kinship-on-surface-variant">{b.pct}%</span>
            </div>
          ))}
        </div>
      )}
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
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-4 py-2.5">
        <TrendingUp className="h-[14px] w-[14px] text-kinship-on-surface" />
        <span className="font-display text-[14px] font-semibold text-kinship-on-surface">Money pulse</span>
        <div className="flex-1" />
        <span className="font-body text-[11px] text-kinship-placeholder">next 30 days</span>
      </div>

      <div className="px-4 py-2.5">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-body text-[10.5px] font-bold uppercase tracking-wider text-kinship-placeholder">Coming out</span>
          <span className="font-mono text-[11px] text-kinship-placeholder">{payments.length} charges</span>
        </div>
        {payments.map((p, i) => (
          <div key={i}
            className={`grid items-center gap-2 py-1.5 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}
            style={{ gridTemplateColumns: '48px 1fr auto' }}>
            <span className="font-mono text-[11px] text-kinship-placeholder">{p.date}</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: MOD[p.module]?.dot ?? '#999' }} />
              <div className="min-w-0">
                <div className="font-body text-[12px] font-medium text-kinship-on-surface truncate">{p.title}</div>
                <div className="font-body text-[10px] text-kinship-placeholder">{p.sub}</div>
              </div>
            </div>
            <span className="font-mono text-[13px] font-semibold text-kinship-on-surface">€{(p.amount / 100).toFixed(0)}</span>
          </div>
        ))}

        <div className="mt-2.5 flex items-baseline gap-2 rounded-xl bg-kinship-surface px-3 py-2.5">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-kinship-on-surface-variant">Estimated total</span>
          <div className="flex-1" />
          <span className="font-display text-[20px] font-semibold text-kinship-on-surface">€{(total / 100).toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
