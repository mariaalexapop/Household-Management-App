'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name is too long'),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')).nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export interface UpdateProfileResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Server Action: Update the current user's household profile.
 * Updates displayName and optionally avatarUrl in household_members.
 */
export async function updateProfile(data: UpdateProfileInput): Promise<UpdateProfileResult> {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed'
    return { success: false, error: firstError }
  }

  const { displayName, avatarUrl } = parsed.data

  // Update the household_members row for this user
  const updateValues: { displayName: string; avatarUrl?: string | null } = { displayName }
  if (avatarUrl !== undefined) {
    updateValues.avatarUrl = avatarUrl || null
  }

  await db
    .update(householdMembers)
    .set(updateValues)
    .where(eq(householdMembers.userId, user.id))

  return { success: true }
}

// ---------------------------------------------------------------------------
// uploadAvatar
// ---------------------------------------------------------------------------

/**
 * Server Action: Upload an avatar file to Supabase Storage.
 * Returns the public URL of the uploaded avatar.
 *
 * The file is uploaded to the 'avatars' bucket at path `{userId}/avatar.{ext}`.
 */
export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  // Authenticate
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const file = formData.get('avatar') as File | null
  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF.' }
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'File too large. Maximum size is 2MB.' }
  }

  const ext = file.type.split('/')[1] ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  // Upload using admin client so it can upsert regardless of RLS on the bucket
  const adminClient = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const { data: urlData } = adminClient.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = urlData.publicUrl

  // Update household_members with the new avatar URL
  await db
    .update(householdMembers)
    .set({ avatarUrl })
    .where(eq(householdMembers.userId, user.id))

  return { url: avatarUrl }
}
