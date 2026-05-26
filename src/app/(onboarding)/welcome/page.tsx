import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  householdMembers,
  householdSettings,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Sparkles,
  CheckSquare,
  FileText,
  Car,
} from 'lucide-react'
import type { ModuleKey } from '@/stores/onboarding'

export const metadata = { title: 'Welcome — Kinship' }

/* ------------------------------------------------------------------ */
/* Next-action tiles                                                   */
/* ------------------------------------------------------------------ */

const NEXT_ACTIONS: {
  key: ModuleKey
  label: string
  href: string
  Icon: typeof CheckSquare
  lightClass: string
  darkClass: string
}[] = [
  {
    key: 'chores',
    label: 'Add your first chore',
    href: '/chores?action=new',
    Icon: CheckSquare,
    lightClass: 'bg-module-chores-light',
    darkClass: 'text-module-chores-dark',
  },
  {
    key: 'insurance',
    label: 'Upload a policy PDF',
    href: '/insurance?action=new',
    Icon: FileText,
    lightClass: 'bg-module-ins-light',
    darkClass: 'text-module-ins-dark',
  },
  {
    key: 'car',
    label: 'Log a car service',
    href: '/cars?action=new',
    Icon: Car,
    lightClass: 'bg-module-car-light',
    darkClass: 'text-module-car-dark',
  },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function WelcomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch membership + settings
  const [row] = await db
    .select({
      displayName: householdMembers.displayName,
      activeModules: householdSettings.activeModules,
    })
    .from(householdMembers)
    .innerJoin(
      householdSettings,
      eq(householdMembers.householdId, householdSettings.householdId)
    )
    .where(eq(householdMembers.userId, user.id))
    .limit(1)

  if (!row) redirect('/onboarding')

  const displayName =
    row.displayName ?? user.email?.split('@')[0] ?? 'there'
  const activeModules = (row.activeModules ?? []) as ModuleKey[]
  const moduleCount = activeModules.length

  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-lg text-center">
        {/* Large sparkle icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-kinship-primary">
          <Sparkles className="h-10 w-10 text-white" />
        </div>

        {/* Heading */}
        <h1 className="mt-8 font-display text-[28px] font-semibold tracking-tight text-kinship-on-surface">
          You&apos;re all set, {displayName}.
        </h1>

        {/* Subtitle */}
        <p className="mt-2 font-body text-base text-kinship-on-surface-variant">
          Your household is live.{' '}
          {moduleCount === 0
            ? 'No modules are turned on yet.'
            : `${moduleCount} ${moduleCount === 1 ? 'module is' : 'modules are'} turned on.`}
        </p>

        {/* Recommended next actions */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {NEXT_ACTIONS.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className={`flex flex-col items-center gap-3 rounded-2xl ${action.lightClass} p-6 transition-transform hover:scale-[1.03]`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 ${action.darkClass}`}
              >
                <action.Icon className="h-5 w-5" />
              </div>
              <p
                className={`font-body text-sm font-medium ${action.darkClass}`}
              >
                {action.label}
              </p>
            </Link>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="mt-10">
          <Button size="lg" render={<Link href="/dashboard" />}>
            Take me to the dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
