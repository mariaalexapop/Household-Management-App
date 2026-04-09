import Link from 'next/link'
import { ResendButton } from './ResendButton'

export const metadata = {
  title: 'Check your email — Kinship',
}

interface Props {
  searchParams: Promise<{ email?: string; invite?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const email = params.email ?? 'your email address'
  const inviteToken = params.invite

  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
            Kinship
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-kinship-surface-container-lowest p-8 text-center ring-miro">
          {/* Mail icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kinship-surface-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-kinship-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0-10.5 7.125L2.25 6.75"
              />
            </svg>
          </div>

          <h2 className="font-display text-xl font-semibold text-kinship-on-surface">
            Check your inbox
          </h2>
          <p className="mt-3 font-body text-sm text-kinship-on-surface-variant">
            We sent a verification link to{' '}
            <strong className="text-kinship-on-surface">{email}</strong>.
            Click the link in the email to activate your Kinship account.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="font-body text-xs text-kinship-on-surface-variant">
              Didn&apos;t receive the email? Check your spam folder or resend it.
            </p>
            {email !== 'your email address' && <ResendButton email={email} inviteToken={inviteToken} />}
          </div>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center font-body text-sm text-kinship-on-surface-variant">
          <Link
            href="/auth/login"
            className="font-medium text-kinship-primary hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
