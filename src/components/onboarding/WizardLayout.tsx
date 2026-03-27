'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

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

export function WizardLayout({
  step,
  totalSteps = 3,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  isSubmitting = false,
  children,
}: WizardLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-kinship-surface px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-kinship-on-surface">Kinship</h1>
          <p className="mt-2 font-body text-kinship-on-surface/70">Set up your household</p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-kinship-surface-container-lowest p-8 [box-shadow:0_20px_40px_rgba(45,51,55,0.06)]">
          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                    s < step
                      ? 'bg-kinship-primary text-white'
                      : s === step
                        ? 'bg-kinship-primary text-white ring-2 ring-kinship-primary/30'
                        : 'bg-kinship-surface-container text-kinship-on-surface/40',
                  ].join(' ')}
                >
                  {s}
                </div>
                {s < totalSteps && (
                  <div
                    className={[
                      'h-px flex-1 w-8',
                      s < step ? 'bg-kinship-primary' : 'bg-kinship-surface-container',
                    ].join(' ')}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 font-body text-sm text-kinship-on-surface/60">
              Step {step} of {totalSteps}
            </span>
          </div>

          {/* Content */}
          <div className="mb-8">{children}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {step > 1 && onBack ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-1 text-kinship-on-surface/70"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {onNext && (
              <Button
                type="button"
                onClick={onNext}
                disabled={nextDisabled || isSubmitting}
                className="rounded-full bg-kinship-primary px-6 shadow-sm hover:bg-kinship-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating…' : nextLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
