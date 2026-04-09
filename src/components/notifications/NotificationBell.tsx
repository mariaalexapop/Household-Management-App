'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useRealtime } from '@/components/realtime/RealtimeProvider'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  const { notifications, unreadCount } = useRealtime()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
        className="relative p-2 rounded-md hover:bg-kinship-surface-container transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Bell className="h-5 w-5 text-kinship-on-surface" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-kinship-primary text-white text-[10px] font-semibold flex items-center justify-center px-1"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
