import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/nav/TopBar'
import { ChatPageClient } from './ChatPageClient'

export const metadata = { title: 'Ask Kinship — Kinship' }

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  return (
    <>
      <TopBar
        title="Kinship AI"
        subtitle="Reads your household's documents · privately"
      />
      <div className="flex-1 overflow-hidden px-6 py-2">
        <ChatPageClient />
      </div>
    </>
  )
}
