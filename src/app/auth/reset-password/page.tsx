import Link from 'next/link'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = {
  title: 'Reset your password — Kinship',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
            Kinship
          </h1>
          <p className="mt-2 font-body text-kinship-on-surface-variant">Reset your password</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-kinship-surface-container-lowest p-8 ring-miro">
          <p className="mb-6 font-body text-sm text-kinship-on-surface-variant">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <AuthForm mode="reset" />
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
