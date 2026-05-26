import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notifications, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/nav/TopBar'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  CheckSquare,
  CalendarHeart,
  Car,
  Shield,
  Monitor,
  Sparkles,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Notifications — Kinship' }

/* ------------------------------------------------------------------ */
/* Module colour + icon mapping                                       */
/* ------------------------------------------------------------------ */

type ModuleMeta = {
  Icon: typeof Bell
  lightClass: string
  darkClass: string
}

const MODULE_MAP: Record<string, ModuleMeta> = {
  task_assigned: {
    Icon: CheckSquare,
    lightClass: 'bg-module-chores-light',
    darkClass: 'text-module-chores-dark',
  },
  task_reminder: {
    Icon: CheckSquare,
    lightClass: 'bg-module-chores-light',
    darkClass: 'text-module-chores-dark',
  },
  activity_reminder: {
    Icon: CalendarHeart,
    lightClass: 'bg-module-kids-light',
    darkClass: 'text-module-kids-dark',
  },
  car_reminder: {
    Icon: Car,
    lightClass: 'bg-module-car-light',
    darkClass: 'text-module-car-dark',
  },
  insurance_expiry_reminder: {
    Icon: Shield,
    lightClass: 'bg-module-ins-light',
    darkClass: 'text-module-ins-dark',
  },
  insurance_payment_reminder: {
    Icon: Shield,
    lightClass: 'bg-module-ins-light',
    darkClass: 'text-module-ins-dark',
  },
  warranty_reminder: {
    Icon: Monitor,
    lightClass: 'bg-module-elec-light',
    darkClass: 'text-module-elec-dark',
  },
  document_ready: {
    Icon: Sparkles,
    lightClass: 'bg-kinship-primary-surface',
    darkClass: 'text-kinship-primary',
  },
}

const DEFAULT_META: ModuleMeta = {
  Icon: Bell,
  lightClass: 'bg-kinship-primary-surface',
  darkClass: 'text-kinship-primary',
}

function getMeta(type: string): ModuleMeta {
  return MODULE_MAP[type] ?? DEFAULT_META
}

/* ------------------------------------------------------------------ */
/* Friendly label per type                                            */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  task_assigned: 'Task assigned',
  task_reminder: 'Task reminder',
  activity_reminder: 'Activity reminder',
  car_reminder: 'Car reminder',
  insurance_expiry_reminder: 'Insurance expiring',
  insurance_payment_reminder: 'Insurance payment due',
  warranty_reminder: 'Warranty reminder',
  document_ready: 'Document ready',
}

function labelForType(type: string): string {
  return TYPE_LABELS[type] ?? 'Notification'
}

/* ------------------------------------------------------------------ */
/* Action link per type                                               */
/* ------------------------------------------------------------------ */

function actionForType(type: string): { label: string; href: string } | null {
  switch (type) {
    case 'task_assigned':
    case 'task_reminder':
      return { label: 'View chores', href: '/chores' }
    case 'activity_reminder':
      return { label: 'View kids', href: '/kids' }
    case 'car_reminder':
      return { label: 'View cars', href: '/cars' }
    case 'insurance_expiry_reminder':
    case 'insurance_payment_reminder':
      return { label: 'View insurance', href: '/insurance' }
    case 'warranty_reminder':
      return { label: 'View electronics', href: '/electronics' }
    case 'document_ready':
      return null
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Group helpers                                                       */
/* ------------------------------------------------------------------ */

type NotificationRow = {
  id: string
  type: string
  message: string
  readAt: Date | null
  createdAt: Date | null
}

function groupLabel(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  return 'Earlier'
}

function groupNotifications(rows: NotificationRow[]): Map<string, NotificationRow[]> {
  const groups = new Map<string, NotificationRow[]>()
  for (const row of rows) {
    const label = groupLabel(row.createdAt ?? new Date())
    const existing = groups.get(label) ?? []
    existing.push(row)
    groups.set(label, existing)
  }
  return groups
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify membership
  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  // Fetch notifications for current user
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      message: notifications.message,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  const grouped = groupNotifications(rows)

  return (
    <>
      <TopBar
        title="Notifications"
        subtitle="Everything Kinship has noticed for you"
        backHref="/dashboard"
        backLabel="Dashboard"
      />

      <main className="flex-1 overflow-auto px-6 py-2">
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-kinship-surface-container-lowest ring-miro p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-kinship-placeholder" />
            <p className="mt-3 font-display text-base font-semibold text-kinship-on-surface">
              You&apos;re all caught up
            </p>
            <p className="mt-1 font-body text-sm text-kinship-on-surface-variant">
              No notifications right now.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-kinship-surface-container-lowest ring-miro overflow-hidden">
            {Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group}>
                {/* Group header */}
                <div className="px-4 py-2.5 bg-kinship-surface">
                  <p className="font-display text-xs font-semibold uppercase tracking-wider text-kinship-on-surface-variant">
                    {group}
                  </p>
                </div>

                {/* Notification rows */}
                {items.map((n) => {
                  const { Icon, lightClass, darkClass } = getMeta(n.type)
                  const action = actionForType(n.type)
                  const unread = n.readAt === null

                  return (
                    <div
                      key={n.id}
                      className={`flex items-center gap-3.5 px-4 py-3.5 border-t border-kinship-outline-variant ${
                        unread ? 'bg-kinship-primary-surface' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${lightClass} ${darkClass} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[13px] text-kinship-on-surface font-medium">
                          {n.message}
                        </p>
                        <p className="font-body text-[11px] text-kinship-placeholder mt-0.5">
                          {labelForType(n.type)}
                          {' \u00b7 '}
                          {n.createdAt
                            ? formatDistanceToNow(n.createdAt, { addSuffix: true })
                            : ''}
                        </p>
                      </div>
                      {unread && (
                        <div className="w-2 h-2 rounded-full bg-kinship-primary shrink-0" />
                      )}
                      {action && (
                        <Button variant="outline" size="sm" render={<a href={action.href} />}>
                          {action.label}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
