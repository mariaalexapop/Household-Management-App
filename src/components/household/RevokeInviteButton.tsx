'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface RevokeInviteButtonProps {
  inviteId: string
  inviteEmail: string | null
}

export function RevokeInviteButton({ inviteId, inviteEmail }: RevokeInviteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRevoke() {
    if (!confirm(`Revoke invite for ${inviteEmail ?? 'this person'}?`)) return

    setLoading(true)

    try {
      const res = await fetch(`/api/household/invites/${inviteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to revoke invite')
      } else {
        toast.success(`Invite for ${inviteEmail ?? 'invite link'} revoked`)
        router.refresh()
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="xs"
      onClick={handleRevoke}
      disabled={loading}
    >
      {loading ? 'Revoking...' : 'Revoke'}
    </Button>
  )
}
