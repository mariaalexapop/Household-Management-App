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
            Start organising<br />your household.
          </h2>
          <p className="mt-3 max-w-[260px] font-body text-[13px] leading-relaxed opacity-80">
            Chores, cars, insurance, kids — everything in one calm place.
          </p>
        </div>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 220, height: 220, borderRadius: '50%', background: '#d4f5c3', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 120, right: -80, width: 180, height: 180, borderRadius: '50%', background: '#d9d4ff', opacity: 0.35 }} />
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-kinship-surface px-10 py-12">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <h1 className="font-display text-[26px] font-semibold tracking-tight leading-tight text-kinship-on-surface">
            Create account
          </h1>
          <p className="mt-1 mb-5 font-body text-[13px] text-kinship-on-surface-variant">
            {householdName ? `Join ${householdName} on Kinship` : 'Get your household organised'}
          </p>

          {/* Google OAuth */}
          <OAuthButton inviteToken={inviteToken} />

          <div className="my-5 flex items-center gap-2">
            <div className="h-px flex-1 bg-kinship-outline-variant" />
            <span className="font-body text-[11px] text-kinship-placeholder select-none">or</span>
            <div className="h-px flex-1 bg-kinship-outline-variant" />
          </div>

          {/* Signup form */}
          <AuthForm mode="signup" inviteToken={inviteToken} inviteEmail={inviteEmail} />

          {/* Footer link */}
          <p className="mt-5 text-center font-body text-xs text-kinship-on-surface-variant">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-kinship-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
