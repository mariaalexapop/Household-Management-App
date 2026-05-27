import { eq, and, sql, count } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import {
  households,
  householdMembers,
  cars,
  insurancePolicies,
  electronics,
  suggestions,
  tasks,
} from '@/lib/db/schema'
import { TEMPLATES, type TemplateKey, type TemplateContext } from '@/lib/suggestions/templates'
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeadlineCandidate {
  householdId: string
  sourceModule: 'car' | 'insurance' | 'electronics'
  sourceEntityId: string
  sourceField: string
  deadlineDate: Date
  templateKey: TemplateKey
  context: TemplateContext
}

// ---------------------------------------------------------------------------
// Inngest function: generate-suggestions
//
// Runs daily at 06:00 UTC or on-demand via 'app/suggestion.refresh'.
// Scans all households for deadlines within the next 14 days, then inserts
// pending suggestions for any that don't already exist.
// ---------------------------------------------------------------------------

export const generateSuggestions = inngest.createFunction(
  {
    id: 'generate-suggestions',
    name: 'Generate Deadline Suggestions',
    triggers: [
      { cron: '0 6 * * *' },
      { event: 'app/suggestion.refresh' },
    ],
  },
  async ({ step }: { step: any }) => {
    // Step 1: Get all households
    const allHouseholds = await step.run('fetch-households', async () => {
      return db.select({ id: households.id }).from(households)
    })

    let totalInserted = 0

    for (const household of allHouseholds) {
      const inserted = await step.run(
        `process-household-${household.id}`,
        async () => {
          const now = new Date()
          const windowEnd = addDays(now, 14)
          const candidates: DeadlineCandidate[] = []

          // ---------------------------------------------------------------
          // Cars
          // ---------------------------------------------------------------
          const householdCars = await db
            .select({
              id: cars.id,
              make: cars.make,
              model: cars.model,
              motDueDate: cars.motDueDate,
              taxDueDate: cars.taxDueDate,
              nextServiceDate: cars.nextServiceDate,
            })
            .from(cars)
            .where(eq(cars.householdId, household.id))

          for (const car of householdCars) {
            const carDeadlines: Array<{
              field: string
              date: Date | null
              key: TemplateKey
            }> = [
              { field: 'motDueDate', date: car.motDueDate, key: 'car.motDueDate' },
              { field: 'taxDueDate', date: car.taxDueDate, key: 'car.taxDueDate' },
              { field: 'nextServiceDate', date: car.nextServiceDate, key: 'car.nextServiceDate' },
            ]

            for (const dl of carDeadlines) {
              if (dl.date && dl.date >= startOfDay(now) && dl.date <= endOfDay(windowEnd)) {
                candidates.push({
                  householdId: household.id,
                  sourceModule: 'car',
                  sourceEntityId: car.id,
                  sourceField: dl.field,
                  deadlineDate: dl.date,
                  templateKey: dl.key,
                  context: {
                    make: car.make,
                    model: car.model,
                    date: format(dl.date, 'dd MMM yyyy'),
                  },
                })
              }
            }
          }

          // ---------------------------------------------------------------
          // Insurance policies
          // ---------------------------------------------------------------
          const householdPolicies = await db
            .select({
              id: insurancePolicies.id,
              insurer: insurancePolicies.insurer,
              policyType: insurancePolicies.policyType,
              expiryDate: insurancePolicies.expiryDate,
              nextPaymentDate: insurancePolicies.nextPaymentDate,
              isAutoPayment: insurancePolicies.isAutoPayment,
            })
            .from(insurancePolicies)
            .where(eq(insurancePolicies.householdId, household.id))

          for (const policy of householdPolicies) {
            // Expiry suggestions always show (even for auto-payment — renewal still needs action)
            if (policy.expiryDate && policy.expiryDate >= startOfDay(now) && policy.expiryDate <= endOfDay(windowEnd)) {
              candidates.push({
                householdId: household.id, sourceModule: 'insurance', sourceEntityId: policy.id,
                sourceField: 'expiryDate', deadlineDate: policy.expiryDate, templateKey: 'insurance.expiryDate',
                context: { insurer: policy.insurer, type: policy.policyType, date: format(policy.expiryDate, 'dd MMM yyyy') },
              })
            }
            // Payment suggestions only if NOT auto-payment
            if (!policy.isAutoPayment && policy.nextPaymentDate && policy.nextPaymentDate >= startOfDay(now) && policy.nextPaymentDate <= endOfDay(windowEnd)) {
              candidates.push({
                householdId: household.id, sourceModule: 'insurance', sourceEntityId: policy.id,
                sourceField: 'nextPaymentDate', deadlineDate: policy.nextPaymentDate, templateKey: 'insurance.nextPaymentDate',
                context: { insurer: policy.insurer, type: policy.policyType, date: format(policy.nextPaymentDate, 'dd MMM yyyy') },
              })
            }
          }

          // ---------------------------------------------------------------
          // Electronics
          // ---------------------------------------------------------------
          const householdElectronics = await db
            .select({
              id: electronics.id,
              name: electronics.name,
              warrantyExpiryDate: electronics.warrantyExpiryDate,
            })
            .from(electronics)
            .where(eq(electronics.householdId, household.id))

          for (const item of householdElectronics) {
            if (
              item.warrantyExpiryDate &&
              item.warrantyExpiryDate >= startOfDay(now) &&
              item.warrantyExpiryDate <= endOfDay(windowEnd)
            ) {
              candidates.push({
                householdId: household.id,
                sourceModule: 'electronics',
                sourceEntityId: item.id,
                sourceField: 'warrantyExpiryDate',
                deadlineDate: item.warrantyExpiryDate,
                templateKey: 'electronics.warrantyExpiryDate',
                context: {
                  name: item.name,
                  date: format(item.warrantyExpiryDate, 'dd MMM yyyy'),
                },
              })
            }
          }

          // ---------------------------------------------------------------
          // Filter out existing / dismissed suggestions
          // ---------------------------------------------------------------
          let insertedCount = 0

          for (const candidate of candidates) {
            const deadlineDateStr = format(candidate.deadlineDate, 'yyyy-MM-dd')

            // Check if suggestion already exists for this combo
            const existing = await db
              .select({ id: suggestions.id, status: suggestions.status })
              .from(suggestions)
              .where(
                and(
                  eq(suggestions.householdId, candidate.householdId),
                  eq(suggestions.sourceModule, candidate.sourceModule),
                  eq(suggestions.sourceEntityId, candidate.sourceEntityId),
                  eq(suggestions.sourceField, candidate.sourceField),
                  eq(suggestions.deadlineDate, deadlineDateStr)
                )
              )
              .limit(1)

            if (existing.length > 0) continue // already exists (pending, accepted, or dismissed)

            // Find least-loaded household member (fewest tasks this week)
            const weekStart = startOfWeek(now, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

            const members = await db
              .select({ id: householdMembers.id, userId: householdMembers.userId })
              .from(householdMembers)
              .where(eq(householdMembers.householdId, candidate.householdId))

            let leastLoadedMemberId: string | null = null
            let minTasks = Infinity

            for (const member of members) {
              const [result] = await db
                .select({ taskCount: count() })
                .from(tasks)
                .where(
                  and(
                    eq(tasks.householdId, candidate.householdId),
                    eq(tasks.ownerId, member.userId),
                    sql`${tasks.startsAt} >= ${weekStart.toISOString()}`,
                    sql`${tasks.startsAt} <= ${weekEnd.toISOString()}`
                  )
                )

              const taskCount = Number(result?.taskCount ?? 0)
              if (taskCount < minTasks) {
                minTasks = taskCount
                leastLoadedMemberId = member.id
              }
            }

            // Generate title and notes from template
            const template = TEMPLATES[candidate.templateKey]
            const { title, notes } = template(candidate.context)

            await db.insert(suggestions).values({
              householdId: candidate.householdId,
              sourceModule: candidate.sourceModule,
              sourceEntityId: candidate.sourceEntityId,
              sourceField: candidate.sourceField,
              deadlineDate: deadlineDateStr,
              suggestedTitle: title,
              suggestedNotes: notes,
              suggestedOwnerId: leastLoadedMemberId,
              status: 'pending',
            })

            insertedCount++
          }

          return insertedCount
        }
      )

      totalInserted += inserted
    }

    return { totalInserted, householdsProcessed: allHouseholds.length }
  }
)
