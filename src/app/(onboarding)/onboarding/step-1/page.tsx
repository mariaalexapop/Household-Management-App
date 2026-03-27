'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardLayout } from '@/components/onboarding/WizardLayout'
import { HouseholdTypeSelector } from '@/components/onboarding/HouseholdTypeSelector'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOnboardingStore } from '@/stores/onboarding'
import { step1Schema } from '@/lib/validations/onboarding'

export default function Step1Page() {
  const router = useRouter()
  const { householdName, householdType, setHouseholdName, setHouseholdType } =
    useOnboardingStore()
  const [errors, setErrors] = useState<{ householdName?: string; householdType?: string }>({})

  const handleNext = () => {
    const result = step1Schema.safeParse({ householdName, householdType })
    if (!result.success) {
      const fieldErrors: { householdName?: string; householdType?: string } = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof typeof fieldErrors
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    router.push('/onboarding/step-2')
  }

  return (
    <WizardLayout step={1} onNext={handleNext} nextLabel="Next">
      <h2 className="mb-6 font-display text-xl font-semibold text-kinship-on-surface">
        Tell us about your household
      </h2>

      <div className="mb-6 flex flex-col gap-1.5">
        <Label htmlFor="householdName">Household name</Label>
        <Input
          id="householdName"
          type="text"
          placeholder="e.g. The Smiths"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          aria-invalid={!!errors.householdName}
        />
        {errors.householdName && (
          <p className="text-sm text-destructive">{errors.householdName}</p>
        )}
      </div>

      <div>
        <p className="mb-3 font-body text-sm font-medium text-kinship-on-surface">
          Household type
        </p>
        <HouseholdTypeSelector selected={householdType} onSelect={setHouseholdType} />
        {errors.householdType && (
          <p className="mt-2 text-sm text-destructive">{errors.householdType}</p>
        )}
      </div>
    </WizardLayout>
  )
}
