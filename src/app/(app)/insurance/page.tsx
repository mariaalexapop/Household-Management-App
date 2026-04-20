import { redirect } from 'next/navigation'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { insurancePolicies, documents, householdMembers, children, cars } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { InsuranceClient } from './InsuranceClient'
import { AppHeader } from '@/components/nav/AppHeader'

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

  // Parallel fetch: policies + documents + members + kids + cars
  const [policiesRows, documentRows, memberRows, childrenRows, carRows] = await Promise.all([
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
        coveredName: insurancePolicies.coveredName,
        linkedCarId: insurancePolicies.linkedCarId,
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
    db
      .select({ id: householdMembers.id, displayName: householdMembers.displayName })
      .from(householdMembers)
      .where(eq(householdMembers.householdId, householdId)),
    db
      .select({ id: children.id, name: children.name })
      .from(children)
      .where(eq(children.householdId, householdId)),
    db
      .select({ id: cars.id, make: cars.make, model: cars.model, plate: cars.plate })
      .from(cars)
      .where(eq(cars.householdId, householdId)),
  ])

  // Serialize dates to ISO strings (Date → string) so the data is safe to pass to a Client Component.
  const policies = policiesRows.map((p) => ({
    id: p.id,
    policyType: p.policyType as 'home' | 'car' | 'health' | 'life' | 'travel' | 'other',
    insurer: p.insurer,
    policyNumber: p.policyNumber,
    expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
    renewalContactName: p.renewalContactName,
    renewalContactPhone: p.renewalContactPhone,
    renewalContactEmail: p.renewalContactEmail,
    paymentSchedule: p.paymentSchedule as 'annual' | 'quarterly' | 'monthly' | null,
    premiumCents: p.premiumCents,
    nextPaymentDate: p.nextPaymentDate ? p.nextPaymentDate.toISOString() : null,
    expiryReminderDays: p.expiryReminderDays ?? 30,
    paymentReminderDays: p.paymentReminderDays ?? 7,
    coveredName: p.coveredName,
    linkedCarId: p.linkedCarId,
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
      <AppHeader subtitle="Insurance" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-kinship-primary hover:underline">
          ← Go back to main dashboard
        </a>
        <InsuranceClient
          policies={policies}
          documents={docs}
          members={memberRows.map((m) => ({ id: m.id, name: m.displayName ?? 'Unnamed member' }))}
          kids={childrenRows.map((c) => ({ id: c.id, name: c.name }))}
          cars={carRows.map((c) => ({ id: c.id, label: `${c.make} ${c.model} (${c.plate})` }))}
        />
      </main>
    </div>
  )
}
