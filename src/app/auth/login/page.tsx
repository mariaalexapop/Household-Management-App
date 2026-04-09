import Link from 'next/link'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { AuthForm } from '@/components/auth/AuthForm'
import { OAuthButton } from '@/components/auth/OAuthButton'
import { db } from '@/lib/db'
import { householdInvites, households } from '@/lib/db/schema'

export const metadata = {
  title: 'Sign in — Kinship',
}

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams

  // If next points to /join/<token>, look up the household so we can show context
  let householdName: string | undefined
  let inviteToken: string | undefined

  const joinMatch = next?.match(/^\/join\/([^/?]+)/)
  if (joinMatch) {
    inviteToken = joinMatch[1]
    const [invite] = await db
      .select({ householdName: households.name })
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
    householdName = invite?.householdName
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
            {householdName ? `Sign in to join ${householdName}` : 'Welcome back'}
          </p>
        </div>

        {/* Invitation context banner */}
        {householdName && (
          <div className="mb-4 rounded-lg border border-kinship-primary/20 bg-kinship-primary/5 px-4 py-3">
            <p className="font-body text-sm text-kinship-on-surface">
              You&apos;ve been invited to join{' '}
              <strong className="font-semibold">{householdName}</strong>. Sign in to accept the invitation.
            </p>
            <p className="mt-1 font-body text-xs text-kinship-on-surface-variant">
              New to Kinship?{' '}
              <Link href={`/join/${inviteToken}`} className="font-medium text-kinship-primary hover:underline">
                Create an account instead
              </Link>
            </p>
          </div>
        )}

        {/* Invalid invite error */}
        {error === 'invite_invalid' && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="font-body text-sm text-destructive">
              This invitation link is invalid or has already expired. Ask the household admin to send you a new one.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl bg-kinship-surface-container-lowest p-8 ring-miro">
          <AuthForm mode="login" nextUrl={next} />

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-kinship-surface-container" />
            <span className="font-body text-sm text-kinship-on-surface-variant">or</span>
            <div className="h-px flex-1 bg-kinship-surface-container" />
          </div>

          <OAuthButton />
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center font-body text-sm text-kinship-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link
            href={inviteToken ? `/join/${inviteToken}` : '/auth/signup'}
            className="font-medium text-kinship-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
