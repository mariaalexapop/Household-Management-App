'use client'

import { useState, useMemo, useTransition } from 'react'
import { format, isToday, isTomorrow, isBefore, parseISO, startOfDay, differenceInCalendarDays, addDays } from 'date-fns'
import { Check, TrendingUp, ChevronRight, Upload, Users, Lightbulb, AlertTriangle, UserPlus, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateTaskStatus, createTask } from '@/app/actions/tasks'
import type { ModuleKey } from '@/stores/onboarding'

const MOD: Record<ModuleKey, { dot: string }> = {
  chores: { dot: '#187574' }, kids: { dot: '#e05252' }, car: { dot: '#c67d2a' },
  insurance: { dot: '#6a55d9' }, electronics: { dot: '#3f9b3f' },
}

interface TimelineRow {
  id: string; realId?: string; day: string; when?: string; title: string
  module: ModuleKey; whoInitials?: string; whoColor?: string; amount?: string
  isOverdue?: boolean; lateDays?: string; isDone?: boolean; isTask?: boolean; sortKey: number
}
interface SerializedMember { id: string; displayName: string | null; avatarUrl: string | null; userId: string }

interface Props {
  activeModules: ModuleKey[]
  tasks: { id: string; title: string; areaName: string | null; startsAt: string | null; ownerId: string | null; status: string }[]
  activities: { id: string; title: string; childName: string | null; childId: string | null; startsAt: string | null; assigneeId: string | null }[]
  cars: { id: string; make: string; model: string; motDueDate: string | null; taxDueDate: string | null; nextServiceDate: string | null }[]
  policies: { id: string; insurer: string; policyType: string; expiryDate: string | null; nextPaymentDate: string | null; premiumCents: number | null; paymentSchedule: string | null }[]
  electronics: { id: string; name: string; warrantyExpiryDate: string | null }[]
  members: SerializedMember[]; weekStartIso: string; weekEndIso: string; nextWeekEndIso: string
}

function memberInfo(members: SerializedMember[], id: string | null) {
  if (!id) return null
  const m = members.find((x) => x.id === id)
  if (!m?.displayName) return null
  const initials = m.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  let hash = 0; for (const c of m.displayName) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0
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

export function DashboardTimeline({
  activeModules, tasks, activities, cars, policies, electronics, members,
  weekStartIso, weekEndIso, nextWeekEndIso,
}: Props) {
  const weekStart = parseISO(weekStartIso)
  const weekEnd = parseISO(weekEndIso)
  const now = new Date()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /* ── Build timeline rows ─────────────────────────────────────── */
  const { overdue, thisWeek, nextWeek } = useMemo(() => {
    const rows: TimelineRow[] = []
    for (const t of tasks) {
      if (!t.startsAt) continue
      const d = parseISO(t.startsAt); const before = isBefore(startOfDay(d), startOfDay(weekStart))
      const isOv = before && t.status !== 'done'; const who = memberInfo(members, t.ownerId)
      rows.push({ id: `task-${t.id}`, realId: t.id, day: isOv ? format(d, 'MMM d') : dayLabel(t.startsAt),
        when: timeLabel(t.startsAt), title: t.title, module: 'chores', whoInitials: who?.initials, whoColor: who?.color,
        isOverdue: isOv, lateDays: isOv ? `${differenceInCalendarDays(now, d)}d late` : undefined,
        isDone: t.status === 'done', isTask: true, sortKey: d.getTime() })
    }
    for (const a of activities) {
      if (!a.startsAt) continue; const d = parseISO(a.startsAt)
      const who = memberInfo(members, a.assigneeId)
      rows.push({ id: `act-${a.id}`, day: dayLabel(a.startsAt), when: timeLabel(a.startsAt),
        title: a.childName ? `${a.childName} — ${a.title}` : a.title, module: 'kids',
        whoInitials: who?.initials, whoColor: who?.color, sortKey: d.getTime() })
    }
    for (const c of cars) {
      for (const [date, label] of [[c.motDueDate, `MOT — ${c.make} ${c.model}`], [c.taxDueDate, `Tax — ${c.make} ${c.model}`], [c.nextServiceDate, `Service — ${c.make} ${c.model}`]] as [string|null, string][]) {
        if (!date) continue; const d = parseISO(date)
        if (d < weekStart || d >= parseISO(nextWeekEndIso)) continue
        rows.push({ id: `car-${c.id}-${label}`, day: dayLabel(date), title: label, module: 'car', sortKey: d.getTime() })
      }
    }
    for (const p of policies) {
      for (const [date, label, amt] of [[p.expiryDate, `${p.insurer} — ${p.policyType} expiry`, undefined], [p.nextPaymentDate, `${p.insurer} — payment due`, p.premiumCents ? `€${(p.premiumCents/100).toFixed(2)}` : undefined]] as [string|null, string, string|undefined][]) {
        if (!date) continue; const d = parseISO(date)
        if (d < weekStart || d >= parseISO(nextWeekEndIso)) continue
        rows.push({ id: `ins-${p.id}-${label}`, day: dayLabel(date), title: label, module: 'insurance', amount: amt, sortKey: d.getTime() })
      }
    }
    return {
      overdue: rows.filter((r) => r.isOverdue).sort((a, b) => a.sortKey - b.sortKey),
      thisWeek: rows.filter((r) => !r.isOverdue && r.sortKey >= weekStart.getTime() && r.sortKey < weekEnd.getTime()).sort((a, b) => a.sortKey - b.sortKey),
      nextWeek: rows.filter((r) => !r.isOverdue && r.sortKey >= weekEnd.getTime()).sort((a, b) => a.sortKey - b.sortKey),
    }
  }, [tasks, activities, cars, policies, weekStart, weekEnd, nextWeekEndIso, members, now])

  /* ── Done toggle ─────────────────────────────────────────────── */
  const [doneSet, setDoneSet] = useState<Set<string>>(() => {
    const s = new Set<string>(); for (const r of [...overdue, ...thisWeek, ...nextWeek]) { if (r.isDone) s.add(r.id) }; return s
  })
  const toggleDone = (row: TimelineRow) => {
    const newDone = !doneSet.has(row.id)
    setDoneSet((s) => { const n = new Set(s); newDone ? n.add(row.id) : n.delete(row.id); return n })
    if (row.isTask && row.realId) { startTransition(async () => { await updateTaskStatus({ id: row.realId!, status: newDone ? 'done' : 'todo' }); router.refresh() }) }
  }

  /* ── Money pulse ─────────────────────────────────────────────── */
  const upcomingPayments = useMemo(() => {
    const items: { date: string; title: string; sub: string; amount: number; module: ModuleKey }[] = []
    for (const p of policies) {
      if (p.nextPaymentDate && p.premiumCents) {
        const d = parseISO(p.nextPaymentDate)
        if (d >= now && d <= new Date(now.getTime() + 30 * 86400000))
          items.push({ date: format(d, 'MMM d'), title: p.insurer, sub: `${p.policyType} ${p.paymentSchedule ?? 'payment'}`, amount: p.premiumCents, module: 'insurance' })
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [policies, now])
  const paymentTotal = upcomingPayments.reduce((s, x) => s + x.amount, 0)

  /* ── Balance ─────────────────────────────────────────────────── */
  const balance = useMemo(() => {
    const counts = new Map<string, number>(); let unassigned = 0
    for (const t of tasks) { t.ownerId ? counts.set(t.ownerId, (counts.get(t.ownerId) ?? 0) + 1) : unassigned++ }
    if (counts.size === 0 && members.length > 0 && tasks.length > 0) counts.set(members[0].id, tasks.length)
    else if (unassigned > 0 && counts.size > 0) { const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]; counts.set(top, (counts.get(top) ?? 0) + unassigned) }
    const total = tasks.length || 1
    return members.map((m) => { const count = counts.get(m.id) ?? 0; return { id: m.id, name: m.displayName?.split(' ')[0] ?? '?', pct: Math.round((count / total) * 100), color: memberInfo([m], m.id)?.color ?? '#999', count } }).sort((a, b) => b.pct - a.pct)
  }, [tasks, members])
  const topMember = balance[0]; const othersWithLess = balance.filter((b) => b.pct > 0 && b.id !== topMember?.id)

  /* ── Suggestions (only this/next week, max 30d overdue) ─────── */
  interface Suggestion { id: string; title: string; reason: string; dueDate: string; module: ModuleKey; urgency: 'soon'|'upcoming'; suggestedMemberId?: string; suggestedMemberName?: string }
  const suggestions = useMemo(() => {
    const items: Suggestion[] = []
    const cutoff = parseISO(nextWeekEndIso).getTime()
    const maxOverdue = 30 // ignore items >30 days overdue

    for (const c of cars) {
      const label = `${c.make} ${c.model}`
      for (const [date, type] of [[c.motDueDate, 'MOT'], [c.taxDueDate, 'Tax'], [c.nextServiceDate, 'Service']] as [string|null, string][]) {
        if (!date) continue; const d = parseISO(date); const days = differenceInCalendarDays(d, now)
        if (d.getTime() > cutoff || days < -maxOverdue) continue
        items.push({ id: `sug-car-${c.id}-${type}`, title: `${type} — ${label}`,
          reason: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`,
          dueDate: date, module: 'car', urgency: days <= 7 ? 'soon' : 'upcoming' })
      }
    }
    for (const p of policies) {
      if (!p.expiryDate) continue; const d = parseISO(p.expiryDate); const days = differenceInCalendarDays(d, now)
      if (d.getTime() > cutoff || days < -maxOverdue) continue
      items.push({ id: `sug-ins-${p.id}`, title: `${p.insurer} — ${p.policyType} renewal`,
        reason: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Expires today' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`,
        dueDate: p.expiryDate, module: 'insurance', urgency: days <= 7 ? 'soon' : 'upcoming' })
    }
    for (const e of electronics) {
      if (!e.warrantyExpiryDate) continue; const d = parseISO(e.warrantyExpiryDate); const days = differenceInCalendarDays(d, now)
      if (d.getTime() > cutoff || days < -maxOverdue) continue
      items.push({ id: `sug-elec-${e.id}`, title: `${e.name} — warranty expiring`,
        reason: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Expires today' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`,
        dueDate: e.warrantyExpiryDate, module: 'electronics', urgency: days <= 7 ? 'soon' : 'upcoming' })
    }
    const leastLoaded = balance.length > 1 ? balance.reduce((min, b) => b.pct < min.pct ? b : min, balance[balance.length - 1]) : balance[0]
    return items.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()).slice(0, 5).map((s) => ({ ...s, suggestedMemberId: leastLoaded?.id, suggestedMemberName: leastLoaded?.name }))
  }, [cars, policies, electronics, balance, now, nextWeekEndIso])

  const weekRange = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'd')}`
  const nextWeekRange = `${format(weekEnd, 'MMM d')} – ${format(addDays(weekEnd, 6), 'MMM d')}`

  /* ════════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
      {/* LEFT — action list */}
      <div className="flex flex-col gap-5 lg:flex-[1.7] min-w-0">
        <Link href="/notifications" className="flex items-center gap-2.5 rounded-xl bg-kinship-primary-surface px-3.5 py-2 text-kinship-primary hover:bg-kinship-primary/10 transition-colors">
          <Upload className="h-[13px] w-[13px] shrink-0" />
          <span className="font-body text-[12px] font-medium">Drop a receipt, photo or PDF — Kinship files it for you.</span>
          <span className="flex-1" />
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 font-body text-[10.5px] font-semibold text-kinship-primary">+ Add</span>
        </Link>

        <section>
          <SectionHead title="This week" dateRange={weekRange} />
          {overdue.length > 0 && (
            <div className="mt-2">
              <div className="font-display text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">Overdue · {overdue.length}</div>
              {overdue.map((r) => <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} />)}
            </div>
          )}
          <div className={overdue.length > 0 ? 'mt-2' : 'mt-0.5'}>
            {thisWeek.length === 0 && overdue.length === 0
              ? <p className="py-2 font-body text-[12px] text-kinship-on-surface-variant italic">Nothing scheduled this week.</p>
              : thisWeek.map((r) => <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} />)}
          </div>
        </section>

        <section>
          <SectionHead title="Next week" dateRange={nextWeekRange} muted />
          <div className="mt-0.5">
            {nextWeek.length === 0
              ? <p className="py-2 font-body text-[12px] text-kinship-placeholder italic">Nothing scheduled. Enjoy the calm.</p>
              : nextWeek.map((r) => <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} muted />)}
          </div>
        </section>
      </div>

      {/* RIGHT — sidebar */}
      <div className="flex flex-col gap-4 lg:flex-1">
        {members.length > 0 && <BalanceCard topMember={topMember} others={othersWithLess} bars={balance.filter((b) => b.pct > 0)} hasData={tasks.length > 0} />}
        {suggestions.length > 0 && <SuggestionsCard suggestions={suggestions} members={members} />}
        {upcomingPayments.length > 0 && <MoneyPulseCard payments={upcomingPayments} total={paymentTotal} />}
      </div>
    </div>
  )
}

/* ── Section header ──────────────────────────────────────────── */
function SectionHead({ title, dateRange, muted }: { title: string; dateRange: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-kinship-surface-container pb-1">
      <h2 className={`font-display font-semibold tracking-tight ${muted ? 'text-[14px] text-kinship-on-surface-variant' : 'text-[16px] text-kinship-on-surface'}`}>{title}</h2>
      <span className="font-mono text-[9px] tracking-wide text-kinship-placeholder">{dateRange}</span>
    </div>
  )
}

/* ── Action row (compact) ────────────────────────────────────── */
function ActionRow({ row, done, onToggle, muted }: { row: TimelineRow; done: boolean; onToggle: () => void; muted?: boolean }) {
  return (
    <div className="grid items-center gap-x-3 border-t border-kinship-surface-container"
      style={{ gridTemplateColumns: '20px 64px 48px 1fr auto', padding: '7px 0', opacity: done ? 0.55 : muted ? 0.92 : 1 }}>
      <button onClick={onToggle} aria-label={done ? 'Mark not done' : 'Mark done'}
        style={{ width: 18, height: 18, padding: 0, border: 'none', borderRadius: 9, cursor: 'pointer',
          background: done ? '#00b473' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 1.5px #b0b3c0',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}>
        {done && <Check className="h-2.5 w-2.5" />}
      </button>
      <span className={`font-display text-[12px] font-semibold ${row.isOverdue ? 'text-amber-600' : (row.day === 'Today' || row.day === 'Tomorrow') ? 'text-kinship-primary' : 'text-kinship-on-surface'} ${done ? 'line-through' : ''}`}>{row.day}</span>
      <span className="font-mono text-[10px] text-kinship-placeholder">{row.when || ''}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ backgroundColor: MOD[row.module]?.dot ?? '#999' }} />
        <span className={`truncate text-kinship-on-surface ${done ? 'line-through' : ''}`} style={{ fontSize: muted ? 12 : 13, fontWeight: 500 }}>{row.title}</span>
        {done && <span className="shrink-0 text-[9px] font-semibold" style={{ color: '#00b473' }}>done</span>}
        {row.isOverdue && row.lateDays && <span className="shrink-0 rounded-full px-[5px] py-px text-[8px] font-bold uppercase tracking-wider" style={{ background: '#fff3e0', color: '#d97706' }}>{row.lateDays}</span>}
      </div>
      <div className="flex items-center gap-2 justify-end">
        {row.amount && <span className="font-mono text-[12px] text-kinship-on-surface" style={{ fontWeight: 500 }}>{row.amount}</span>}
        {row.whoInitials && <div className="flex items-center justify-center rounded-full text-white" style={{ width: 24, height: 24, fontSize: 9, fontWeight: 700, backgroundColor: row.whoColor ?? '#999' }}>{row.whoInitials}</div>}
      </div>
    </div>
  )
}

/* ── Household balance ───────────────────────────────────────── */
function BalanceCard({ topMember, others, bars, hasData }: { topMember: { name: string; pct: number; color: string } | undefined; others: { name: string; pct: number; count: number }[]; bars: { name: string; pct: number; color: string }[]; hasData: boolean }) {
  const [open, setOpen] = useState(false)
  const sug = others.length > 0 ? `${others.reduce((s, o) => s + o.count, 0)} things ${others.map((o) => o.name).join(' or ')} could pick up` : null
  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-3.5 py-2">
        <Users className="h-[13px] w-[13px] text-kinship-on-surface" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">Household balance</span>
        <div className="flex-1" /><span className="font-body text-[10px] text-kinship-placeholder">this week</span>
      </div>
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-3.5 py-2.5 hover:bg-kinship-surface-container/20 transition-colors">
        <div className="flex items-center gap-3">
          {hasData && bars.length > 0 && <div className="flex h-2 w-20 shrink-0 overflow-hidden rounded-full ring-1 ring-kinship-surface-container">{bars.map((b, i) => <div key={i} style={{ width: `${b.pct}%`, backgroundColor: b.color }} className="h-full" />)}</div>}
          <div className="flex-1 min-w-0">
            {hasData && topMember ? (<>
              <p className="font-body text-[12px] text-kinship-on-surface leading-snug"><strong>{topMember.name}</strong> is holding <strong>{topMember.pct}%</strong> this week.</p>
              {sug && <p className="font-body text-[11px] font-semibold text-kinship-primary mt-0.5 flex items-center gap-0.5">{sug} <ChevronRight className="h-2.5 w-2.5" /></p>}
            </>) : <p className="font-body text-[12px] text-kinship-on-surface-variant">No tasks this week yet.</p>}
          </div>
        </div>
      </button>
      {open && <div className="border-t border-kinship-surface-container px-3.5 py-1.5 bg-kinship-surface/50">
        {bars.map((b, i) => <div key={i} className={`flex items-center gap-2 py-1 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}>
          <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
          <span className="font-body text-[11px] font-medium text-kinship-on-surface flex-1">{b.name}</span>
          <span className="font-mono text-[10px] text-kinship-on-surface-variant">{b.pct}%</span>
        </div>)}
      </div>}
    </div>
  )
}

/* ── Suggestions ─────────────────────────────────────────────── */
function SuggestionsCard({ suggestions, members }: {
  suggestions: { id: string; title: string; reason: string; dueDate: string; module: ModuleKey; urgency: 'soon'|'upcoming'; suggestedMemberId?: string; suggestedMemberName?: string }[]
  members: SerializedMember[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [created, setCreated] = useState<Set<string>>(new Set())

  const handleCreate = (sug: typeof suggestions[0]) => {
    startTransition(async () => {
      const result = await createTask({ title: sug.title, notes: `Auto-suggested: ${sug.reason}`, ownerId: sug.suggestedMemberId ?? null, startsAt: sug.dueDate })
      if (result.success) { setCreated((s) => new Set(s).add(sug.id)); toast.success(`Task created: ${sug.title}`, { description: sug.suggestedMemberName ? `Assigned to ${sug.suggestedMemberName}` : undefined }); router.refresh() }
      else toast.error(result.error ?? 'Failed to create task')
    })
  }

  const handleEdit = (sug: typeof suggestions[0]) => {
    // Navigate to chores with pre-filled data via query params
    const params = new URLSearchParams({ action: 'new', title: sug.title, startsAt: sug.dueDate })
    if (sug.suggestedMemberId) params.set('ownerId', sug.suggestedMemberId)
    router.push(`/chores?${params.toString()}`)
  }

  const visible = suggestions.filter((s) => !dismissed.has(s.id) && !created.has(s.id))
  if (visible.length === 0) return null

  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-3.5 py-2">
        <Lightbulb className="h-[13px] w-[13px] text-amber-500" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">Suggested</span>
        <div className="flex-1" /><span className="font-body text-[10px] text-kinship-placeholder">this &amp; next week</span>
      </div>
      <div className="px-3.5 py-1.5">
        {visible.map((sug, i) => (
          <div key={sug.id} className={`py-2 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}>
            <div className="flex items-start gap-2">
              <div className={`mt-0.5 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${sug.urgency === 'soon' ? 'bg-amber-100 text-amber-600' : 'bg-kinship-surface-container text-kinship-on-surface-variant'}`}>
                <AlertTriangle className="h-[9px] w-[9px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-[4px] w-[4px] shrink-0 rounded-full" style={{ backgroundColor: MOD[sug.module]?.dot ?? '#999' }} />
                  <span className="font-body text-[11.5px] font-semibold text-kinship-on-surface truncate">{sug.title}</span>
                </div>
                <p className="font-body text-[10px] text-kinship-on-surface-variant mt-0.5">{sug.reason}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button onClick={() => handleCreate(sug)} disabled={isPending}
                    className="flex items-center gap-1 rounded-full bg-kinship-primary px-2.5 py-[3px] font-body text-[10px] font-semibold text-white hover:bg-kinship-primary-pressed transition-colors disabled:opacity-50">
                    <UserPlus className="h-[9px] w-[9px]" />
                    {sug.suggestedMemberName ? `Assign to ${sug.suggestedMemberName}` : 'Create task'}
                  </button>
                  <button onClick={() => handleEdit(sug)}
                    className="flex items-center gap-1 rounded-full border border-kinship-outline-variant px-2 py-[3px] font-body text-[10px] font-medium text-kinship-on-surface-variant hover:bg-kinship-surface-container transition-colors">
                    <Pencil className="h-[8px] w-[8px]" /> Edit
                  </button>
                  <button onClick={() => setDismissed((s) => new Set(s).add(sug.id))}
                    className="rounded-full px-2 py-[3px] font-body text-[10px] text-kinship-placeholder hover:bg-kinship-surface-container transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Money pulse ─────────────────────────────────────────────── */
function MoneyPulseCard({ payments, total }: { payments: { date: string; title: string; sub: string; amount: number; module: ModuleKey }[]; total: number }) {
  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-3.5 py-2">
        <TrendingUp className="h-[13px] w-[13px] text-kinship-on-surface" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">Money pulse</span>
        <div className="flex-1" /><span className="font-body text-[10px] text-kinship-placeholder">next 30 days</span>
      </div>
      <div className="px-3.5 py-2">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-body text-[10.5px] font-bold uppercase tracking-wider text-kinship-placeholder">Coming out</span>
          <span className="font-mono text-[11px] text-kinship-placeholder">{payments.length} charges</span>
        </div>
        {payments.map((p, i) => (
          <div key={i} className={`grid items-center gap-2 py-1.5 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`} style={{ gridTemplateColumns: '44px 1fr auto' }}>
            <span className="font-mono text-[10px] text-kinship-placeholder">{p.date}</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-[4px] w-[4px] shrink-0 rounded-full" style={{ backgroundColor: MOD[p.module]?.dot ?? '#999' }} />
              <div className="min-w-0">
                <div className="font-body text-[11px] font-medium text-kinship-on-surface truncate">{p.title}</div>
                <div className="font-body text-[9px] text-kinship-placeholder">{p.sub}</div>
              </div>
            </div>
            <span className="font-mono text-[12px] font-semibold text-kinship-on-surface">€{(p.amount / 100).toFixed(0)}</span>
          </div>
        ))}
        <div className="mt-2 flex items-baseline gap-2 rounded-lg bg-kinship-surface px-2.5 py-2">
          <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-kinship-on-surface-variant">Estimated total</span>
          <div className="flex-1" />
          <span className="font-display text-[18px] font-semibold text-kinship-on-surface">€{(total / 100).toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
