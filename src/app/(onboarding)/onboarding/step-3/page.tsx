'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardLayout } from '@/components/onboarding/WizardLayout'
import { useOnboardingStore } from '@/stores/onboarding'
import { createHousehold } from '@/app/actions/onboarding'

const TYPE_LABELS: Record<string, string> = {
  couple: 'Couple',
  family_with_kids: 'Family with Kids',
  flatmates: 'Flatmates',
  single: 'Single',
}

const MODULE_LABELS: Record<string, string> = {
  chores: 'Home Chores',
  car: 'Car Maintenance',
  insurance: 'Insurance',
  electronics: 'Electronics',
  kids: 'Kids Activities',
}

export default function Step3Page() {
  const router = useRouter()
  const { householdName, householdType, activeModules, reset } = useOnboardingStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBack = () => router.push('/onboarding/step-2')

  const handleCreate = async () => {
    if (!householdType) {
      setError('Please complete step 1 first.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createHousehold({
      householdName,
      householdType,
      activeModules,
    })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    reset()
    router.push('/dashboard')
  }

  return (
    <WizardLayout
      step={3}
      onBack={handleBack}
      onNext={handleCreate}
      nextLabel="Create Household"
      isSubmitting={isSubmitting}
    >
      <h2 className="mb-6 font-display text-xl font-semibold text-kinship-on-surface">
        Review your household
      </h2>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-kinship-surface-container p-4">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-kinship-on-surface/50">
            Household name
          </p>
          <p className="mt-1 font-display text-base font-semibold text-kinship-on-surface">
            {householdName || <span className="text-kinship-on-surface/40">Not set</span>}
          </p>
        </div>

        <div className="rounded-lg bg-kinship-surface-container p-4">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-kinship-on-surface/50">
            Type
          </p>
          <p className="mt-1 font-display text-base font-semibold text-kinship-on-surface">
            {householdType
              ? TYPE_LABELS[householdType]
              : <span className="text-kinship-on-surface/40">Not set</span>}
          </p>
        </div>

        <div className="rounded-lg bg-kinship-surface-container p-4">
          <p className="font-body text-xs font-medium uppercase tracking-wide text-kinship-on-surface/50">
            Modules
          </p>
          {activeModules.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1">
              {activeModules.map((m) => (
                <li key={m} className="font-body text-sm text-kinship-on-surface">
                  {MODULE_LABELS[m]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 font-body text-sm text-kinship-on-surface/40">None selected</p>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </WizardLayout>
  )
}
