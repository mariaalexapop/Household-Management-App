'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function ResendButton({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleResend() {
    setStatus('sending')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <p className="text-sm font-medium text-kinship-primary">
        Verification email resent — check your inbox.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleResend}
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Sending…' : 'Resend verification email'}
      </Button>
      {status === 'error' && (
        <p className="text-xs text-destructive">Failed to resend. Please try again.</p>
      )}
    </div>
  )
}
