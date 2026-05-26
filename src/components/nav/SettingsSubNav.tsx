'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sections = [
  { label: 'Profile', href: '/settings' },
  { label: 'Household', href: '/settings/household' },
  { label: 'Members', href: '/settings/household', anchor: 'members' },
  { label: 'Modules', href: '/settings/modules' },
  { label: 'Notifications', href: '/settings#notifications' },
  { label: 'Integrations', href: '#' },
  { label: 'Data & Privacy', href: '#' },
  { label: 'Billing', href: '#' },
]

export function SettingsSubNav() {
  const pathname = usePathname()

  function isActive(section: (typeof sections)[number]) {
    // Profile is active only on exact /settings
    if (section.label === 'Profile') return pathname === '/settings'
    // Household and Members both point to /settings/household
    if (section.href === '/settings/household') return pathname === '/settings/household'
    // Modules
    if (section.href === '/settings/modules') return pathname === '/settings/modules'
    // Notifications section on profile page
    if (section.label === 'Notifications') return false
    return false
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
      </div>
    </nav>
  )
}
