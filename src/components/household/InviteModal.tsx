'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
 */
export function InviteModal({ householdId }: InviteModalProps) {
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
        setEmailResult({ success: true })
        setEmail('')
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button />} onClick={() => setOpen(true)}>
        <Button variant="default" size="default">
          Invite member
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'email'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Invite by email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'link'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Share link
          </button>
        </div>

        {/* Email tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendEmailInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={emailLoading}
              />
            </div>

            {emailResult?.success && (
              <p className="text-sm text-green-600">
                Invite sent! They will receive a link to create their account and join.
              </p>
            )}
            {emailResult?.error && (
              <p className="text-sm text-destructive" role="alert">
                {emailResult.error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={emailLoading || !email}>
                {emailLoading ? 'Sending...' : 'Send invite'}
              </Button>
            </div>
          </form>
        )}

        {/* Link tab */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a shareable invite link. Anyone with this link can join your household.
              Links expire after 7 days.
            </p>

            {!generatedLink ? (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={linkLoading}
                >
                  {linkLoading ? 'Generating...' : 'Generate link'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with anyone you want to invite. It expires in 7 days.
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetAndClose}>
                    Done
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleGenerateLink}
                    disabled={linkLoading}
                  >
                    Generate new link
                  </Button>
                </div>
              </div>
            )}

            {linkError && (
              <p className="text-sm text-destructive" role="alert">
                {linkError}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
