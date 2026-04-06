import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/household/ProfileForm'
import { Label } from '@/components/ui/label'
import { DeleteAccountSection } from './DeleteAccountSection'
import { NotificationToggle } from './NotificationToggle'

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
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface/60">Settings</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">
              Dashboard
            </Link>
            <Link href="/household" className="font-body text-sm text-kinship-primary hover:underline">
              Manage household
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-10">
        {/* Navigation links */}
        <nav className="flex gap-4 text-sm font-medium">
          <Link
            href="/settings"
            className="text-kinship-primary border-b-2 border-kinship-primary pb-1"
          >
            Profile
          </Link>
          <Link
            href="/settings/modules"
            className="text-kinship-on-surface/60 hover:text-kinship-on-surface pb-1"
          >
            Modules
          </Link>
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

        {/* Notifications */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-kinship-on-surface">
              Notifications
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              Manage how you receive notifications
            </p>
          </div>
          <div className="rounded-lg bg-kinship-surface-container-lowest p-4 flex items-center justify-between gap-4">
            <div>
              <Label
                htmlFor="email-assign-toggle"
                className="font-body text-sm font-medium text-kinship-on-surface"
              >
                Email me when I&apos;m assigned a task
              </Label>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Receive an email notification when a household member assigns a task to you.
              </p>
            </div>
            <NotificationToggle defaultEnabled={true} />
          </div>
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
