'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const sections = [
  { label: 'Profile', href: '/settings' },
  { label: 'Household', href: '/settings/household' },
]

interface SettingsMobileMenuProps {
  initials: string
  avatarUrl?: string | null
}

export function SettingsMobileMenu({ initials, avatarUrl }: SettingsMobileMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string) {
    if (href === '/settings') return pathname === '/settings'
    return pathname.startsWith(href)
  }

  return (
    <div className="relative md:hidden" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-kinship-primary text-white font-display text-xs font-bold overflow-hidden"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          {sections.map((section) => {
            const active = isActive(section.href)
            return (
              <Link
                key={section.label}
                href={section.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 font-body text-[13px] transition-colors ${
                  active
                    ? 'bg-kinship-primary-surface font-semibold text-kinship-primary'
                    : 'text-kinship-on-surface-variant hover:bg-kinship-surface-container hover:text-kinship-on-surface'
                }`}
              >
                {section.label}
              </Link>
            )
          })}

          <hr className="my-1.5 border-kinship-surface-container" />

          <button
            onClick={handleLogout}
            className="block w-full text-left rounded-lg px-3 py-2.5 font-body text-[13px] text-red-600 transition-colors hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
