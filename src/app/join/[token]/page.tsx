import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { householdInvites, households, householdMembers } from '@/lib/db/schema'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata = {
  title: 'Join household — Kinship',
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params

  // Look up the invite — Drizzle bypasses RLS so no auth required here
  const [invite] = await db
    .select({
      householdId: householdInvites.householdId,
      householdName: households.name,
    })
    .from(householdInvites)
    .innerJoin(households, eq(householdInvites.householdId, households.id))
    .where(
      and(
        eq(householdInvites.token, token),
        isNull(householdInvites.claimedAt),
        gt(householdInvites.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!invite) {
    redirect('/auth/login?error=invite_invalid')
  }

  // If already authenticated, claim the invite immediately
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await db
      .update(householdInvites)
      .set({ claimedAt: new Date(), claimedBy: user.id })
      .where(
        and(
          eq(householdInvites.token, token),
          isNull(householdInvites.claimedAt),
          gt(householdInvites.expiresAt, new Date())
        )
      )

    await db
      .insert(householdMembers)
      .values({
        householdId: invite.householdId,
        userId: user.id,
        role: 'member',
        displayName: user.email ?? user.id,
      })
      .onConflictDoNothing()

    redirect('/dashboard')
  }

  // Not authenticated — show landing page
  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-kinship-on-surface">Kinship</h1>
        </div>

        <div className="rounded-lg bg-kinship-surface-container-lowest p-8 text-center [box-shadow:0_20px_40px_rgba(45,51,55,0.06)]">
          <h2 className="font-display text-xl font-semibold text-kinship-on-surface">
            You&apos;ve been invited
          </h2>
          <p className="mt-3 font-body text-sm text-kinship-on-surface/70">
            Join <strong className="text-kinship-on-surface">{invite.householdName}</strong> on
            Kinship to manage your household together.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/auth/signup?invite=${token}`}
              className={cn(buttonVariants(), 'w-full rounded-full bg-kinship-primary hover:bg-kinship-primary/90')}
            >
              Create an account
            </Link>
            <Link
              href={`/auth/login?next=/join/${token}`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full rounded-full')}
            >
              Log in to existing account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
