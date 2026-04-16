'use server'

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { insurancePolicies, documents, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest/client'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createPolicySchema = z.object({
  policyType: z.enum(['home', 'car', 'health', 'life', 'travel', 'other']),
  insurer: z.string().min(1, 'Insurer is required').max(200, 'Insurer must be 200 characters or fewer'),
  policyNumber: z.string().max(100).optional().nullable(),
  expiryDate: z.string().datetime({ offset: true }).optional().nullable(),
  renewalContactName: z.string().max(200).optional().nullable(),
  renewalContactPhone: z.string().max(50).optional().nullable(),
  renewalContactEmail: z.string().email().optional().nullable(),
  paymentSchedule: z.enum(['annual', 'quarterly', 'monthly']).optional().nullable(),
  premiumCents: z.number().int().min(0).optional().nullable(),
  nextPaymentDate: z.string().datetime({ offset: true }).optional().nullable(),
  expiryReminderDays: z.number().int().min(1).default(30).optional(),
  paymentReminderDays: z.number().int().min(1).default(7).optional(),
  coveredName: z.string().max(200).optional().nullable(),
  linkedCarId: z.string().uuid().optional().nullable(),
})

const updatePolicySchema = createPolicySchema.extend({
  id: z.string().uuid(),
})

const deletePolicySchema = z.object({
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

export async function createPolicy(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createPolicySchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const expiryReminderDays = parsed.data.expiryReminderDays ?? 30
  const paymentReminderDays = parsed.data.paymentReminderDays ?? 7

  const [newPolicy] = await db
    .insert(insurancePolicies)
    .values({
      householdId: memberRow.householdId,
      policyType: parsed.data.policyType,
      insurer: parsed.data.insurer,
      policyNumber: parsed.data.policyNumber ?? null,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      renewalContactName: parsed.data.renewalContactName ?? null,
      renewalContactPhone: parsed.data.renewalContactPhone ?? null,
      renewalContactEmail: parsed.data.renewalContactEmail ?? null,
      paymentSchedule: parsed.data.paymentSchedule ?? null,
      premiumCents: parsed.data.premiumCents ?? null,
      nextPaymentDate: parsed.data.nextPaymentDate ? new Date(parsed.data.nextPaymentDate) : null,
      expiryReminderDays,
      paymentReminderDays,
      coveredName: parsed.data.coveredName ?? null,
      linkedCarId: parsed.data.linkedCarId ?? null,
      createdBy: user.id,
    })
    .returning({ id: insurancePolicies.id })

  // Fire Inngest reminder events (best-effort — don't block policy creation)
  try {
    if (parsed.data.expiryDate) {
      await inngest.send({
        name: 'insurance/expiry.reminder.scheduled',
        data: {
          policyId: newPolicy.id,
          householdId: memberRow.householdId,
          expiryDate: parsed.data.expiryDate,
          reminderDays: expiryReminderDays,
          createdBy: user.id,
        },
      })
    }

    if (parsed.data.nextPaymentDate) {
      await inngest.send({
        name: 'insurance/payment.reminder.scheduled',
        data: {
          policyId: newPolicy.id,
          householdId: memberRow.householdId,
          nextPaymentDate: parsed.data.nextPaymentDate,
          reminderDays: paymentReminderDays,
          createdBy: user.id,
        },
      })
    }
  } catch {
    console.warn('Failed to send Inngest reminder events for policy', newPolicy.id)
  }

  revalidatePath('/insurance')
  revalidatePath('/calendar')

  return { success: true, data: { id: newPolicy.id } }
}

export async function updatePolicy(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = updatePolicySchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  // Verify the policy belongs to this household
  const [existingPolicy] = await db
    .select({
      id: insurancePolicies.id,
      expiryDate: insurancePolicies.expiryDate,
      nextPaymentDate: insurancePolicies.nextPaymentDate,
    })
    .from(insurancePolicies)
    .where(
      and(
        eq(insurancePolicies.id, parsed.data.id),
        eq(insurancePolicies.householdId, memberRow.householdId)
      )
    )
    .limit(1)

  if (!existingPolicy) return { success: false, error: 'Policy not found' }

  const expiryReminderDays = parsed.data.expiryReminderDays ?? 30
  const paymentReminderDays = parsed.data.paymentReminderDays ?? 7

  await db
    .update(insurancePolicies)
    .set({
      policyType: parsed.data.policyType,
      insurer: parsed.data.insurer,
      policyNumber: parsed.data.policyNumber ?? null,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      renewalContactName: parsed.data.renewalContactName ?? null,
      renewalContactPhone: parsed.data.renewalContactPhone ?? null,
      renewalContactEmail: parsed.data.renewalContactEmail ?? null,
      paymentSchedule: parsed.data.paymentSchedule ?? null,
      premiumCents: parsed.data.premiumCents ?? null,
      nextPaymentDate: parsed.data.nextPaymentDate ? new Date(parsed.data.nextPaymentDate) : null,
      expiryReminderDays,
      paymentReminderDays,
      coveredName: parsed.data.coveredName ?? null,
      linkedCarId: parsed.data.linkedCarId ?? null,
    })
    .where(eq(insurancePolicies.id, parsed.data.id))

  // Fire Inngest reminder events (best-effort — don't block policy update)
  try {
    const oldExpiryDate = existingPolicy.expiryDate?.toISOString()
    const newExpiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate).toISOString() : null
    if (newExpiryDate && oldExpiryDate !== newExpiryDate) {
      await inngest.send({
        name: 'insurance/expiry.reminder.scheduled',
        data: {
          policyId: parsed.data.id,
          householdId: memberRow.householdId,
          expiryDate: parsed.data.expiryDate,
          reminderDays: expiryReminderDays,
          createdBy: user.id,
        },
      })
    }

    const oldPaymentDate = existingPolicy.nextPaymentDate?.toISOString() ?? null
    const newPaymentDate = parsed.data.nextPaymentDate
      ? new Date(parsed.data.nextPaymentDate).toISOString()
      : null
    if (newPaymentDate && oldPaymentDate !== newPaymentDate) {
      await inngest.send({
        name: 'insurance/payment.reminder.scheduled',
        data: {
          policyId: parsed.data.id,
          householdId: memberRow.householdId,
          nextPaymentDate: parsed.data.nextPaymentDate!,
          reminderDays: paymentReminderDays,
          createdBy: user.id,
        },
      })
    }
  } catch {
    console.warn('Failed to send Inngest reminder events for policy', parsed.data.id)
  }

  revalidatePath('/insurance')
  revalidatePath('/calendar')

  return { success: true, data: { id: parsed.data.id } }
}

export async function deletePolicy(data: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = deletePolicySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Invalid policy ID' }

  // Verify the policy belongs to this household
  const [existingPolicy] = await db
    .select({ id: insurancePolicies.id })
    .from(insurancePolicies)
    .where(
      and(
        eq(insurancePolicies.id, parsed.data.id),
        eq(insurancePolicies.householdId, memberRow.householdId)
      )
    )
    .limit(1)

  if (!existingPolicy) return { success: false, error: 'Policy not found' }

  // Clean up Storage files and document rows before deleting the policy
  // (Pitfall 3: avoid orphaned files)
  const linkedDocs = await db
    .select({
      id: documents.id,
      storagePath: documents.storagePath,
    })
    .from(documents)
    .where(
      and(
        eq(documents.module, 'insurance'),
        eq(documents.entityId, parsed.data.id)
      )
    )

  if (linkedDocs.length > 0) {
    // Delete files from Supabase Storage
    const adminClient = createAdminClient()
    const storagePaths = linkedDocs.map((doc) => doc.storagePath)
    await adminClient.storage.from('documents').remove(storagePaths)

    // Delete document rows
    for (const doc of linkedDocs) {
      await db.delete(documents).where(eq(documents.id, doc.id))
    }
  }

  // Delete the policy
  await db.delete(insurancePolicies).where(eq(insurancePolicies.id, parsed.data.id))

  revalidatePath('/insurance')
  revalidatePath('/calendar')

  return { success: true }
}
