'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Search, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/search', label: 'Search', icon: Search, isSearch: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-only fixed inset-x-0 bottom-0 z-40 border-t border-kinship-surface-container bg-kinship-surface-container-lowest safe-area-bottom">
      <div className="flex items-center justify-around py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          if (item.isSearch) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                  )
                }}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-kinship-on-surface-variant"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive
                  ? 'text-kinship-primary'
                  : 'text-kinship-on-surface-variant'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
