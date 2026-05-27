'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Coins, Settings, LogOut, Users,
  CheckSquare, CalendarHeart, Car, Shield, Monitor,
} from 'lucide-react'
import { useUserInfo } from './UserContext'

const MODULE_ITEMS = [
  { key: 'chores', label: 'Home Chores', href: '/chores', icon: CheckSquare },
  { key: 'kids', label: 'Kids Activities', href: '/kids', icon: CalendarHeart },
  { key: 'car', label: 'Car Maintenance', href: '/cars', icon: Car },
  { key: 'insurance', label: 'Insurance', href: '/insurance', icon: Shield },
  { key: 'electronics', label: 'Electronics', href: '/electronics', icon: Monitor },
]

export function MobileAvatarMenu() {
  const user = useUserInfo()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!user) return null

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const visibleModules = MODULE_ITEMS.filter((m) => user.activeModules.includes(m.key))

  async function handleSignOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-[13px] transition-colors ${
      isActive(href)
        ? 'bg-kinship-primary-surface font-semibold text-kinship-primary'
        : 'text-kinship-on-surface-variant hover:bg-kinship-surface-container hover:text-kinship-on-surface'
    }`

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-kinship-primary text-white font-body text-[10px] font-semibold overflow-hidden"
        aria-label="Menu"
        aria-expanded={open}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          user.initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-60 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          {/* User info */}
          <div className="px-3 py-2 mb-1">
            <div className="font-body text-[13px] font-semibold text-kinship-on-surface truncate">
              {user.displayName}
            </div>
            <div className="font-body text-[11px] text-kinship-placeholder truncate">
              {user.email}
            </div>
          </div>

          <hr className="my-1 border-kinship-surface-container" />

          {/* Core nav */}
          <Link href="/dashboard" onClick={() => setOpen(false)} className={linkClass('/dashboard')}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/calendar" onClick={() => setOpen(false)} className={linkClass('/calendar')}>
            <CalendarDays className="h-4 w-4" />
            Calendar
          </Link>

          {/* Modules */}
          {visibleModules.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 font-body text-[10px] font-semibold uppercase tracking-widest text-kinship-placeholder">
                Modules
              </div>
              {visibleModules.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.key} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}

          <hr className="my-1 border-kinship-surface-container" />

          {/* Cost Summary + Settings */}
          <Link href="/costs" onClick={() => setOpen(false)} className={linkClass('/costs')}>
            <Coins className="h-4 w-4" />
            Cost Summary
          </Link>

          <hr className="my-1 border-kinship-surface-container" />

          <div className="px-3 pt-3 pb-1 font-body text-[10px] font-semibold uppercase tracking-widest text-kinship-placeholder">
            Settings
          </div>
          <Link href="/settings" onClick={() => setOpen(false)} className={linkClass('/settings')}>
            <Settings className="h-4 w-4" />
            Profile
          </Link>
          <Link href="/settings/household" onClick={() => setOpen(false)} className={linkClass('/settings/household')}>
            <Users className="h-4 w-4" />
            Household
          </Link>

          <hr className="my-1 border-kinship-surface-container" />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-[13px] text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
