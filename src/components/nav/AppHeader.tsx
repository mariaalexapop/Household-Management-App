'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { HamburgerMenu } from '@/components/nav/HamburgerMenu'
import { SearchPalette } from '@/components/search/SearchPalette'

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
          <button
            onClick={() => {
              // Trigger Cmd+K programmatically
              document.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
              )
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-kinship-on-surface-variant hover:bg-kinship-surface-container hover:text-kinship-on-surface"
            aria-label="Search (⌘K)"
          >
            <Search className="h-5 w-5" />
          </button>
          <NotificationBell />
          <HamburgerMenu />
        </div>
      </div>
      <SearchPalette />
    </header>
  )
}
