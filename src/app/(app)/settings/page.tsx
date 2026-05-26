import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/household/ProfileForm'
import { Label } from '@/components/ui/label'
import { DeleteAccountSection } from './DeleteAccountSection'
import { TopBar } from '@/components/nav/TopBar'
import { NotificationToggle } from './NotificationToggle'
import { SettingsSubNav } from '@/components/nav/SettingsSubNav'

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
    <>
      <TopBar title="Settings" subtitle="Household, members & modules" />

      <div className="flex-1 overflow-auto px-6 py-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
          {/* Left sub-nav */}
          <div className="hidden md:block">
            <SettingsSubNav />
          </div>

          {/* Right content */}
          <main className="space-y-10">
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
            <section id="notifications" className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-kinship-on-surface">
                  Notifications
                </h2>
                <p className="font-body text-sm text-kinship-on-surface-variant">
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
                  <p className="font-body text-xs text-kinship-on-surface-variant mt-0.5">
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
                Delete Account
              </h2>
              <p className="font-body text-sm text-kinship-on-surface-variant mb-4">
                Permanently delete your account and all associated household data.
                This action cannot be undone.
              </p>
              <DeleteAccountSection />
            </section>
          </main>
        </div>
      </div>
    </>
  )
}
