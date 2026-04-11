import { redirect } from 'next/navigation'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { insurancePolicies, documents, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { InsuranceClient } from './InsuranceClient'

export const metadata = { title: 'Insurance — Kinship' }

export default async function InsurancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [memberRow] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, user.id))
    .limit(1)
  if (!memberRow) redirect('/onboarding')

  const { householdId } = memberRow

  // Parallel fetch: policies + documents for the insurance module
  const [policiesRows, documentRows] = await Promise.all([
    db
      .select({
        id: insurancePolicies.id,
        policyType: insurancePolicies.policyType,
        insurer: insurancePolicies.insurer,
        policyNumber: insurancePolicies.policyNumber,
        expiryDate: insurancePolicies.expiryDate,
        renewalContactName: insurancePolicies.renewalContactName,
        renewalContactPhone: insurancePolicies.renewalContactPhone,
        renewalContactEmail: insurancePolicies.renewalContactEmail,
        paymentSchedule: insurancePolicies.paymentSchedule,
        premiumCents: insurancePolicies.premiumCents,
        nextPaymentDate: insurancePolicies.nextPaymentDate,
        expiryReminderDays: insurancePolicies.expiryReminderDays,
        paymentReminderDays: insurancePolicies.paymentReminderDays,
        createdAt: insurancePolicies.createdAt,
      })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.householdId, householdId))
      .orderBy(desc(insurancePolicies.expiryDate)),
    db
      .select({
        id: documents.id,
        entityId: documents.entityId,
        documentType: documents.documentType,
        fileName: documents.fileName,
        fileSizeBytes: documents.fileSizeBytes,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(
        and(
          eq(documents.householdId, householdId),
          eq(documents.module, 'insurance')
        )
      )
      .orderBy(desc(documents.createdAt)),
  ])

  // Serialize dates to ISO strings (Date → string) so the data is safe to pass to a Client Component.
  const policies = policiesRows.map((p) => ({
    id: p.id,
    policyType: p.policyType as 'home' | 'car' | 'health' | 'life' | 'travel' | 'other',
    insurer: p.insurer,
    policyNumber: p.policyNumber,
    expiryDate: p.expiryDate ? p.expiryDate.toISOString() : new Date().toISOString(),
    renewalContactName: p.renewalContactName,
    renewalContactPhone: p.renewalContactPhone,
    renewalContactEmail: p.renewalContactEmail,
    paymentSchedule: p.paymentSchedule as 'annual' | 'quarterly' | 'monthly' | null,
    premiumCents: p.premiumCents,
    nextPaymentDate: p.nextPaymentDate ? p.nextPaymentDate.toISOString() : null,
    expiryReminderDays: p.expiryReminderDays ?? 30,
    paymentReminderDays: p.paymentReminderDays ?? 7,
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
  }))

  const docs = documentRows.map((d) => ({
    id: d.id,
    entityId: d.entityId,
    documentType: d.documentType,
    fileName: d.fileName,
    fileSizeBytes: d.fileSizeBytes,
    createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
  }))

  return (
    <div className="min-h-screen bg-kinship-surface">
      <header className="border-b border-kinship-surface-container bg-kinship-surface-container-lowest px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-kinship-on-surface">Kinship</h1>
            <p className="font-body text-sm text-kinship-on-surface-variant">Insurance</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/calendar" className="font-body text-sm text-kinship-primary hover:underline">
              Calendar
            </a>
            <a href="/dashboard" className="font-body text-sm text-kinship-primary hover:underline">
              Dashboard
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InsuranceClient policies={policies} documents={docs} />
      </main>
    </div>
  )
}
