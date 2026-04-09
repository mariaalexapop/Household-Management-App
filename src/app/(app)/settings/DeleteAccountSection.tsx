'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const CONFIRM_PHRASE = 'DELETE'

/**
 * DeleteAccountSection — Client Component.
 *
 * Renders a "Delete my account" button. On click, opens a confirmation dialog
 * where the user must type "DELETE" before the confirm button is enabled.
 *
 * On confirmation:
 *   1. Calls DELETE /api/household/gdpr
 *   2. Redirects to /auth/login?message=account_deleted
 */
export function DeleteAccountSection() {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const canConfirm = confirmText === CONFIRM_PHRASE && !isPending

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      // Reset state when dialog closes
      setConfirmText('')
      setError(null)
    }
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/household/gdpr', { method: 'DELETE' })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          setError(body.error ?? 'Deletion failed. Please try again.')
          return
        }
        // Redirect to login with confirmation message
        router.push('/auth/login?message=account_deleted')
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete my account
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all household data.
              This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-kinship-on-surface">
              Type <strong>{CONFIRM_PHRASE}</strong> to confirm deletion:
            </p>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              disabled={isPending}
              aria-label="Type DELETE to confirm"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {isPending ? 'Deleting...' : 'Confirm deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
