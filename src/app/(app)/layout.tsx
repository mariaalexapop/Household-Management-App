import type { ReactNode } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { RealtimeProvider } from '@/components/realtime/RealtimeProvider'
import { ConnectionIndicator } from '@/components/realtime/ConnectionIndicator'

/**
 * Protected (app) layout.
 *
 * Server-queries the current user's household_id. If the user belongs to a
 * household, wraps children with RealtimeProvider so all protected pages get
 * live updates. ConnectionIndicator is rendered inside the provider so it can
 * read the connection status from context.
 *
 * Pages under /onboarding (the wizard) render outside this layout group and
 * therefore do not need realtime subscriptions.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  // Auth — use getUser() (not getSession()) per security conventions
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Individual pages handle auth redirects; layout is permissive to avoid
    // double-redirect issues during sign-in flows
    return <>{children}</>
  }

  // Fetch the household_id for this user
  const memberRow = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  const householdId = memberRow[0]?.householdId ?? null

  // If no household yet (user is mid-onboarding), render without realtime
  if (!householdId) {
    return <>{children}</>
  }

  return (
    <RealtimeProvider householdId={householdId}>
      <ConnectionIndicator />
      {children}
    </RealtimeProvider>
  )
}
