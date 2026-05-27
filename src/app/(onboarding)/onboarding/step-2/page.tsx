'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardLayout } from '@/components/onboarding/WizardLayout'
import { ModuleSelector } from '@/components/onboarding/ModuleSelector'
import { useOnboardingStore } from '@/stores/onboarding'
import { step2Schema } from '@/lib/validations/onboarding'

export default function Step2Page() {
  const router = useRouter()
  const { activeModules, toggleModule } = useOnboardingStore()
  const [error, setError] = useState<string | null>(null)

  const handleBack = () => router.push('/onboarding/step-1')

  const handleNext = () => {
    const result = step2Schema.safeParse({ activeModules })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Select at least one module')
      return
    }
    setError(null)
    router.push('/onboarding/step-3')
  }

  return (
    <WizardLayout step={2} onBack={handleBack} onNext={handleNext} nextLabel="Next">
      <h2 className="font-display text-[30px] font-semibold tracking-tight leading-tight text-kinship-on-surface">
        Which modules do you need?
      </h2>
      <p className="mt-1.5 mb-6 font-body text-sm text-kinship-on-surface-variant max-w-[420px]">
        Pick what your household actually tracks — you can add or remove any of these later from settings.
      </p>

      <ModuleSelector selected={activeModules} onToggle={toggleModule} />

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </WizardLayout>
  )
}
