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
      <h2 className="mb-2 font-display text-xl font-semibold text-kinship-on-surface">
        Which modules do you need?
      </h2>
      <p className="mb-6 font-body text-sm text-kinship-on-surface-variant">
        Select everything that applies. You can change this later.
      </p>

      <ModuleSelector selected={activeModules} onToggle={toggleModule} />

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </WizardLayout>
  )
}
