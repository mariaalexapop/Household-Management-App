'use client'

import React, { useState, useTransition } from 'react'
import { updateMemberRole } from '@/app/actions/household'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'view-only', label: 'View-only' },
] as const

interface RoleSelectorProps {
  memberId: string
  currentRole: string
}

export function RoleSelector({ memberId, currentRole }: RoleSelectorProps) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as 'admin' | 'contributor' | 'view-only'
    setRole(newRole)
    setError(null)

    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole)
      if (!result.success) {
        setError(result.error ?? 'Failed to update role')
        setRole(currentRole)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-border bg-background px-2 py-1 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-kinship-primary"
      >
        {roleOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
