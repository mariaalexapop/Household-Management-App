'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, Users, Car, Shield, Monitor, CalendarHeart, Mail, User } from 'lucide-react'
import { WizardLayout } from '@/components/onboarding/WizardLayout'
import { useOnboardingStore } from '@/stores/onboarding'
import { createHousehold } from '@/app/actions/onboarding'
import type { ModuleKey } from '@/stores/onboarding'

const TYPE_LABELS: Record<string, string> = {
  couple: 'Couple',
  family_with_kids: 'Family with Kids',
  flatmates: 'Flatmates',
  single: 'Single',
}

const MODULE_META: Record<ModuleKey, { label: string; icon: typeof CheckSquare; light: string; dark: string }> = {
  chores: { label: 'Home Chores', icon: CheckSquare, light: 'bg-module-chores-light', dark: 'text-module-chores-dark' },
  kids: { label: 'Kids Activities', icon: CalendarHeart, light: 'bg-module-kids-light', dark: 'text-module-kids-dark' },
  car: { label: 'Car Maintenance', icon: Car, light: 'bg-module-car-light', dark: 'text-module-car-dark' },
  insurance: { label: 'Insurance', icon: Shield, light: 'bg-module-ins-light', dark: 'text-module-ins-dark' },
  electronics: { label: 'Electronics', icon: Monitor, light: 'bg-module-elec-light', dark: 'text-module-elec-dark' },
}

export default function Step3Page() {
  const router = useRouter()
  const {
    householdName, householdType, activeModules,
    partnerEmail, flatmateEmails, kidNames,
    reset,
  } = useOnboardingStore()
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

    // Collect invite emails from partner + flatmates
    const inviteEmails: string[] = []
    if (partnerEmail.trim()) inviteEmails.push(partnerEmail.trim())
    for (const email of flatmateEmails) {
      if (email.trim()) inviteEmails.push(email.trim())
    }

    const result = await createHousehold({
      householdName,
      householdType,
      activeModules,
      inviteEmails,
    })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    reset()
    router.push('/dashboard')
  }

  // Collect people to invite
  const invitees: { label: string; email: string }[] = []
  if (partnerEmail.trim()) {
    invitees.push({ label: 'Partner', email: partnerEmail.trim() })
  }
  for (const email of flatmateEmails) {
    if (email.trim()) {
      invitees.push({ label: 'Flatmate', email: email.trim() })
    }
  }
  const kids = kidNames.filter((n) => n.trim())

  return (
    <WizardLayout
      step={3}
      onBack={handleBack}
      onNext={handleCreate}
      nextLabel="Create Household"
      isSubmitting={isSubmitting}
    >
      <h2 className="font-display text-[30px] font-semibold tracking-tight leading-tight text-kinship-on-surface">
        Summary
      </h2>
      <p className="mt-1.5 mb-6 font-body text-sm text-kinship-on-surface-variant max-w-[420px]">
        Check everything looks right before we create your household.
      </p>

      <div className="flex flex-col gap-4">
        {/* Household info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-kinship-surface p-4">
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-kinship-placeholder">
              Household
            </p>
            <p className="mt-1 font-display text-[15px] font-semibold text-kinship-on-surface">
              {householdName || <span className="text-kinship-placeholder">Not set</span>}
            </p>
          </div>
          <div className="rounded-xl bg-kinship-surface p-4">
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-kinship-placeholder">
              Type
            </p>
            <p className="mt-1 font-display text-[15px] font-semibold text-kinship-on-surface">
              {householdType ? TYPE_LABELS[householdType] : <span className="text-kinship-placeholder">Not set</span>}
            </p>
          </div>
        </div>

        {/* Active modules */}
        <div className="rounded-xl bg-kinship-surface p-4">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-kinship-placeholder mb-3">
            Modules ({activeModules.length})
          </p>
          {activeModules.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeModules.map((m) => {
                const meta = MODULE_META[m]
                const Icon = meta.icon
                return (
                  <span
                    key={m}
                    className={`inline-flex items-center gap-1.5 rounded-lg ${meta.light} ${meta.dark} px-3 py-1.5 font-display text-xs font-semibold`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="font-body text-sm text-kinship-placeholder">None selected</p>
          )}
        </div>

        {/* Members to invite */}
        {(invitees.length > 0 || kids.length > 0) && (
          <div className="rounded-xl bg-kinship-surface p-4">
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-kinship-placeholder mb-3">
              Members to invite
            </p>
            <div className="flex flex-col gap-2">
              {invitees.map((person, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-miro">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kinship-primary-surface text-kinship-primary">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-kinship-on-surface truncate">
                      {person.email}
                    </p>
                    <p className="font-body text-[11px] text-kinship-placeholder">
                      {person.label} · invite will be sent
                    </p>
                  </div>
                </div>
              ))}
              {kids.map((name, i) => (
                <div key={`kid-${i}`} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-miro">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-module-kids-light text-module-kids-dark">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-kinship-on-surface truncate">
                      {name}
                    </p>
                    <p className="font-body text-[11px] text-kinship-placeholder">
                      Child profile · no account needed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 font-body text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </WizardLayout>
  )
}
