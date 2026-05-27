'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  householdMembers,
  insurancePolicies,
  electronics,
  cars,
  tasks,
  documents,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

interface IntakeAction {
  type: 'create_insurance' | 'create_electronics' | 'create_car' | 'create_task' | 'store_for_rag'
  data: Record<string, unknown>
}

interface ExecuteResult {
  success: boolean
  results: { type: string; ok: boolean; error?: string }[]
}

export async function executeIntakeActions(
  actions: IntakeAction[],
  fileInfo?: { storagePath: string; fileName: string; fileSizeBytes: number }
): Promise<ExecuteResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, results: [{ type: 'auth', ok: false, error: 'Not authenticated' }] }

  const [member] = await db
    .select({ id: householdMembers.id, householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!member) return { success: false, results: [{ type: 'auth', ok: false, error: 'No household' }] }

  const results: { type: string; ok: boolean; error?: string; entityId?: string }[] = []

  for (const action of actions) {
    try {
      const d = action.data
      switch (action.type) {
        case 'create_insurance': {
          const [row] = await db.insert(insurancePolicies).values({
            householdId: member.householdId,
            insurer: String(d.insurer ?? 'Unknown'),
            policyType: String(d.policyType ?? 'other'),
            policyNumber: d.policyNumber ? String(d.policyNumber) : null,
            expiryDate: d.expiryDate ? new Date(String(d.expiryDate)) : null,
            premiumCents: d.premiumCents ? Number(d.premiumCents) : null,
            paymentSchedule: d.paymentSchedule ? String(d.paymentSchedule) : null,
            coveredName: d.coveredName ? String(d.coveredName) : null,
            createdBy: user.id,
          }).returning({ id: insurancePolicies.id })
          results.push({ type: 'create_insurance', ok: true, entityId: row.id })
          revalidatePath('/insurance')
          break
        }
        case 'create_electronics': {
          const [row] = await db.insert(electronics).values({
            householdId: member.householdId,
            name: String(d.name ?? 'Unknown item'),
            brand: d.brand ? String(d.brand) : null,
            modelNumber: d.modelNumber ? String(d.modelNumber) : null,
            purchaseDate: d.purchaseDate ? new Date(String(d.purchaseDate)) : null,
            costCents: d.costCents ? Number(d.costCents) : null,
            warrantyExpiryDate: d.warrantyExpiryDate ? new Date(String(d.warrantyExpiryDate)) : null,
            coverageSummary: d.coverageSummary ? String(d.coverageSummary) : null,
            createdBy: user.id,
          }).returning({ id: electronics.id })
          results.push({ type: 'create_electronics', ok: true, entityId: row.id })
          revalidatePath('/electronics')
          break
        }
        case 'create_car': {
          await db.insert(cars).values({
            householdId: member.householdId,
            make: String(d.make ?? 'Unknown'),
            model: String(d.model ?? 'Unknown'),
            year: Number(d.year ?? new Date().getFullYear()),
            plate: String(d.plate ?? ''),
            colour: d.colour ? String(d.colour) : null,
            motDueDate: d.motDueDate ? new Date(String(d.motDueDate)) : null,
            taxDueDate: d.taxDueDate ? new Date(String(d.taxDueDate)) : null,
            createdBy: user.id,
          })
          results.push({ type: 'create_car', ok: true })
          revalidatePath('/cars')
          break
        }
        case 'create_task': {
          await db.insert(tasks).values({
            householdId: member.householdId,
            title: String(d.title ?? 'New task'),
            notes: d.notes ? String(d.notes) : null,
            startsAt: d.startsAt ? new Date(String(d.startsAt)) : new Date(),
            createdBy: user.id,
          })
          results.push({ type: 'create_task', ok: true })
          revalidatePath('/chores')
          break
        }
        case 'store_for_rag': {
          if (!fileInfo) {
            results.push({ type: 'store_for_rag', ok: false, error: 'No file to store' })
            break
          }
          // Find the entity this doc belongs to (use the most recently created entity from this batch)
          const entityResult = results.find((r) => r.entityId)
          const module = d.module ? String(d.module) : 'insurance'
          const entityId = entityResult?.entityId ?? member.id // fallback to member id
          const documentType = d.documentType ? String(d.documentType) : 'policy'

          const [newDoc] = await db.insert(documents).values({
            householdId: member.householdId,
            module,
            entityId,
            documentType,
            fileName: fileInfo.fileName,
            storagePath: fileInfo.storagePath,
            fileSizeBytes: fileInfo.fileSizeBytes,
            uploadedBy: user.id,
          }).returning({ id: documents.id })

          try {
            await inngest.send({
              name: 'documents/uploaded',
              data: {
                documentId: newDoc.id,
                householdId: member.householdId,
                storagePath: fileInfo.storagePath,
                uploadedBy: user.id,
              },
            })
          } catch (err) {
            console.error('[intake] failed to emit documents/uploaded:', err)
          }
          results.push({ type: 'store_for_rag', ok: true })
          break
        }
      }
    } catch (err) {
      results.push({ type: action.type, ok: false, error: String(err) })
    }
  }

  revalidatePath('/dashboard')
  return { success: results.every((r) => r.ok), results }
}
