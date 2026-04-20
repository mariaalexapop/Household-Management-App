import { redirect } from 'next/navigation'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { electronics, documents, householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { ElectronicsClient } from './ElectronicsClient'
import { AppHeader } from '@/components/nav/AppHeader'

export const metadata = { title: 'Electronics — Kinship' }

export default async function ElectronicsPage() {
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

  // Parallel fetch: electronics items + documents for this household
  const [itemRows, docRows] = await Promise.all([
    db
      .select()
      .from(electronics)
      .where(eq(electronics.householdId, householdId))
      .orderBy(desc(electronics.createdAt)),
    db
      .select()
      .from(documents)
      .where(
        and(eq(documents.householdId, householdId), eq(documents.module, 'electronics'))
      )
      .orderBy(desc(documents.createdAt)),
  ])

  // Serialize Date objects to ISO strings for client props
  const serializedItems = itemRows.map((i) => ({
    id: i.id,
    householdId: i.householdId,
    name: i.name,
    brand: i.brand,
    modelNumber: i.modelNumber,
    purchaseDate: i.purchaseDate ? i.purchaseDate.toISOString() : null,
    costCents: i.costCents,
    warrantyExpiryDate: i.warrantyExpiryDate ? i.warrantyExpiryDate.toISOString() : null,
    coverageSummary: i.coverageSummary,
    createdBy: i.createdBy,
    createdAt: i.createdAt ? i.createdAt.toISOString() : null,
  }))

  const serializedDocuments = docRows.map((d) => ({
    id: d.id,
    householdId: d.householdId,
    module: d.module,
    entityId: d.entityId,
    documentType: d.documentType,
    fileName: d.fileName,
    storagePath: d.storagePath,
    fileSizeBytes: d.fileSizeBytes,
    uploadedBy: d.uploadedBy,
    createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
  }))

  return (
    <div className="min-h-screen bg-kinship-surface">
      <AppHeader subtitle="Electronics" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <a href="/dashboard" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-kinship-primary hover:underline">
          ← Go back to main dashboard
        </a>
        <ElectronicsClient items={serializedItems} documents={serializedDocuments} />
      </main>
    </div>
  )
}
