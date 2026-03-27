'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
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

export function AuthForm({ mode }: AuthFormProps) {
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
          setServerError(error.message)
          return
        }
        // Check if user has a household to determine redirect destination
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: members } = await supabase
            .from('household_members')
            .select('household_id')
            .eq('user_id', userData.user.id)
            .limit(1)

          if (members && members.length > 0) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        } else {
          router.push('/dashboard')
        }
      } else if (mode === 'signup') {
        const { email, password } = data as SignupFormData
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })
        if (error) {
          setServerError(error.message)
          return
        }
        // After signup, redirect to email verification page
        router.push('/auth/verify-email?email=' + encodeURIComponent(email))
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
        // After successful password update, check household and redirect
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: members } = await supabase
            .from('household_members')
            .select('household_id')
            .eq('user_id', userData.user.id)
            .limit(1)

          if (members && members.length > 0) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        } else {
          router.push('/dashboard')
        }
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
