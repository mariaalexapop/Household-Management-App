import Link from 'next/link'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { AuthForm } from '@/components/auth/AuthForm'
import { OAuthButton } from '@/components/auth/OAuthButton'
import { db } from '@/lib/db'
import { householdInvites, households } from '@/lib/db/schema'

export const metadata = {
  title: 'Create account — Kinship',
}

interface Props {
  searchParams: Promise<{ invite?: string }>
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams
  const inviteToken = params.invite

  let inviteEmail: string | undefined
  let householdName: string | undefined

  if (inviteToken) {
    const [invite] = await db
      .select({
        email: householdInvites.email,
        householdName: households.name,
      })
      .from(householdInvites)
      .innerJoin(households, eq(householdInvites.householdId, households.id))
      .where(
        and(
          eq(householdInvites.token, inviteToken),
          isNull(householdInvites.claimedAt),
          gt(householdInvites.expiresAt, new Date())
        )
      )
      .limit(1)

    inviteEmail = invite?.email ?? undefined
    householdName = invite?.householdName ?? undefined
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
            Kinship
          </h1>
          <p className="mt-2 font-body text-kinship-on-surface-variant">
            {householdName ? `You've been invited to join ${householdName}` : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-kinship-surface-container-lowest p-8 ring-miro">
          <AuthForm mode="signup" inviteToken={inviteToken} inviteEmail={inviteEmail} />

          {/* Only show OAuth for non-invited sign-ups */}
          {!inviteToken && (
            <>
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-kinship-surface-container" />
                <span className="font-body text-sm text-kinship-on-surface-variant">or</span>
                <div className="h-px flex-1 bg-kinship-surface-container" />
              </div>
              <OAuthButton />
            </>
          )}
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center font-body text-sm text-kinship-on-surface-variant">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-kinship-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
