import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/household/ProfileForm'
import { DeleteAccountSection } from './DeleteAccountSection'

export const metadata = {
  title: 'Settings — Kinship',
}

/**
 * Settings page — Server Component.
 *
 * Sections:
 *   - Profile: display name + avatar (via ProfileForm)
 *   - Danger Zone: account deletion (via DeleteAccountSection)
 */
export default async function SettingsPage() {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch current user's household member row
  const memberRows = await db
    .select({
      displayName: householdMembers.displayName,
      avatarUrl: householdMembers.avatarUrl,
    })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  const member = memberRows[0]

  return (
    <div className="min-h-screen bg-kinship-surface">
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
          <p className="font-body text-sm text-kinship-on-surface/60">Settings</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-10">
        {/* Navigation links */}
        <nav className="flex gap-4 text-sm font-medium">
          <a
            href="/settings"
            className="text-kinship-primary border-b-2 border-kinship-primary pb-1"
          >
            Profile
          </a>
          <a
            href="/settings/modules"
            className="text-kinship-on-surface/60 hover:text-kinship-on-surface pb-1"
          >
            Modules
          </a>
        </nav>

        {/* Profile section */}
        <section>
          <h2 className="font-display text-xl font-semibold text-kinship-on-surface mb-4">
            Your Profile
          </h2>
          <ProfileForm
            initialDisplayName={member?.displayName ?? null}
            initialAvatarUrl={member?.avatarUrl ?? null}
          />
        </section>

        <hr className="border-kinship-surface-container" />

        {/* Danger Zone */}
        <section>
          <h2 className="font-display text-xl font-semibold text-red-600 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-kinship-on-surface/60 mb-4">
            Permanently delete your account and all associated household data.
            This action cannot be undone.
          </p>
          <DeleteAccountSection />
        </section>
      </main>
    </div>
  )
}
