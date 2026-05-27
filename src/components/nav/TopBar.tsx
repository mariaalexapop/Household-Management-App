'use client'

import { useRouter } from 'next/navigation'
import { Bell, ChevronLeft, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { MobileAvatarMenu } from './MobileAvatarMenu'

interface TopBarProps {
  title: string
  subtitle?: string
  cta?: ReactNode
  backHref?: string
  backLabel?: string
}

export function TopBar({ title, subtitle, cta, backHref, backLabel }: TopBarProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex-1 min-w-0">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            className="mb-1 flex items-center gap-1 font-body text-xs text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            {backLabel ?? 'Back'}
          </button>
        )}
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-kinship-on-surface leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-[13px] text-kinship-on-surface-variant mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Search — icon on mobile, pill on sm+ */}
      <button
        onClick={() => {
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
          )
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-kinship-on-surface-variant hover:bg-kinship-surface-container transition-colors md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
          )
        }}
        className="hidden md:flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-kinship-surface-container px-3 py-1.5 text-kinship-placeholder font-body text-xs min-w-[180px] hover:bg-kinship-surface-container-low transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Ask Kinship or search...</span>
      </button>

      {/* Notification bell */}
      <button
        onClick={() => router.push('/notifications')}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-kinship-on-surface-variant hover:bg-kinship-surface-container transition-colors"
      >
        <Bell className="h-[18px] w-[18px]" />
        <div className="absolute -top-0.5 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-kinship-primary text-[9px] font-bold text-white">
          3
        </div>
      </button>

      {/* Page CTA */}
      {cta}

      {/* Mobile avatar menu — visible only on mobile */}
      <MobileAvatarMenu />
    </div>
  )
}
