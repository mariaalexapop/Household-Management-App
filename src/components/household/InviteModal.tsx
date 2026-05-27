'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteModalProps {
  householdId: string
}

type TabId = 'email' | 'link'

/**
 * InviteModal — Client Component
 *
 * Admin-only dialog with two tabs:
 *   1. "Invite by email" — POST /api/household/invite
 *   2. "Share link"      — POST /api/household/invite/link
 *
 * Styled to match the design handoff:
 *   - Centered card, 560px wide, white bg, rounded-2xl, ring-miro, 32px padding
 *   - Heading: "Invite someone to the household"
 *   - Email input, share link section with mono font
 */
export function InviteModal({ householdId }: InviteModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('email')

  // Email tab state
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success?: boolean; error?: string } | null>(null)

  // Link tab state
  const [linkLoading, setLinkLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSendEmailInvite(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    setEmailResult(null)

    try {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, householdId }),
      })
      const data = await res.json()

      if (res.ok) {
        const sentEmail = email
        resetAndClose()
        toast.success(`Invite sent to ${sentEmail}`, {
          description: 'They will receive an email with a link to join your household.',
        })
        router.refresh()
        return
      } else {
        setEmailResult({ error: data.error ?? 'Failed to send invite' })
      }
    } catch {
      setEmailResult({ error: 'Network error — please try again' })
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleGenerateLink() {
    setLinkLoading(true)
    setLinkError(null)
    setGeneratedLink(null)
    setCopied(false)

    try {
      const res = await fetch('/api/household/invite/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId }),
      })
      const data = await res.json()

      if (res.ok) {
        setGeneratedLink(data.inviteUrl)
      } else {
        setLinkError(data.error ?? 'Failed to generate link')
      }
    } catch {
      setLinkError('Network error — please try again')
    } finally {
      setLinkLoading(false)
    }
  }

  async function handleCopy() {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function resetAndClose() {
    setOpen(false)
    setEmail('')
    setEmailResult(null)
    setGeneratedLink(null)
    setLinkError(null)
    setCopied(false)
  }

  return (
    <>
      <button
        type="button"
        className={buttonVariants({ variant: 'default', size: 'default' })}
        onClick={() => setOpen(true)}
      >
        Invite member
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[560px] rounded-2xl ring-miro bg-white p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-display text-xl font-semibold text-kinship-on-surface">
              Invite someone to the household
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-kinship-on-surface-variant mt-1">
              Send an email invite or share a link so they can join your household.
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-kinship-outline-variant mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2.5 font-body text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'email'
                  ? 'border-kinship-primary text-kinship-primary'
                  : 'border-transparent text-kinship-on-surface-variant hover:text-kinship-on-surface'
              }`}
            >
              Invite by email
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`px-4 py-2.5 font-body text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'link'
                  ? 'border-kinship-primary text-kinship-primary'
                  : 'border-transparent text-kinship-on-surface-variant hover:text-kinship-on-surface'
              }`}
            >
              Share link
            </button>
          </div>

          {/* Email tab */}
          {activeTab === 'email' && (
            <form onSubmit={handleSendEmailInvite} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="invite-email"
                  className="font-body text-sm font-medium text-kinship-on-surface"
                >
                  Email address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={emailLoading}
                  className="h-11 rounded-xl border-kinship-outline-variant font-body text-sm"
                />
              </div>

              {emailResult?.error && (
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="font-body text-sm text-destructive" role="alert">
                    {emailResult.error}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAndClose}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={emailLoading || !email}
                  className="rounded-xl"
                >
                  {emailLoading ? 'Sending...' : 'Send invite'}
                </Button>
              </div>
            </form>
          )}

          {/* Link tab */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              <p className="font-body text-sm text-kinship-on-surface-variant">
                Generate a shareable invite link. Anyone with this link can join your household.
                Links expire after 7 days.
              </p>

              {!generatedLink ? (
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAndClose}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGenerateLink}
                    disabled={linkLoading}
                    className="rounded-xl"
                  >
                    {linkLoading ? 'Generating...' : 'Generate link'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Share link display */}
                  <div className="rounded-xl bg-kinship-surface-container-lowest p-4 ring-1 ring-kinship-outline-variant">
                    <Label className="font-body text-xs font-medium text-kinship-on-surface-variant mb-2 block">
                      Invite link
                    </Label>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 truncate rounded-lg bg-kinship-surface-container px-3 py-2 font-mono text-xs text-kinship-on-surface">
                        {generatedLink}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="shrink-0 rounded-xl"
                      >
                        {copied ? 'Copied!' : 'Copy link'}
                      </Button>
                    </div>
                    <p className="font-body text-xs text-kinship-on-surface-variant mt-2">
                      Share this link with anyone you want to invite. It expires in 7 days.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetAndClose}
                      className="rounded-xl"
                    >
                      Done
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleGenerateLink}
                      disabled={linkLoading}
                      className="rounded-xl"
                    >
                      Generate new link
                    </Button>
                  </div>
                </div>
              )}

              {linkError && (
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="font-body text-sm text-destructive" role="alert">
                    {linkError}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
