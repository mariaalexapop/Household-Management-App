'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { emailExists } from '@/app/actions/auth'
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginFormData,
  type SignupFormData,
  type ResetPasswordFormData,
  type UpdatePasswordFormData,
} from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthMode = 'login' | 'signup' | 'reset' | 'update-password'

type FormData = LoginFormData | SignupFormData | ResetPasswordFormData | UpdatePasswordFormData

interface AuthFormProps {
  mode: AuthMode
  /** Invite token from /auth/signup?invite=TOKEN — threads through the verification flow */
  inviteToken?: string
  /** Pre-filled (read-only) email address from the invite */
  inviteEmail?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSchema(mode: AuthMode) {
  switch (mode) {
    case 'login':
      return loginSchema
    case 'signup':
      return signupSchema
    case 'reset':
      return resetPasswordSchema
    case 'update-password':
      return updatePasswordSchema
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuthForm({ mode, inviteToken, inviteEmail }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(getSchema(mode) as any),
    defaultValues: inviteEmail ? ({ email: inviteEmail } as Partial<FormData>) : undefined,
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      if (mode === 'login') {
        const { email, password } = data as LoginFormData
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          const exists = await emailExists(email)
          if (!exists) {
            setServerError('There is no account associated with this email. You need to sign up.')
          } else {
            setServerError('Incorrect password. Please try again.')
          }
          return
        }
        // Redirect to /dashboard — the dashboard Server Component uses Drizzle
        // (bypasses RLS) to check for a household and redirects to /onboarding
        // if needed. Querying household_members here via the browser client hits
        // a self-referential RLS policy that returns empty results.
        router.push('/dashboard')
      } else if (mode === 'signup') {
        const { email, password } = data as SignupFormData
        const callbackUrl = inviteToken
          ? `${window.location.origin}/api/auth/callback?invite=${inviteToken}`
          : `${window.location.origin}/api/auth/callback`
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
          },
        })
        if (error) {
          setServerError(error.message)
          return
        }
        // After signup, redirect to email verification page (preserve invite token)
        const verifyUrl = inviteToken
          ? `/auth/verify-email?email=${encodeURIComponent(email)}&invite=${inviteToken}`
          : `/auth/verify-email?email=${encodeURIComponent(email)}`
        router.push(verifyUrl)
      } else if (mode === 'reset') {
        const { email } = data as ResetPasswordFormData
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        })
        if (error) {
          setServerError(error.message)
          return
        }
        setSuccessMessage('Check your email for a password reset link.')
      } else if (mode === 'update-password') {
        const { password } = data as UpdatePasswordFormData
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          setServerError(error.message)
          return
        }
        // After successful password update, go to /dashboard.
        // The recovery session has limited DB permissions so we cannot reliably
        // query household_members here. The server-side layout handles the
        // household check and will redirect to /onboarding if needed.
        router.push('/dashboard')
      }
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const showEmail = mode !== 'update-password'
  const showPassword = mode === 'login' || mode === 'signup' || mode === 'update-password'
  const showConfirmPassword = mode === 'signup' || mode === 'update-password'

  const submitLabel = {
    login: 'Sign in',
    signup: 'Create account',
    reset: 'Send reset link',
    'update-password': 'Set new password',
  }[mode]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {showEmail && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            readOnly={mode === 'signup' && !!inviteEmail}
            className={mode === 'signup' && inviteEmail ? 'bg-kinship-surface-container text-kinship-on-surface/60 cursor-not-allowed' : ''}
            aria-invalid={'email' in errors && !!errors.email}
            {...register('email' as never)}
          />
          {'email' in errors && errors.email && (
            <p className="text-sm text-destructive">{errors.email.message as string}</p>
          )}
        </div>
      )}

      {showPassword && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">
            {mode === 'update-password' ? 'New password' : 'Password'}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            aria-invalid={'password' in errors && !!errors.password}
            {...register('password' as never)}
          />
          {'password' in errors && errors.password && (
            <p className="text-sm text-destructive">{errors.password.message as string}</p>
          )}
        </div>
      )}

      {showConfirmPassword && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!('confirmPassword' in errors && errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {'confirmPassword' in errors && errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message as string}
            </p>
          )}
        </div>
      )}

      {mode === 'login' && (
        <div className="text-right">
          <Link
            href="/auth/reset-password"
            className="text-sm text-kinship-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      )}

      {serverError && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      {successMessage && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-full bg-kinship-primary shadow-sm hover:bg-kinship-primary/90"
      >
        {isLoading ? 'Please wait…' : submitLabel}
      </Button>
    </form>
  )
}
