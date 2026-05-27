'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  CheckSquare,
  CalendarHeart,
  Car,
  Shield,
  Monitor,
  Plus,
  CalendarDays,
  Coins,
  Settings,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'
import type { SearchResult } from '@/app/api/search/route'

// ---------------------------------------------------------------------------
// Static quick-actions — always available, filtered by query
// ---------------------------------------------------------------------------

interface QuickAction {
  id: string
  label: string
  keywords: string[] // extra terms for fuzzy matching
  icon: LucideIcon
  color: string
  href: string
  group: 'action' | 'navigate'
}

const QUICK_ACTIONS: QuickAction[] = [
  // Create actions
  { id: 'add-task', label: 'Add a new task', keywords: ['create', 'chore', 'todo', 'task', 'new'], icon: Plus, color: '#5b76fe', href: '/chores?action=new', group: 'action' },
  { id: 'add-activity', label: 'Add a kids activity', keywords: ['create', 'kid', 'child', 'activity', 'new', 'event'], icon: Plus, color: '#16a34a', href: '/kids?action=new', group: 'action' },
  { id: 'add-car', label: 'Add a car', keywords: ['create', 'vehicle', 'car', 'new'], icon: Plus, color: '#ea580c', href: '/cars?action=new', group: 'action' },
  { id: 'add-policy', label: 'Add an insurance policy', keywords: ['create', 'insurance', 'policy', 'new'], icon: Plus, color: '#9333ea', href: '/insurance?action=new', group: 'action' },
  { id: 'add-electronic', label: 'Add an electronics item', keywords: ['create', 'electronic', 'appliance', 'warranty', 'new', 'device'], icon: Plus, color: '#0d9488', href: '/electronics?action=new', group: 'action' },
  // Navigate actions
  { id: 'nav-dashboard', label: 'Go to Dashboard', keywords: ['dashboard', 'home', 'overview'], icon: LayoutDashboard, color: '#5b76fe', href: '/dashboard', group: 'navigate' },
  { id: 'nav-calendar', label: 'Go to Calendar', keywords: ['calendar', 'schedule', 'dates', 'events'], icon: CalendarDays, color: '#5b76fe', href: '/calendar', group: 'navigate' },
  { id: 'nav-costs', label: 'Go to Cost Summary', keywords: ['costs', 'money', 'expenses', 'spending', 'budget'], icon: Coins, color: '#5b76fe', href: '/costs', group: 'navigate' },
  { id: 'nav-chores', label: 'Go to Tasks', keywords: ['chores', 'tasks', 'todo'], icon: CheckSquare, color: '#5b76fe', href: '/chores', group: 'navigate' },
  { id: 'nav-kids', label: 'Go to Kids Activities', keywords: ['kids', 'children', 'activities'], icon: CalendarHeart, color: '#16a34a', href: '/kids', group: 'navigate' },
  { id: 'nav-cars', label: 'Go to Cars', keywords: ['cars', 'vehicles', 'mot', 'service', 'tax'], icon: Car, color: '#ea580c', href: '/cars', group: 'navigate' },
  { id: 'nav-insurance', label: 'Go to Insurance', keywords: ['insurance', 'policies', 'cover'], icon: Shield, color: '#9333ea', href: '/insurance', group: 'navigate' },
  { id: 'nav-electronics', label: 'Go to Electronics', keywords: ['electronics', 'appliances', 'warranties', 'devices'], icon: Monitor, color: '#0d9488', href: '/electronics', group: 'navigate' },
  { id: 'nav-settings', label: 'Go to Settings', keywords: ['settings', 'profile', 'account', 'preferences'], icon: Settings, color: '#6b7280', href: '/settings', group: 'navigate' },
]

const MODULE_META: Record<
  SearchResult['module'],
  { icon: LucideIcon; color: string; label: string }
> = {
  chores: { icon: CheckSquare, color: '#5b76fe', label: 'Chores' },
  kids: { icon: CalendarHeart, color: '#16a34a', label: 'Kids' },
  cars: { icon: Car, color: '#ea580c', label: 'Cars' },
  insurance: { icon: Shield, color: '#9333ea', label: 'Insurance' },
  electronics: { icon: Monitor, color: '#0d9488', label: 'Electronics' },
}

// ---------------------------------------------------------------------------
// Fuzzy match helper — checks if all query words appear in the target text
// ---------------------------------------------------------------------------
function fuzzyMatch(query: string, ...targets: (string | null | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const text = targets.filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => text.includes(w))
}

// ---------------------------------------------------------------------------
// Unified item type shown in the palette
// ---------------------------------------------------------------------------
interface PaletteItem {
  id: string
  label: string
  subtitle?: string | null
  icon: LucideIcon
  color: string
  href: string
  group: 'action' | 'navigate' | 'result'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SearchPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dbResults, setDbResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  // Cmd+K / Ctrl+K to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened; reset when closed
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setDbResults([])
      setActiveIndex(0)
    }
  }, [open])

  // Debounced DB search (only when query >= 2 chars)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setDbResults([])
      return
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setDbResults(data.results)
        }
      } catch {
        // aborted — ignore
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Build unified items list: actions first, then DB results
  const items: PaletteItem[] = useMemo(() => {
    const q = query.trim()
    const list: PaletteItem[] = []

    // Filter quick actions by query (show all when empty)
    const matchedActions = q
      ? QUICK_ACTIONS.filter((a) => fuzzyMatch(q, a.label, ...a.keywords))
      : QUICK_ACTIONS.filter((a) => a.group === 'action') // show create actions by default

    for (const a of matchedActions) {
      list.push({
        id: a.id,
        label: a.label,
        icon: a.icon,
        color: a.color,
        href: a.href,
        group: a.group,
      })
    }

    // Append DB search results
    for (const r of dbResults) {
      const meta = MODULE_META[r.module]
      list.push({
        id: `db-${r.module}-${r.id}`,
        label: r.title,
        subtitle: r.subtitle,
        icon: meta.icon,
        color: meta.color,
        href: r.href,
        group: 'result',
      })
    }

    return list
  }, [query, dbResults])

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(0)
  }, [items.length])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const navigate = useCallback(
    (item: PaletteItem) => {
      setOpen(false)
      router.push(item.href)
    },
    [router]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && items[activeIndex]) {
      navigate(items[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  // Group items for section headers
  const actionItems = items.filter((i) => i.group === 'action')
  const navItems = items.filter((i) => i.group === 'navigate')
  const resultItems = items.filter((i) => i.group === 'result')

  let runningIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-kinship-surface-container bg-kinship-surface-container-lowest shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-kinship-surface-container px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-kinship-on-surface-variant" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent font-body text-sm text-kinship-on-surface placeholder:text-kinship-on-surface-variant outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-kinship-surface-container px-1.5 py-0.5 font-body text-xs text-kinship-on-surface-variant">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {/* Action suggestions */}
          {actionItems.length > 0 && (
            <Section label={query ? 'Actions' : 'Quick actions'}>
              {actionItems.map((item) => {
                const idx = runningIndex++
                return (
                  <PaletteRow
                    key={item.id}
                    item={item}
                    index={idx}
                    active={idx === activeIndex}
                    onNavigate={navigate}
                    onHover={setActiveIndex}
                  />
                )
              })}
            </Section>
          )}

          {/* Navigation suggestions */}
          {navItems.length > 0 && (
            <Section label="Navigate">
              {navItems.map((item) => {
                const idx = runningIndex++
                return (
                  <PaletteRow
                    key={item.id}
                    item={item}
                    index={idx}
                    active={idx === activeIndex}
                    onNavigate={navigate}
                    onHover={setActiveIndex}
                  />
                )
              })}
            </Section>
          )}

          {/* DB search results */}
          {resultItems.length > 0 && (
            <Section label="Results">
              {resultItems.map((item) => {
                const idx = runningIndex++
                return (
                  <PaletteRow
                    key={item.id}
                    item={item}
                    index={idx}
                    active={idx === activeIndex}
                    onNavigate={navigate}
                    onHover={setActiveIndex}
                  />
                )
              })}
            </Section>
          )}

          {/* Loading state */}
          {loading && query.length >= 2 && resultItems.length === 0 && (
            <p className="px-4 py-4 text-center font-body text-sm text-kinship-on-surface-variant">
              Searching...
            </p>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && items.length === 0 && (
            <p className="px-4 py-6 text-center font-body text-sm text-kinship-on-surface-variant">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-kinship-surface-container px-4 py-2">
          <div className="flex items-center gap-3 font-body text-xs text-kinship-on-surface-variant">
            <span><kbd className="rounded border border-kinship-surface-container px-1">↑↓</kbd> navigate</span>
            <span><kbd className="rounded border border-kinship-surface-container px-1">↵</kbd> select</span>
            <span><kbd className="rounded border border-kinship-surface-container px-1">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 py-1 font-body text-xs font-medium uppercase tracking-wider text-kinship-on-surface-variant">
        {label}
      </p>
      {children}
    </div>
  )
}

function PaletteRow({
  item,
  index,
  active,
  onNavigate,
  onHover,
}: {
  item: PaletteItem
  index: number
  active: boolean
  onNavigate: (item: PaletteItem) => void
  onHover: (i: number) => void
}) {
  const Icon = item.icon
  return (
    <button
      data-index={index}
      onClick={() => onNavigate(item)}
      onMouseEnter={() => onHover(index)}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
        active ? 'bg-kinship-surface-container' : 'hover:bg-kinship-surface-container/50'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-kinship-on-surface truncate">{item.label}</p>
        {item.subtitle && (
          <p className="font-body text-xs text-kinship-on-surface-variant truncate">
            {item.subtitle}
          </p>
        )}
      </div>
      {item.group === 'result' && (
        <span
          className="shrink-0 rounded-full px-2 py-px font-medium text-white"
          style={{ backgroundColor: item.color, fontSize: '10px', lineHeight: '16px' }}
        >
          {MODULE_META[
            Object.entries(MODULE_META).find(([, v]) => v.color === item.color)?.[0] as SearchResult['module']
          ]?.label}
        </span>
      )}
    </button>
  )
}
