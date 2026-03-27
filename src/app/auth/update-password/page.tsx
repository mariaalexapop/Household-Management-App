import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = {
  title: 'Set new password — Kinship',
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-kinship-on-surface">
            Kinship
          </h1>
          <p className="mt-2 font-body text-kinship-on-surface/70">Set new password</p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-kinship-surface-container-lowest p-8 [box-shadow:0_20px_40px_rgba(45,51,55,0.06)]">
          <p className="mb-6 font-body text-sm text-kinship-on-surface/70">
            Choose a new password for your Kinship account.
          </p>
          <AuthForm mode="update-password" />
        </div>
      </div>
    </div>
  )
}
