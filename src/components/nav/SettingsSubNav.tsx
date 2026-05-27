'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const sections = [
  { label: 'Profile', href: '/settings' },
  { label: 'Household', href: '/settings/household' },
  { label: 'Integrations', href: '#' },
  { label: 'Data & Privacy', href: '#' },
  { label: 'Billing', href: '#' },
]

export function SettingsSubNav() {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(section: (typeof sections)[number]) {
    if (section.label === 'Profile') return pathname === '/settings'
    if (section.href === '/settings/household') return pathname === '/settings/household'
    return false
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="rounded-2xl bg-white ring-miro p-3 h-fit sticky top-2">
      <div className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const active = isActive(section)
          return (
            <Link
              key={section.label}
              href={section.href}
              className={`block rounded-lg px-3 py-2 font-body text-[13px] transition-colors ${
                active
                  ? 'bg-kinship-primary-surface font-semibold text-kinship-primary'
                  : 'text-kinship-on-surface-variant hover:bg-kinship-surface-container hover:text-kinship-on-surface'
              }`}
            >
              {section.label}
            </Link>
          )
        })}

        <hr className="my-1 border-kinship-surface-container" />

        <button
          onClick={handleLogout}
          className="block w-full text-left rounded-lg px-3 py-2 font-body text-[13px] text-red-600 transition-colors hover:bg-red-50"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
