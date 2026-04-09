'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { documents, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const moduleEnum = z.enum(['insurance', 'electronics'])
const documentTypeEnum = z.enum(['policy', 'warranty', 'manual'])

const getUploadUrlSchema = z.object({
  module: moduleEnum,
  entityId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().min(1).max(10485760),
})

const confirmUploadSchema = z.object({
  module: moduleEnum,
  entityId: z.string().uuid(),
  documentType: documentTypeEnum,
  fileName: z.string().min(1).max(255),
  storagePath: z.string().min(1),
  fileSizeBytes: z.number().int().min(1).max(10485760),
})

const documentIdSchema = z.object({
  documentId: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getMemberRow(userId: string): Promise<{ id: string; householdId: string } | null> {
  const rows = await db
    .select({ id: householdMembers.id, householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function getUploadUrl(
  data: unknown
): Promise<ActionResult<{ signedUrl: string; token: string; path: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = getUploadUrlSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const storagePath = `${memberRow.householdId}/${parsed.data.module}/${parsed.data.entityId}/${parsed.data.fileName}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(storagePath)

  if (uploadError || !uploadData) {
    return { success: false, error: uploadError?.message ?? 'Failed to create upload URL' }
  }

  return {
    success: true,
    data: {
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: storagePath,
    },
  }
}

export async function confirmUpload(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = confirmUploadSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [newDoc] = await db
    .insert(documents)
    .values({
      householdId: memberRow.householdId,
      module: parsed.data.module,
      entityId: parsed.data.entityId,
      documentType: parsed.data.documentType,
      fileName: parsed.data.fileName,
      storagePath: parsed.data.storagePath,
      fileSizeBytes: parsed.data.fileSizeBytes,
      uploadedBy: user.id,
    })
    .returning({ id: documents.id })

  revalidatePath(`/${parsed.data.module}`)

  return { success: true, data: { id: newDoc.id } }
}

export async function getDownloadUrl(
  data: unknown
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = documentIdSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [doc] = await db
    .select({ storagePath: documents.storagePath, householdId: documents.householdId })
    .from(documents)
    .where(
      and(
        eq(documents.id, parsed.data.documentId),
        eq(documents.householdId, memberRow.householdId)
      )
    )
    .limit(1)

  if (!doc) return { success: false, error: 'Document not found' }

  const { data: urlData, error: urlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storagePath, 3600)

  if (urlError || !urlData) {
    return { success: false, error: urlError?.message ?? 'Failed to create download URL' }
  }

  return { success: true, data: { url: urlData.signedUrl } }
}

export async function deleteDocument(
  data: unknown
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = documentIdSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [doc] = await db
    .select({
      id: documents.id,
      storagePath: documents.storagePath,
      module: documents.module,
      householdId: documents.householdId,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, parsed.data.documentId),
        eq(documents.householdId, memberRow.householdId)
      )
    )
    .limit(1)

  if (!doc) return { success: false, error: 'Document not found' }

  // Delete from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storagePath])

  if (storageError) {
    return { success: false, error: storageError.message ?? 'Failed to delete file from storage' }
  }

  // Delete DB row
  await db.delete(documents).where(eq(documents.id, doc.id))

  revalidatePath(`/${doc.module}`)

  return { success: true }
}
