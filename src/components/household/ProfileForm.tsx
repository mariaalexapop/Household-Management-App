'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, uploadAvatar } from '@/app/actions/household'

interface ProfileFormProps {
  initialDisplayName: string | null
  initialAvatarUrl: string | null
}

/**
 * ProfileForm — Client Component
 *
 * Allows the current user to update their display name and upload an avatar.
 * Uses Server Actions for both operations.
 */
export function ProfileForm({ initialDisplayName, initialAvatarUrl }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploadPending, setUploadPending] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await updateProfile({ displayName })
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated.' })
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Update failed' })
      }
    })
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploadPending(true)
    setMessage(null)
    const formData = new FormData()
    formData.append('avatar', file)

    const result = await uploadAvatar(formData)
    setUploadPending(false)

    if (result.url) {
      setAvatarPreview(result.url)
      setMessage({ type: 'success', text: 'Avatar updated.' })
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Upload failed' })
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-sm">
      {/* Avatar upload */}
      <div className="space-y-1.5">
        <Label htmlFor="avatar-upload">Profile photo</Label>
        <div className="flex items-center gap-3">
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="size-12 rounded-full object-cover border border-border"
            />
          )}
          <Input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            disabled={uploadPending}
            className="text-sm"
          />
        </div>
        {uploadPending && (
          <p className="text-xs text-kinship-on-surface-variant">Uploading...</p>
        )}
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          disabled={isPending}
        />
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}
          role={message.type === 'error' ? 'alert' : undefined}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending || !displayName.trim()}>
        {isPending ? 'Saving...' : 'Save profile'}
      </Button>
    </form>
  )
}
