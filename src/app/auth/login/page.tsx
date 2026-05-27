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
    <div className="grid h-screen md:grid-cols-2">
      {/* Left panel — branding */}
      <div
        className="relative hidden overflow-hidden bg-kinship-primary text-white md:block"
        style={{ padding: '40px 36px' }}
      >
        {/* Logo — top-left */}
        <div style={{ position: 'absolute', top: 40, left: 36 }}>
          <Link href="/marketing" className="flex items-center gap-2.5">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-white text-kinship-primary font-display font-bold text-sm">
              K
            </div>
            <span className="font-display font-semibold text-[17px]">Kinship</span>
          </Link>
        </div>

        {/* Welcome text — bottom-left */}
        <div style={{ position: 'absolute', bottom: 40, left: 36, right: 36, zIndex: 10 }}>
          <h2 style={{ fontSize: 38, lineHeight: 1.1, letterSpacing: '-0.03em' }} className="font-display font-semibold">
            Welcome back to<br />your household.
          </h2>
          <p className="mt-3 max-w-[260px] font-body text-[13px] leading-relaxed opacity-80">
            Chores, cars, insurance, kids — everything waiting where you left it.
          </p>
        </div>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 220, height: 220, borderRadius: '50%', background: '#ffc6c6', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 120, right: -80, width: 180, height: 180, borderRadius: '50%', background: '#c3faf5', opacity: 0.35 }} />
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-kinship-surface px-10 py-12">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <h1 className="font-display text-[26px] font-semibold tracking-tight leading-tight text-kinship-on-surface">
            Sign in
          </h1>
          <p className="mt-1 mb-5 font-body text-[13px] text-kinship-on-surface-variant">
            {householdName ? `Sign in to join ${householdName}` : 'to your Kinship account'}
          </p>

          {/* Invitation context banner */}
          {householdName && (
            <div className="mb-4 rounded-lg border border-kinship-primary/20 bg-kinship-primary/5 px-4 py-3">
              <p className="font-body text-sm text-kinship-on-surface">
                You&apos;ve been invited to join{' '}
                <strong className="font-semibold">{householdName}</strong>.
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
                This invitation link is invalid or has already expired.
              </p>
            </div>
          )}

          {/* Google OAuth */}
          <OAuthButton />

          {/* Divider */}
          <div className="my-5 flex items-center gap-2">
            <div className="h-px flex-1 bg-kinship-outline-variant" />
            <span className="font-body text-[11px] text-kinship-placeholder select-none">or</span>
            <div className="h-px flex-1 bg-kinship-outline-variant" />
          </div>

          {/* Email + password form */}

          <AuthForm mode="login" nextUrl={next} />

          {/* Footer link */}
          <p className="mt-5 text-center font-body text-xs text-kinship-on-surface-variant">
            New to Kinship?{' '}
            <Link
              href={inviteToken ? `/join/${inviteToken}` : '/auth/signup'}
              className="font-semibold text-kinship-primary hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
