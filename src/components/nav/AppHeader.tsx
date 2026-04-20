'use client'

import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { HamburgerMenu } from '@/components/nav/HamburgerMenu'

interface AppHeaderProps {
  subtitle: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  return (
    <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/dashboard" className="group min-w-0">
          <h1 className="font-display text-xl font-semibold text-kinship-on-surface group-hover:text-kinship-primary transition-colors">Kinship</h1>
          <p className="font-body text-sm text-kinship-on-surface-variant truncate">{subtitle}</p>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <HamburgerMenu />
        </div>
      </div>
    </header>
  )
}
