'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Info } from 'lucide-react'
import { WizardLayout } from '@/components/onboarding/WizardLayout'
import { HouseholdTypeSelector } from '@/components/onboarding/HouseholdTypeSelector'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOnboardingStore } from '@/stores/onboarding'
import { step1Schema } from '@/lib/validations/onboarding'

export default function Step1Page() {
  const router = useRouter()
  const {
    householdName, householdType,
    setHouseholdName, setHouseholdType,
    partnerEmail, setPartnerEmail,
    flatmateEmails, setFlatmateEmails,
    kidNames, setKidNames,
  } = useOnboardingStore()
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

  // Flatmate email helpers
  function updateFlatmateEmail(index: number, value: string) {
    const next = [...flatmateEmails]
    next[index] = value
    setFlatmateEmails(next)
  }
  function addFlatmateEmail() {
    setFlatmateEmails([...flatmateEmails, ''])
  }
  function removeFlatmateEmail(index: number) {
    setFlatmateEmails(flatmateEmails.filter((_, i) => i !== index))
  }

  // Kid name helpers
  function updateKidName(index: number, value: string) {
    const next = [...kidNames]
    next[index] = value
    setKidNames(next)
  }
  function addKidName() {
    setKidNames([...kidNames, ''])
  }
  function removeKidName(index: number) {
    setKidNames(kidNames.filter((_, i) => i !== index))
  }

  return (
    <WizardLayout step={1} onNext={handleNext} nextLabel="Continue">
      <h2 className="font-display text-[30px] font-semibold tracking-tight leading-tight text-kinship-on-surface">
        Tell us about your household
      </h2>
      <p className="mt-1.5 mb-6 font-body text-sm text-kinship-on-surface-variant max-w-[420px]">
        Name your household and pick the type that best describes who lives there.
      </p>

      {/* Household name */}
      <div className="mb-6 flex flex-col gap-1.5">
        <Label htmlFor="householdName">Household name</Label>
        <Input
          id="householdName"
          type="text"
          placeholder="e.g. The Smiths"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          aria-invalid={!!errors.householdName}
          className="h-10 rounded-xl"
        />
        {errors.householdName && (
          <p className="text-sm text-destructive">{errors.householdName}</p>
        )}
      </div>

      {/* Household type */}
      <div>
        <p className="mb-3 font-body text-sm font-medium text-kinship-on-surface">
          Household type
        </p>
        <HouseholdTypeSelector selected={householdType} onSelect={setHouseholdType} />
        {errors.householdType && (
          <p className="mt-2 text-sm text-destructive">{errors.householdType}</p>
        )}
      </div>

      {/* Dynamic fields based on household type */}
      {householdType === 'couple' && (
        <div className="mt-6 rounded-xl border border-kinship-outline-variant bg-kinship-surface p-4">
          <Label htmlFor="partnerEmail" className="text-sm">
            Invite your partner <span className="text-kinship-placeholder">(optional)</span>
          </Label>
          <Input
            id="partnerEmail"
            type="email"
            placeholder="partner@email.com"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            className="mt-1.5 h-10 rounded-xl"
          />
          <p className="mt-1.5 font-body text-[11px] text-kinship-placeholder">
            They&apos;ll get an invite email after you create the household.
          </p>
        </div>
      )}

      {householdType === 'family_with_kids' && (
        <div className="mt-6 flex flex-col gap-4">
          {/* Partner invite */}
          <div className="rounded-xl border border-kinship-outline-variant bg-kinship-surface p-4">
            <Label htmlFor="partnerEmail" className="text-sm">
              Invite your partner <span className="text-kinship-placeholder">(optional)</span>
            </Label>
            <Input
              id="partnerEmail"
              type="email"
              placeholder="partner@email.com"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              className="mt-1.5 h-10 rounded-xl"
            />
          </div>

          {/* Kids names */}
          <div className="rounded-xl border border-kinship-outline-variant bg-kinship-surface p-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">
                Kids&apos; names <span className="text-kinship-placeholder">(optional)</span>
              </Label>
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-kinship-placeholder cursor-help" />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-kinship-on-surface px-3 py-1.5 font-body text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Used in the Kids Activities module only
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {kidNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={`Child ${i + 1} name`}
                    value={name}
                    onChange={(e) => updateKidName(i, e.target.value)}
                    className="h-10 rounded-xl"
                  />
                  {kidNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKidName(i)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-kinship-placeholder hover:bg-kinship-destructive-surface hover:text-kinship-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addKidName}
              className="mt-2 flex items-center gap-1.5 font-body text-xs font-medium text-kinship-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add another child
            </button>
          </div>
        </div>
      )}

      {householdType === 'flatmates' && (
        <div className="mt-6 rounded-xl border border-kinship-outline-variant bg-kinship-surface p-4">
          <Label className="text-sm">
            Invite flatmates <span className="text-kinship-placeholder">(optional)</span>
          </Label>
          <div className="mt-2 flex flex-col gap-2">
            {flatmateEmails.map((email, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder={`flatmate${i + 1}@email.com`}
                  value={email}
                  onChange={(e) => updateFlatmateEmail(i, e.target.value)}
                  className="h-10 rounded-xl"
                />
                {flatmateEmails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFlatmateEmail(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-kinship-placeholder hover:bg-kinship-destructive-surface hover:text-kinship-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addFlatmateEmail}
            className="mt-2 flex items-center gap-1.5 font-body text-xs font-medium text-kinship-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add another flatmate
          </button>
          <p className="mt-2 font-body text-[11px] text-kinship-placeholder">
            They&apos;ll get invite emails after you create the household.
          </p>
        </div>
      )}
    </WizardLayout>
  )
}
