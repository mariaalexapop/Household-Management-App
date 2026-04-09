'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { electronics, documents, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest/client'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or fewer'),
  brand: z.string().max(100).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().datetime({ offset: true }).optional().nullable(),
  costCents: z.number().int().min(0).optional().nullable(),
  warrantyExpiryDate: z.string().datetime({ offset: true }).optional().nullable(),
  coverageSummary: z.string().max(1000).optional().nullable(),
})

const updateItemSchema = createItemSchema.extend({
  id: z.string().uuid(),
})

const deleteItemSchema = z.object({
  id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gets the current user's member row (id + householdId). Returns null if not found. */
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

export async function createItem(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [newItem] = await db
    .insert(electronics)
    .values({
      householdId: memberRow.householdId,
      name: parsed.data.name,
      brand: parsed.data.brand ?? null,
      modelNumber: parsed.data.modelNumber ?? null,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null,
      costCents: parsed.data.costCents ?? null,
      warrantyExpiryDate: parsed.data.warrantyExpiryDate
        ? new Date(parsed.data.warrantyExpiryDate)
        : null,
      coverageSummary: parsed.data.coverageSummary ?? null,
      createdBy: user.id,
    })
    .returning({ id: electronics.id })

  // Schedule warranty expiry reminder if warranty date is set
  if (parsed.data.warrantyExpiryDate) {
    await inngest.send({
      name: 'electronics/warranty.reminder.scheduled',
      data: {
        itemId: newItem.id,
        householdId: memberRow.householdId,
        warrantyExpiryDate: parsed.data.warrantyExpiryDate,
        itemName: parsed.data.name,
        createdBy: user.id,
      },
    })
  }

  revalidatePath('/electronics')
  revalidatePath('/calendar')

  return { success: true, data: { id: newItem.id } }
}

export async function updateItem(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = updateItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Verify the item belongs to this household
  const [existingItem] = await db
    .select({
      id: electronics.id,
      warrantyExpiryDate: electronics.warrantyExpiryDate,
    })
    .from(electronics)
    .where(
      and(
        eq(electronics.id, parsed.data.id),
        eq(electronics.householdId, memberRow.householdId)
      )
    )
    .limit(1)

  if (!existingItem) return { success: false, error: 'Item not found' }

  await db
    .update(electronics)
    .set({
      name: parsed.data.name,
      brand: parsed.data.brand ?? null,
      modelNumber: parsed.data.modelNumber ?? null,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null,
      costCents: parsed.data.costCents ?? null,
      warrantyExpiryDate: parsed.data.warrantyExpiryDate
        ? new Date(parsed.data.warrantyExpiryDate)
        : null,
      coverageSummary: parsed.data.coverageSummary ?? null,
    })
    .where(eq(electronics.id, parsed.data.id))

  // If warranty expiry date changed, schedule a new reminder
  const oldExpiry = existingItem.warrantyExpiryDate?.toISOString() ?? null
  const newExpiry = parsed.data.warrantyExpiryDate
    ? new Date(parsed.data.warrantyExpiryDate).toISOString()
    : null

  if (newExpiry && newExpiry !== oldExpiry) {
    await inngest.send({
      name: 'electronics/warranty.reminder.scheduled',
      data: {
        itemId: parsed.data.id,
        householdId: memberRow.householdId,
        warrantyExpiryDate: parsed.data.warrantyExpiryDate!,
        itemName: parsed.data.name,
        createdBy: user.id,
      },
    })
  }

  revalidatePath('/electronics')
  revalidatePath('/calendar')

  return { success: true, data: { id: parsed.data.id } }
}

export async function deleteItem(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = deleteItemSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid item ID' }

  // Verify the item belongs to this household
  const [item] = await db
    .select({ id: electronics.id })
    .from(electronics)
    .where(
      and(
        eq(electronics.id, parsed.data.id),
        eq(electronics.householdId, memberRow.householdId)
      )
    )
    .limit(1)

  if (!item) return { success: false, error: 'Item not found' }

  // Clean up associated documents from Supabase Storage, then delete rows
  const linkedDocs = await db
    .select({
      id: documents.id,
      storagePath: documents.storagePath,
    })
    .from(documents)
    .where(
      and(
        eq(documents.module, 'electronics'),
        eq(documents.entityId, parsed.data.id)
      )
    )

  if (linkedDocs.length > 0) {
    // Delete files from Supabase Storage using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const storagePaths = linkedDocs.map((doc) => doc.storagePath)
    await adminClient.storage.from('documents').remove(storagePaths)

    // Delete document rows
    for (const doc of linkedDocs) {
      await db.delete(documents).where(eq(documents.id, doc.id))
    }
  }

  // Delete the electronics item
  await db.delete(electronics).where(eq(electronics.id, parsed.data.id))

  revalidatePath('/electronics')
  revalidatePath('/calendar')

  return { success: true }
}
