import Link from 'next/link'
import { AuthForm } from '@/components/auth/AuthForm'
import { OAuthButton } from '@/components/auth/OAuthButton'

export const metadata = {
  title: 'Sign in — Kinship',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-kinship-on-surface">
            Kinship
          </h1>
          <p className="mt-2 font-body text-kinship-on-surface/70">Welcome back</p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-kinship-surface-container-lowest p-8 [box-shadow:0_20px_40px_rgba(45,51,55,0.06)]">
          <AuthForm mode="login" />

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-kinship-surface-container" />
            <span className="font-body text-sm text-kinship-on-surface/50">or</span>
            <div className="h-px flex-1 bg-kinship-surface-container" />
          </div>

          <OAuthButton />
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center font-body text-sm text-kinship-on-surface/70">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-kinship-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
