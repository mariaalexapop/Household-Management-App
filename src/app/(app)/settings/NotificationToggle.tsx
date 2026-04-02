'use client'

import { useState } from 'react'

interface NotificationToggleProps {
  defaultEnabled: boolean
}

/**
 * Toggle switch for email notification preference.
 * UI-only in Phase 2 — persisting to DB is a Phase 6 enhancement.
 */
export function NotificationToggle({ defaultEnabled }: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled)

  return (
    <button
      id="email-assign-toggle"
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled((v) => !v)}
      className={`relative inline-flex h-6 w-11 min-w-[44px] items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-kinship-primary ${
        enabled ? 'bg-[#0053dc]' : 'bg-kinship-surface-container'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
