'use client'

import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, FileText, Sparkles } from 'lucide-react'
import type { NotificationItem } from '@/components/realtime/RealtimeProvider'
import { markAllNotificationsRead } from '@/app/actions/notifications'

type NotificationMeta = {
  label: string
  Icon: typeof Bell
  iconClass: string
}

function getNotificationMeta(type: string): NotificationMeta {
  switch (type) {
    case 'document_ready':
      return {
        label: 'Document ready',
        Icon: Sparkles,
        iconClass: 'text-kinship-primary',
      }
    case 'task_assigned':
      return { label: 'Task assigned', Icon: FileText, iconClass: 'text-kinship-primary' }
    case 'task_reminder':
      return { label: 'Task reminder', Icon: Bell, iconClass: 'text-kinship-primary' }
    case 'warranty_reminder':
      return { label: 'Warranty reminder', Icon: Bell, iconClass: 'text-kinship-primary' }
    case 'insurance_expiry_reminder':
      return { label: 'Insurance expiring', Icon: Bell, iconClass: 'text-kinship-primary' }
    case 'insurance_payment_reminder':
      return { label: 'Insurance payment due', Icon: Bell, iconClass: 'text-kinship-primary' }
    case 'activity_reminder':
      return { label: 'Activity reminder', Icon: Bell, iconClass: 'text-kinship-primary' }
    case 'car_reminder':
      return { label: 'Car reminder', Icon: Bell, iconClass: 'text-kinship-primary' }
    default:
      return { label: 'Notification', Icon: Bell, iconClass: 'text-kinship-primary' }
  }
}

interface NotificationDropdownProps {
  notifications: NotificationItem[]
  onClose: () => void
}

export function NotificationDropdown({ notifications, onClose }: NotificationDropdownProps) {
  // Mark all unread as read when dropdown opens
  useEffect(() => {
    const unread = notifications.filter((n) => n.readAt === null)
    if (unread.length > 0) {
      markAllNotificationsRead().catch(console.error)
    }
  }, []) // run once on mount — eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        className="absolute right-0 top-full z-20 mt-2 w-80 rounded-2xl bg-white ring-miro border border-kinship-surface-container"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="p-4 border-b border-kinship-surface-container">
          <p className="font-display text-sm font-semibold text-kinship-on-surface">
            Notifications
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="font-body text-base text-kinship-on-surface">
                You&apos;re all caught up
              </p>
              <p className="font-body text-sm text-kinship-on-surface-variant">
                No new notifications right now.
              </p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => {
                const { label, Icon, iconClass } = getNotificationMeta(n.type)
                return (
                  <li
                    key={n.id}
                    className={`px-4 py-3 border-b border-kinship-surface-container/50 last:border-0 ${
                      n.readAt === null ? 'bg-kinship-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconClass}`} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xs font-semibold text-kinship-on-surface">
                          {label}
                        </p>
                        <p className="font-body text-sm text-kinship-on-surface">{n.message}</p>
                        <p className="font-body text-xs text-kinship-on-surface-variant mt-0.5">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
