import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers, householdSettings, households } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { SignOutButton } from '@/components/dashboard/SignOutButton'
import type { ModuleKey } from '@/stores/onboarding'

export const metadata = {
  title: 'Dashboard — Kinship',
}

export default async function DashboardPage() {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch household settings for the current user
  const [row] = await db
    .select({
      householdName: households.name,
      activeModules: householdSettings.activeModules,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .innerJoin(householdSettings, eq(householdMembers.householdId, householdSettings.householdId))
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (!row) {
    redirect('/onboarding')
  }

  const activeModules = (row.activeModules ?? []) as ModuleKey[]

  return (
    <div className="min-h-screen bg-kinship-surface">
      {/* Header */}
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface/60">{row.householdName}</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-6 font-display text-2xl font-semibold text-kinship-on-surface">
          Your household
        </h2>
        <DashboardGrid activeModules={activeModules} />
      </main>
    </div>
  )
}
