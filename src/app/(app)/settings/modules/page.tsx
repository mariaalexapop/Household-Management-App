import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers, householdSettings } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ModuleToggleList } from './ModuleToggleList'

export const metadata = {
  title: 'Module Settings — Kinship',
}

const MODULE_LABELS: Record<string, string> = {
  chores: 'Chores',
  car: 'Car & Vehicle',
  insurance: 'Insurance',
  electronics: 'Electronics',
  kids: 'Kids & Activities',
}

/**
 * Module settings page — Server Component.
 *
 * Fetches current active_modules from household_settings and renders the
 * ModuleToggleList client component pre-checked accordingly.
 */
export default async function ModulesSettingsPage() {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch household settings
  const rows = await db
    .select({
      householdId: householdMembers.householdId,
      activeModules: householdSettings.activeModules,
    })
    .from(householdMembers)
    .innerJoin(
      householdSettings,
      eq(householdMembers.householdId, householdSettings.householdId)
    )
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  const row = rows[0]
  if (!row) {
    redirect('/onboarding')
  }

  const activeModules = (row.activeModules ?? []) as string[]

  return (
    <div className="min-h-screen bg-kinship-surface">
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
          <p className="font-body text-sm text-kinship-on-surface/60">Module Settings</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Navigation links */}
        <nav className="flex gap-4 text-sm font-medium mb-10">
          <Link
            href="/settings"
            className="text-kinship-on-surface/60 hover:text-kinship-on-surface pb-1"
          >
            Profile
          </Link>
          <Link
            href="/settings/modules"
            className="text-kinship-primary border-b-2 border-kinship-primary pb-1"
          >
            Modules
          </Link>
        </nav>

        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-kinship-on-surface">
            Household Modules
          </h2>
          <p className="mt-1 text-sm text-kinship-on-surface/60">
            Enable or disable modules to customise your household dashboard.
          </p>
        </div>

        <ModuleToggleList
          initialActiveModules={activeModules}
          moduleLabels={MODULE_LABELS}
        />
      </main>
    </div>
  )
}
