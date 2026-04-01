'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

interface RemoveMemberButtonProps {
  memberId: string
  memberName: string | null
}

/**
 * RemoveMemberButton — Client Component
 *
 * Calls DELETE /api/household/members/[memberId] and refreshes the page on success.
 * Shown only to admins, not on their own row.
 */
export function RemoveMemberButton({ memberId, memberName }: RemoveMemberButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove() {
    if (!confirm(`Remove ${memberName ?? 'this member'} from the household?`)) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/household/members/${memberId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to remove member')
      } else {
        // Reload page to reflect updated member list
        window.location.reload()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="xs"
        onClick={handleRemove}
        disabled={loading}
      >
        {loading ? 'Removing...' : 'Remove'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
