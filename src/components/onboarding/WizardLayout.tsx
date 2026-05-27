'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

interface WizardLayoutProps {
  step: 1 | 2 | 3
  totalSteps?: number
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  isSubmitting?: boolean
  children: React.ReactNode
}

const STEP_LABELS = ['Household', 'Modules', 'Summary']

export function WizardLayout({
  step,
  totalSteps = 3,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isSubmitting = false,
  children,
}: WizardLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-kinship-surface md:grid md:grid-cols-[260px_1fr] md:gap-6 md:p-6">
      {/* Left sidebar — desktop only */}
      <div className="hidden md:flex flex-col rounded-2xl bg-white p-5 ring-miro">
        {/* Brand */}
        <Link href="/marketing" className="mb-5 flex items-center gap-2.5">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-kinship-primary font-display text-xs font-bold text-white">
            K
          </div>
          <span className="font-display font-semibold text-[16px] text-kinship-on-surface">
            Kinship
          </span>
        </Link>

        {/* Steps */}
        <div className="flex flex-col gap-0.5">
          {STEP_LABELS.slice(0, totalSteps).map((label, i) => {
            const stepNum = i + 1
            const isDone = stepNum < step
            const isActive = stepNum === step

            return (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2.5 font-body text-[13px] ${
                  isActive
                    ? 'font-semibold text-kinship-on-surface'
                    : 'font-normal text-kinship-on-surface-variant'
                }`}
              >
                <div
                  className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold ${
                    isDone
                      ? 'bg-kinship-success-surface text-kinship-success'
                      : isActive
                        ? 'bg-kinship-primary-surface text-kinship-primary'
                        : 'bg-kinship-surface-container text-kinship-placeholder'
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : stepNum}
                </div>
                {label}
              </div>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Step counter */}
        <p className="font-body text-[11px] text-kinship-placeholder">
          Step {step} of {totalSteps}
        </p>
      </div>

      {/* Mobile top bar with progress */}
      <div className="flex items-center gap-3 border-b border-kinship-surface-container bg-white px-4 py-3 md:hidden">
        <Link href="/marketing" className="flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-kinship-primary font-display text-xs font-bold text-white">
            K
          </div>
          <span className="font-display font-semibold text-[16px] text-kinship-on-surface">
            Kinship
          </span>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {STEP_LABELS.slice(0, totalSteps).map((label, i) => {
            const stepNum = i + 1
            const isDone = stepNum < step
            const isActive = stepNum === step
            return (
              <div
                key={label}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  isDone
                    ? 'bg-kinship-success'
                    : isActive
                      ? 'bg-kinship-primary'
                      : 'bg-kinship-surface-container'
                }`}
              />
            )
          })}
        </div>
        <p className="ml-1 font-body text-xs text-kinship-placeholder">
          {step}/{totalSteps}
        </p>
      </div>

      {/* Right content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white px-5 py-6 md:rounded-[40px] md:p-12 md:ring-miro">
        {/* Step label */}
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-kinship-placeholder">
          Step {step} of {totalSteps}
        </p>

        {/* Content */}
        <div className="mt-2 flex-1 overflow-auto">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-6">
          {step > 1 && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="font-body text-[13px] font-medium text-kinship-primary hover:underline"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex-1" />

          {onNext && (
            <>
              {step === totalSteps ? null : (
                <span className="hidden font-body text-xs text-kinship-placeholder sm:inline">
                  {nextDisabled ? 'Select to continue' : ''}
                </span>
              )}
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled || isSubmitting}
                className="rounded-full bg-kinship-primary px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-kinship-primary-pressed transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating…' : nextLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
