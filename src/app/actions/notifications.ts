'use server'

import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

/**
 * Marks all unread notifications for the current user as read.
 * Called when the user opens the NotificationDropdown.
 */
export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { success: false }

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))

  return { success: true }
}
