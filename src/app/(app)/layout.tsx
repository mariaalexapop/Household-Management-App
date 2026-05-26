import type { ReactNode } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { RealtimeProvider } from '@/components/realtime/RealtimeProvider'
import { ConnectionIndicator } from '@/components/realtime/ConnectionIndicator'
import { ChatbotProvider } from '@/components/chatbot/ChatbotProvider'
import { ChatbotFab } from '@/components/chatbot/ChatbotFab'
import { ChatbotDock } from '@/components/chatbot/ChatbotDock'
import { BottomNav } from '@/components/nav/BottomNav'
import { Sidebar } from '@/components/nav/Sidebar'
import { SearchPalette } from '@/components/search/SearchPalette'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <>{children}</>
  }

  // Fetch user's membership + display info
  const [memberRow] = await db
    .select({
      householdId: householdMembers.householdId,
      displayName: householdMembers.displayName,
      avatarUrl: householdMembers.avatarUrl,
    })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  const householdId = memberRow?.householdId ?? null

  if (!householdId) {
    return <>{children}</>
  }

  const displayName = memberRow?.displayName ?? user.email?.split('@')[0] ?? 'User'
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <RealtimeProvider householdId={householdId} userId={user.id}>
      <ChatbotProvider>
        <ConnectionIndicator />
        <div className="flex min-h-screen bg-kinship-surface">
          <Sidebar
            userName={displayName}
            userInitials={initials}
            userEmail={user.email}
          />
          <main className="flex-1 min-w-0 flex flex-col mobile-only-pb">
            {children}
          </main>
        </div>
        <ChatbotFab />
        <ChatbotDock />
        <BottomNav />
        <SearchPalette />
      </ChatbotProvider>
    </RealtimeProvider>
  )
}
