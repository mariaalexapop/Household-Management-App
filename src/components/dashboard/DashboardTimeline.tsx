'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { format, isToday, isTomorrow, isBefore, parseISO, startOfDay, differenceInCalendarDays, addDays } from 'date-fns'
import { Check, TrendingUp, ChevronRight, Upload, Users, Lightbulb, AlertTriangle, UserPlus, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateTaskStatus, assignTask } from '@/app/actions/tasks'
import { acceptSuggestion, dismissSuggestion } from '@/app/actions/suggestions'
import type { ModuleKey } from '@/stores/onboarding'

const MOD: Record<ModuleKey, { dot: string }> = {
  chores: { dot: '#187574' }, kids: { dot: '#e05252' }, car: { dot: '#c67d2a' },
  insurance: { dot: '#6a55d9' }, electronics: { dot: '#3f9b3f' },
}

interface TimelineRow {
  id: string; realId?: string; day: string; when?: string; title: string
  module: ModuleKey; whoInitials?: string; whoColor?: string; amount?: string
  isOverdue?: boolean; lateDays?: string; isDone?: boolean; isTask?: boolean; sortKey: number
  // Detail fields for expand
  notes?: string | null; areaName?: string | null; endsAt?: string | null; startsAtFull?: string | null
  location?: string | null; childName?: string | null; ownerName?: string | null; category?: string | null
}
interface SerializedMember { id: string; displayName: string | null; avatarUrl: string | null; userId: string }

interface SerializedSuggestion {
  id: string
  sourceModule: string
  sourceEntityId: string
  sourceField: string
  deadlineDate: string
  suggestedTitle: string
  suggestedNotes: string | null
  suggestedOwnerId: string | null
  status: string
  createdAt: string | null
}

interface Props {
  activeModules: ModuleKey[]
  tasks: { id: string; title: string; notes: string | null; areaName: string | null; startsAt: string | null; endsAt: string | null; ownerId: string | null; status: string }[]
  activities: { id: string; title: string; notes: string | null; location: string | null; category: string | null; childName: string | null; childId: string | null; startsAt: string | null; endsAt: string | null; assigneeId: string | null }[]
  policies: { id: string; insurer: string; policyType: string; expiryDate: string | null; nextPaymentDate: string | null; premiumCents: number | null; paymentSchedule: string | null }[]
  members: SerializedMember[]
  suggestions: SerializedSuggestion[]
  staleOverdue: { id: string; title: string; areaName: string | null; startsAt: string | null; ownerId: string | null; status: string }[]
  monthlyCosts?: { monthIndex: number; car: number; health: number; home: number; electronics: number; total: number }[]
  weekStartIso: string; weekEndIso: string; nextWeekEndIso: string
}

function memberInfo(members: SerializedMember[], id: string | null) {
  if (!id) return null
  const m = members.find((x) => x.id === id || x.userId === id)
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
  activeModules, tasks, activities, policies, members, suggestions, staleOverdue, monthlyCosts,
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
      const ownerMember = t.ownerId ? members.find(m => m.userId === t.ownerId || m.id === t.ownerId) : null
      rows.push({ id: `task-${t.id}`, realId: t.id, day: isOv ? format(d, 'MMM d') : dayLabel(t.startsAt),
        when: timeLabel(t.startsAt), title: t.title, module: 'chores', whoInitials: who?.initials, whoColor: who?.color,
        isOverdue: isOv, lateDays: isOv ? `${differenceInCalendarDays(now, d)}d late` : undefined,
        isDone: t.status === 'done', isTask: true, sortKey: d.getTime(),
        notes: t.notes, areaName: t.areaName, endsAt: t.endsAt, startsAtFull: t.startsAt, ownerName: ownerMember?.displayName })
    }
    for (const a of activities) {
      if (!a.startsAt) continue; const d = parseISO(a.startsAt)
      const who = memberInfo(members, a.assigneeId)
      const assigneeMember = a.assigneeId ? members.find(m => m.userId === a.assigneeId || m.id === a.assigneeId) : null
      rows.push({ id: `act-${a.id}`, day: dayLabel(a.startsAt), when: timeLabel(a.startsAt),
        title: a.childName ? `${a.childName} — ${a.title}` : a.title, module: 'kids',
        whoInitials: who?.initials, whoColor: who?.color, sortKey: d.getTime(),
        notes: a.notes, location: a.location, childName: a.childName, endsAt: a.endsAt, startsAtFull: a.startsAt,
        ownerName: assigneeMember?.displayName, category: a.category })
    }
    return {
      overdue: rows.filter((r) => r.isOverdue).sort((a, b) => a.sortKey - b.sortKey),
      thisWeek: rows.filter((r) => !r.isOverdue && r.sortKey >= weekStart.getTime() && r.sortKey < weekEnd.getTime()).sort((a, b) => a.sortKey - b.sortKey),
      nextWeek: rows.filter((r) => !r.isOverdue && r.sortKey >= weekEnd.getTime()).sort((a, b) => a.sortKey - b.sortKey),
    }
  }, [tasks, activities, weekStart, weekEnd, members, now])

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
              {overdue.map((r) => <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} members={members} />)}
            </div>
          )}
          <div className={overdue.length > 0 ? 'mt-2' : 'mt-0.5'}>
            {thisWeek.length === 0 && overdue.length === 0
              ? <p className="py-2 font-body text-[12px] text-kinship-on-surface-variant italic">Nothing scheduled this week.</p>
              : thisWeek.map((r) => <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} members={members} />)}
          </div>
        </section>

        <section>
          <SectionHead title="Next week" dateRange={nextWeekRange} muted />
          <div className="mt-0.5">
            {nextWeek.length === 0
              ? <p className="py-2 font-body text-[12px] text-kinship-placeholder italic">Nothing scheduled. Enjoy the calm.</p>
              : nextWeek.map((r) => <ActionRow key={r.id} row={r} done={doneSet.has(r.id)} onToggle={() => toggleDone(r)} muted members={members} />)}
          </div>
        </section>
      </div>

      {/* RIGHT — sidebar */}
      <div className="flex flex-col gap-4 lg:flex-1">
        {members.length > 0 && <BalanceCard topMember={topMember} others={othersWithLess} bars={balance.filter((b) => b.pct > 0)} hasData={tasks.length > 0} />}
        {suggestions.length > 0 && <SuggestionsCard suggestions={suggestions} />}
        {staleOverdue.length > 0 && <ReviewCard staleOverdue={staleOverdue} members={members} />}
        {monthlyCosts && monthlyCosts.some((m) => m.total > 0) && <MoneyPulseChart monthlyCosts={monthlyCosts} />}
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

/* ── Action row (compact) with inline assign + click-to-expand ── */
function ActionRow({ row, done, onToggle, muted, members }: {
  row: TimelineRow; done: boolean; onToggle: () => void; muted?: boolean; members: SerializedMember[]
}) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!assignOpen) return
    const close = (e: MouseEvent) => { if (popRef.current && !popRef.current.contains(e.target as Node)) setAssignOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAssignOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [assignOpen])

  const handleAssign = (memberUserId: string | null) => {
    setAssignOpen(false)
    if (!row.isTask || !row.realId) return
    startTransition(async () => {
      await assignTask({ id: row.realId!, ownerId: memberUserId })
      toast.success(memberUserId ? 'Task assigned' : 'Task unassigned')
      router.refresh()
    })
  }

  const hasDetails = row.notes || row.areaName || row.endsAt || row.location || row.ownerName || row.category || row.startsAtFull || row.childName
  const moduleLabel = row.module === 'chores' ? 'Task' : row.module === 'kids' ? 'Activity' : row.module === 'car' ? 'Car' : row.module === 'insurance' ? 'Insurance' : 'Electronics'

  return (
    <div className="border-t border-kinship-surface-container" style={{ opacity: done ? 0.55 : muted ? 0.92 : 1 }}>
      <div className="grid items-center gap-x-3" style={{ gridTemplateColumns: '20px 64px 48px 1fr auto', padding: '7px 0' }}>
        {/* Checkbox */}
        <button onClick={(e) => { e.stopPropagation(); onToggle() }} aria-label={done ? 'Mark not done' : 'Mark done'}
          style={{ width: 18, height: 18, padding: 0, border: 'none', borderRadius: 9, cursor: 'pointer',
            background: done ? '#00b473' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 1.5px #b0b3c0',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}>
          {done && <Check className="h-2.5 w-2.5" />}
        </button>
        {/* Day */}
        <span className={`font-display text-[12px] font-semibold ${row.isOverdue ? 'text-amber-600' : (row.day === 'Today' || row.day === 'Tomorrow') ? 'text-kinship-primary' : 'text-kinship-on-surface'} ${done ? 'line-through' : ''}`}>{row.day}</span>
        {/* Time */}
        <span className="font-mono text-[10px] text-kinship-placeholder">{row.when || ''}</span>
        {/* Title — clickable to expand */}
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ backgroundColor: MOD[row.module]?.dot ?? '#999' }} />
          <span className={`truncate text-kinship-on-surface ${done ? 'line-through' : ''}`} style={{ fontSize: muted ? 12 : 13, fontWeight: 500 }}>{row.title}</span>
          {done && <span className="shrink-0 text-[9px] font-semibold" style={{ color: '#00b473' }}>done</span>}
          {row.isOverdue && row.lateDays && <span className="shrink-0 rounded-full px-[5px] py-px text-[8px] font-bold uppercase tracking-wider" style={{ background: '#fff3e0', color: '#d97706' }}>{row.lateDays}</span>}
        </button>
        {/* Assign + amount */}
        <div className="flex items-center gap-2 justify-end relative" ref={popRef}>
          {row.amount && <span className="font-mono text-[12px] text-kinship-on-surface" style={{ fontWeight: 500 }}>{row.amount}</span>}
          {row.isTask ? (
            <button onClick={(e) => { e.stopPropagation(); setAssignOpen(!assignOpen) }} aria-label="Assign task"
              className="flex items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-kinship-primary/30"
              style={{ width: 24, height: 24 }}>
              {row.whoInitials ? (
                <div className="flex items-center justify-center rounded-full text-white w-full h-full" style={{ fontSize: 9, fontWeight: 700, backgroundColor: row.whoColor ?? '#999' }}>{row.whoInitials}</div>
              ) : (
                <div className="flex items-center justify-center rounded-full w-full h-full" style={{ boxShadow: 'inset 0 0 0 1.5px #d0d3dc' }}>
                  <UserPlus className="h-[10px] w-[10px] text-kinship-placeholder" />
                </div>
              )}
            </button>
          ) : (
            row.whoInitials && <div className="flex items-center justify-center rounded-full text-white" style={{ width: 24, height: 24, fontSize: 9, fontWeight: 700, backgroundColor: row.whoColor ?? '#999' }}>{row.whoInitials}</div>
          )}
          {assignOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/5">
              <div className="px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-wider text-kinship-placeholder">Assign to</div>
              {members.map((m) => {
                const info = memberInfo([m], m.id)
                return (
                  <button key={m.id} onClick={() => handleAssign(m.userId)}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 hover:bg-kinship-surface-container transition-colors">
                    <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-white" style={{ fontSize: 8, fontWeight: 700, backgroundColor: info?.color ?? '#999' }}>{info?.initials ?? '?'}</div>
                    <span className="font-body text-[11px] text-kinship-on-surface truncate">{m.displayName ?? 'Unknown'}</span>
                  </button>
                )
              })}
              {row.whoInitials && (<>
                <div className="mx-2 my-0.5 border-t border-kinship-surface-container" />
                <button onClick={() => handleAssign(null)} className="flex w-full items-center gap-2 px-2.5 py-1.5 hover:bg-kinship-surface-container transition-colors">
                  <span className="font-body text-[11px] text-kinship-on-surface-variant">Unassign</span>
                </button>
              </>)}
            </div>
          )}
        </div>
      </div>

      {/* Expanded detail panel — only extra info not visible in the row */}
      {expanded && (
        <div className="ml-[23px] mb-2 rounded-lg bg-kinship-surface/60 px-3 py-2.5 flex flex-col gap-1.5">
          {/* Tags — only show what's NOT in the row already */}
          {(row.category || row.areaName) && (
            <div className="flex items-center gap-2 flex-wrap">
              {row.category && <span className="rounded-full bg-kinship-surface-container px-2 py-px text-[9px] font-medium text-kinship-on-surface-variant capitalize">{row.category}</span>}
              {row.areaName && <span className="rounded-full bg-kinship-surface-container px-2 py-px text-[9px] font-medium text-kinship-on-surface-variant">{row.areaName}</span>}
            </div>
          )}

          {/* Only show fields that add NEW info (not already in the row) */}
          {row.location && (
            <p className="font-body text-[11px] text-kinship-on-surface">📍 {row.location}</p>
          )}
          {row.endsAt && (
            <p className="font-body text-[10px] text-kinship-on-surface-variant">Until {format(parseISO(row.endsAt), 'h:mm a')}</p>
          )}
          {row.notes && (
            <p className="font-body text-[11px] text-kinship-on-surface leading-relaxed whitespace-pre-wrap">{row.notes}</p>
          )}

          {!row.location && !row.notes && !row.endsAt && !row.category && !row.areaName && (
            <p className="font-body text-[10px] text-kinship-placeholder italic">No additional details.</p>
          )}

          {/* Edit — works for both tasks and activities */}
          <Link href={row.isTask ? '/chores' : '/kids'}
            className="self-start mt-0.5 rounded-full border border-kinship-outline-variant px-2.5 py-[3px] font-body text-[10px] font-medium text-kinship-primary hover:bg-kinship-primary-surface transition-colors flex items-center gap-1">
            <Pencil className="h-[8px] w-[8px]" /> Edit
          </Link>
        </div>
      )}
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

/* ── Suggestions (DB-backed) ──────────────────────────────────── */
function SuggestionsCard({ suggestions }: { suggestions: SerializedSuggestion[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleAccept = (sug: SerializedSuggestion) => {
    startTransition(async () => {
      const result = await acceptSuggestion({ suggestionId: sug.id })
      if (result.success) {
        toast.success(`Task created: ${result.data?.taskTitle ?? sug.suggestedTitle}`)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to accept suggestion')
      }
    })
  }

  const handleEdit = (sug: SerializedSuggestion) => {
    const params = new URLSearchParams({ action: 'new', title: sug.suggestedTitle, startsAt: sug.deadlineDate })
    if (sug.suggestedOwnerId) params.set('ownerId', sug.suggestedOwnerId)
    if (sug.suggestedNotes) params.set('notes', sug.suggestedNotes)
    if (sug.sourceModule) params.set('areaHint', sug.sourceModule)
    router.push(`/chores?${params.toString()}`)
  }

  const handleDismiss = (sug: SerializedSuggestion) => {
    startTransition(async () => {
      const result = await dismissSuggestion({ suggestionId: sug.id })
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to dismiss suggestion')
      }
    })
  }

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-3.5 py-2">
        <Lightbulb className="h-[13px] w-[13px] text-amber-500" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">Suggested</span>
        <div className="flex-1" /><span className="font-body text-[10px] text-kinship-placeholder">{suggestions.length} pending</span>
      </div>
      <div className="px-3.5 py-1.5">
        {suggestions.map((sug, i) => {
          const mod = (sug.sourceModule ?? 'chores') as ModuleKey
          const d = parseISO(sug.deadlineDate)
          const days = differenceInCalendarDays(d, new Date())
          const reason = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`
          const urgent = days <= 7

          return (
            <div key={sug.id} className={`py-2 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}>
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${urgent ? 'bg-amber-100 text-amber-600' : 'bg-kinship-surface-container text-kinship-on-surface-variant'}`}>
                  <AlertTriangle className="h-[9px] w-[9px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-[4px] w-[4px] shrink-0 rounded-full" style={{ backgroundColor: MOD[mod]?.dot ?? '#999' }} />
                    <span className="font-body text-[11.5px] font-semibold text-kinship-on-surface truncate">{sug.suggestedTitle}</span>
                  </div>
                  <p className="font-body text-[10px] text-kinship-on-surface-variant mt-0.5">{reason}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button onClick={() => handleAccept(sug)} disabled={isPending}
                      className="flex items-center gap-1 rounded-full bg-kinship-primary px-2.5 py-[3px] font-body text-[10px] font-semibold text-white hover:bg-kinship-primary-pressed transition-colors disabled:opacity-50">
                      <UserPlus className="h-[9px] w-[9px]" /> Accept
                    </button>
                    <button onClick={() => handleEdit(sug)}
                      className="flex items-center gap-1 rounded-full border border-kinship-outline-variant px-2 py-[3px] font-body text-[10px] font-medium text-kinship-on-surface-variant hover:bg-kinship-surface-container transition-colors">
                      <Pencil className="h-[8px] w-[8px]" /> Edit
                    </button>
                    <button onClick={() => handleDismiss(sug)} disabled={isPending}
                      className="rounded-full px-2 py-[3px] font-body text-[10px] text-kinship-placeholder hover:bg-kinship-surface-container transition-colors disabled:opacity-50">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Things to review (stale overdue >14 days) ───────────────── */
function ReviewCard({ staleOverdue, members }: {
  staleOverdue: { id: string; title: string; areaName: string | null; startsAt: string | null; ownerId: string | null; status: string }[]
  members: SerializedMember[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleMarkDone = (taskId: string) => {
    startTransition(async () => {
      await updateTaskStatus({ id: taskId, status: 'done' })
      router.refresh()
    })
  }

  if (staleOverdue.length === 0) return null

  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-3.5 py-2">
        <AlertTriangle className="h-[13px] w-[13px] text-amber-500" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">Things to review</span>
        <div className="flex-1" /><span className="font-body text-[10px] text-kinship-placeholder">{staleOverdue.length} stale</span>
      </div>
      <div className="px-3.5 py-1.5">
        {staleOverdue.map((task, i) => {
          const days = task.startsAt ? differenceInCalendarDays(new Date(), parseISO(task.startsAt)) : 0
          return (
            <div key={task.id} className={`flex items-center gap-2 py-2 ${i > 0 ? 'border-t border-kinship-surface-container' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-[4px] w-[4px] shrink-0 rounded-full" style={{ backgroundColor: MOD.chores.dot }} />
                  <span className="font-body text-[11.5px] font-medium text-kinship-on-surface truncate">{task.title}</span>
                </div>
                <span className="font-body text-[10px] font-semibold text-amber-600">{days}d overdue</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href="/chores" className="rounded-full border border-kinship-outline-variant px-2 py-[3px] font-body text-[10px] font-medium text-kinship-on-surface-variant hover:bg-kinship-surface-container transition-colors">
                  Reschedule
                </Link>
                <button onClick={() => handleMarkDone(task.id)} disabled={isPending}
                  className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-[3px] font-body text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                  <Check className="h-[8px] w-[8px]" /> Done
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Money pulse chart ────────────────────────────────────────── */
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CHART_LINES = [
  { key: 'total', label: 'Total', color: '#1a1a2e' },
  { key: 'health', label: 'Health', color: '#e05252' },
  { key: 'car', label: 'Car', color: '#c67d2a' },
  { key: 'home', label: 'Home', color: '#6a55d9' },
] as const

function MoneyPulseChart({ monthlyCosts }: { monthlyCosts: { monthIndex: number; car: number; health: number; home: number; electronics: number; total: number }[] }) {
  const now = new Date()
  const currentMonthIdx = now.getMonth() // 0-indexed

  // Build chart data: all months use the server-projected data (insurance
  // premiums and car costs are already projected using actual payment schedules)
  // Show from Jan through 6 months after current month (max Dec)
  const lastMonth = Math.min(currentMonthIdx + 6, 11)

  const chartData = Array.from({ length: lastMonth + 1 }, (_, i) => {
    const m = monthlyCosts[i]
    return {
      name: MONTH_LABELS[i],
      total: m.total / 100,
      health: m.health / 100,
      car: m.car / 100,
      home: m.home / 100,
      predicted: i > currentMonthIdx,
    }
  })

  const [activeLines, setActiveLines] = useState<Set<string>>(new Set(['total', 'health', 'car', 'home']))
  const toggle = (key: string) => setActiveLines((prev) => {
    const next = new Set(prev)
    if (next.has(key)) { if (next.size > 1) next.delete(key) } else next.add(key)
    return next
  })

  // Dynamic import of recharts to avoid SSR issues
  const [RechartsModule, setRechartsModule] = useState<typeof import('recharts') | null>(null)
  useEffect(() => {
    import('recharts').then(setRechartsModule)
  }, [])

  if (!RechartsModule) return null
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } = RechartsModule

  return (
    <div className="rounded-2xl bg-white ring-miro overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-kinship-surface-container px-3.5 py-2">
        <TrendingUp className="h-[13px] w-[13px] text-kinship-on-surface" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">Cost evolution</span>
        <div className="flex-1" />
        <span className="font-body text-[10px] text-kinship-placeholder">{now.getFullYear()}</span>
      </div>

      {/* Legend toggles */}
      <div className="flex flex-wrap gap-2 px-3.5 pt-2.5 pb-1">
        {CHART_LINES.map((line) => (
          <button
            key={line.key}
            onClick={() => toggle(line.key)}
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 font-body text-[10px] font-medium transition-all ${
              activeLines.has(line.key) ? 'opacity-100' : 'opacity-35'
            }`}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 pb-3 pt-1">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${v}`} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee' }}
              formatter={(value: unknown, name: unknown) => [`€${Number(value).toFixed(0)}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              labelFormatter={(label: unknown) => {
                const l = String(label)
                const idx = MONTH_LABELS.indexOf(l)
                return idx > currentMonthIdx ? `${l} (predicted)` : l
              }}
            />
            <ReferenceLine
              x={MONTH_LABELS[currentMonthIdx]}
              stroke="#ccc"
              strokeDasharray="4 4"
              label={{ value: 'Now', position: 'top', fontSize: 9, fill: '#999' }}
            />
            {CHART_LINES.map((line) =>
              activeLines.has(line.key) ? (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={line.key === 'total' ? 2 : 1.5}
                  dot={false}
                  strokeDasharray={undefined}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
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
          <span className="text-[10.5px] uppercase text-kinship-placeholder" style={{ fontWeight: 700, letterSpacing: '0.8px' }}>Coming out</span>
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
