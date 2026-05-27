'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, MessageCircle, Plus,
  CheckSquare, CalendarHeart, Car, Shield, Monitor,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
]

const ADD_OPTIONS = [
  { label: 'Tasks', href: '/chores?action=new', icon: CheckSquare, color: '#187574', bg: '#c3faf5' },
  { label: 'Kids Activities', href: '/kids?action=new', icon: CalendarHeart, color: '#600000', bg: '#ffc6c6' },
  { label: 'Car', href: '/cars?action=new', icon: Car, color: '#7a4000', bg: '#ffe6cd' },
  { label: 'Insurance', href: '/insurance?action=new', icon: Shield, color: '#3d2a8a', bg: '#d9d4ff' },
  { label: 'Electronics', href: '/electronics?action=new', icon: Monitor, color: '#1f5c1f', bg: '#d4f5c3' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!addOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAddOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [addOpen])

  return (
    <nav className="mobile-only fixed inset-x-0 bottom-0 z-40 border-t border-kinship-surface-container bg-kinship-surface-container-lowest safe-area-bottom">
      <div className="flex items-center justify-around py-1.5">
        {/* Home */}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

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

        {/* Add button */}
        <div className="relative" ref={menuRef}>
          {addOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/5">
              {ADD_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.href}
                    onClick={() => {
                      setAddOpen(false)
                      router.push(option.href)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-kinship-surface-container"
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: option.bg }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: option.color }} />
                    </div>
                    <span className="font-body text-[12px] font-medium text-kinship-on-surface">
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={() => setAddOpen(!addOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-kinship-on-surface-variant"
          >
            <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-kinship-primary text-white transition-transform ${addOpen ? 'rotate-45' : ''}`}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-medium">Add</span>
          </button>
        </div>

        {/* Ask Kinship */}
        <Link
          href="/chat"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
            pathname.startsWith('/chat')
              ? 'text-kinship-primary'
              : 'text-kinship-on-surface-variant'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] font-medium">Ask Kinship</span>
        </Link>
      </div>
    </nav>
  )
}
