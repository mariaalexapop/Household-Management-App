'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Users, Car, Shield, Plug,
  Sparkles, Settings, Coins,
} from 'lucide-react'

interface SidebarProps {
  userName?: string | null
  userInitials?: string | null
  userEmail?: string | null
  userAvatarUrl?: string | null
  activeModules?: string[]
}

interface NavItem {
  key: string
  label: string
  href: string
  icon: typeof LayoutDashboard
  moduleKey?: string
}

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Modules',
    items: [
      { key: 'calendar', label: 'Calendar', href: '/calendar', icon: CalendarDays },
      { key: 'chores', label: 'Tasks', href: '/chores', icon: CheckSquare, moduleKey: 'chores' },
      { key: 'kids', label: 'Kids Activities', href: '/kids', icon: Users, moduleKey: 'kids' },
      { key: 'cars', label: 'Car Maintenance', href: '/cars', icon: Car, moduleKey: 'car' },
      { key: 'insurance', label: 'Insurance', href: '/insurance', icon: Shield, moduleKey: 'insurance' },
      { key: 'electronics', label: 'Electronics', href: '/electronics', icon: Plug, moduleKey: 'electronics' },
    ],
  },
  {
    title: 'Cost',
    items: [
      { key: 'costs', label: 'Cost Summary', href: '/costs', icon: Coins },
    ],
  },
  {
    title: 'AI',
    items: [
      { key: 'chat', label: 'Ask Kinship', href: '/chat', icon: Sparkles },
    ],
  },
  {
    title: 'Account',
    items: [
      { key: 'settings', label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar({ userName, userInitials, userEmail, activeModules }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside className="hidden md:flex w-[232px] shrink-0 flex-col border-r border-kinship-outline-variant bg-white/70 backdrop-blur-xl h-screen sticky top-0">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-kinship-primary text-white font-display font-bold text-sm">
          K
        </div>
        <span className="font-display font-semibold text-[17px] tracking-tight text-kinship-on-surface">
          Kinship
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3.5 pb-3">
        {NAV_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.moduleKey) return true
            return activeModules?.includes(item.moduleKey)
          })
          if (visibleItems.length === 0) return null
          return (
          <div key={si}>
            {section.title && (
              <div className="px-2 pt-3.5 pb-1.5 font-body text-[10px] font-semibold uppercase tracking-widest text-kinship-placeholder">
                {section.title}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {visibleItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-body text-[13px] transition-colors ${
                      active
                        ? 'bg-kinship-primary-surface font-semibold text-kinship-primary'
                        : 'text-kinship-on-surface-variant hover:bg-kinship-surface-container'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-current' : 'text-kinship-placeholder'}`} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          )
        })}
      </nav>

      {/* Footer — user */}
      <div className="border-t border-kinship-outline-variant px-3.5 py-2.5">
        <Link
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-kinship-surface-container transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-kinship-primary text-white font-body text-[10px] font-semibold">
            {userInitials ?? '?'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-body text-[13px] font-semibold text-kinship-on-surface truncate">
              {userName ?? 'User'}
            </div>
            <div className="font-body text-[11px] text-kinship-placeholder truncate">
              {userEmail ?? ''}
            </div>
          </div>
          <Settings className="h-[15px] w-[15px] text-kinship-placeholder" />
        </Link>
      </div>
    </aside>
  )
}
