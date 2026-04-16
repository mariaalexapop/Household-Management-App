/**
 * AI SDK v6 tool definitions for the household assistant.
 *
 * `buildTools(ctx)` returns a map of six tools:
 *   - Five server-side tools with `execute` functions that hit the Drizzle DB,
 *     filter by the caller's householdId, and return JSON-safe results
 *     (Dates serialised to ISO strings — see Phase 5 research Pitfall 7).
 *   - `extract_procedure`, a CLIENT-facing tool declared WITHOUT an `execute`
 *     function. The AI SDK will surface its tool call as a UIMessage part so
 *     the client chat UI can render a confirmation modal (research Pitfall 5).
 */
import { tool } from 'ai'
import { z } from 'zod'
import { and, asc, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  cars,
  electronics,
  insurancePolicies,
  kidActivities,
  tasks,
} from '@/lib/db/schema'

export interface ToolContext {
  householdId: string
  userId: string
}

export function buildTools(ctx: ToolContext) {
  const householdId = ctx.householdId

  return {
    get_upcoming_chores: tool({
      description:
        'Return the next N chore tasks due in this household, soonest first. Use this whenever the user asks about upcoming chores, to-dos, or tasks.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(5),
      }),
      execute: async ({ limit }) => {
        const rows = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            startsAt: tasks.startsAt,
            status: tasks.status,
          })
          .from(tasks)
          .where(
            and(eq(tasks.householdId, householdId), gte(tasks.startsAt, new Date()))
          )
          .orderBy(asc(tasks.startsAt))
          .limit(limit)

        return {
          tasks: rows.map((r) => ({
            ...r,
            startsAt: r.startsAt ? r.startsAt.toISOString() : null,
          })),
        }
      },
    }),

    get_upcoming_activities: tool({
      description:
        'Return the next N upcoming kids activities in this household (school, medical, sport, hobby, social).',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(5),
      }),
      execute: async ({ limit }) => {
        const rows = await db
          .select({
            id: kidActivities.id,
            title: kidActivities.title,
            category: kidActivities.category,
            startsAt: kidActivities.startsAt,
            location: kidActivities.location,
          })
          .from(kidActivities)
          .where(
            and(
              eq(kidActivities.householdId, householdId),
              gte(kidActivities.startsAt, new Date())
            )
          )
          .orderBy(asc(kidActivities.startsAt))
          .limit(limit)

        return {
          activities: rows.map((r) => ({
            ...r,
            startsAt: r.startsAt ? r.startsAt.toISOString() : null,
          })),
        }
      },
    }),

    get_warranty_expiries: tool({
      description:
        'List electronics whose warranty expires within the next N days (default 90).',
      inputSchema: z.object({
        withinDays: z.number().int().min(1).max(365).default(90),
      }),
      execute: async ({ withinDays }) => {
        const until = new Date(Date.now() + withinDays * 864e5)
        const rows = await db
          .select({
            id: electronics.id,
            name: electronics.name,
            brand: electronics.brand,
            warrantyExpiryDate: electronics.warrantyExpiryDate,
          })
          .from(electronics)
          .where(
            and(
              eq(electronics.householdId, householdId),
              lte(electronics.warrantyExpiryDate, until)
            )
          )

        return {
          items: rows.map((r) => ({
            ...r,
            warrantyExpiryDate: r.warrantyExpiryDate
              ? r.warrantyExpiryDate.toISOString()
              : null,
          })),
        }
      },
    }),

    get_insurance_expiries: tool({
      description:
        'List insurance policies that expire within the next N days (default 90).',
      inputSchema: z.object({
        withinDays: z.number().int().min(1).max(365).default(90),
      }),
      execute: async ({ withinDays }) => {
        const until = new Date(Date.now() + withinDays * 864e5)
        const rows = await db
          .select({
            id: insurancePolicies.id,
            insurer: insurancePolicies.insurer,
            policyType: insurancePolicies.policyType,
            expiryDate: insurancePolicies.expiryDate,
          })
          .from(insurancePolicies)
          .where(
            and(
              eq(insurancePolicies.householdId, householdId),
              lte(insurancePolicies.expiryDate, until)
            )
          )

        return {
          policies: rows.map((r) => ({
            ...r,
            expiryDate: r.expiryDate?.toISOString() ?? 'ongoing',
          })),
        }
      },
    }),

    get_car_reminders: tool({
      description:
        'Return car MOT, tax, and next-service dates for cars in the household with any of those dates within the next N days (default 30).',
      inputSchema: z.object({
        withinDays: z.number().int().min(1).max(365).default(30),
      }),
      execute: async ({ withinDays }) => {
        const until = new Date(Date.now() + withinDays * 864e5)
        const rows = await db
          .select({
            id: cars.id,
            make: cars.make,
            model: cars.model,
            plate: cars.plate,
            motDueDate: cars.motDueDate,
            taxDueDate: cars.taxDueDate,
            nextServiceDate: cars.nextServiceDate,
          })
          .from(cars)
          .where(eq(cars.householdId, householdId))

        const filtered = rows.filter((r) => {
          const dates = [r.motDueDate, r.taxDueDate, r.nextServiceDate].filter(
            Boolean
          ) as Date[]
          return dates.some((d) => d <= until)
        })

        return {
          cars: filtered.map((r) => ({
            ...r,
            motDueDate: r.motDueDate ? r.motDueDate.toISOString() : null,
            taxDueDate: r.taxDueDate ? r.taxDueDate.toISOString() : null,
            nextServiceDate: r.nextServiceDate
              ? r.nextServiceDate.toISOString()
              : null,
          })),
        }
      },
    }),

    extract_procedure: tool({
      description:
        'Call this when the user asks to turn the document guidance in the current conversation into tasks. Return the ordered step list you extracted from the retrieved document chunks. DO NOT create tasks yourself — the client will render a preview modal and let the user confirm.',
      inputSchema: z.object({
        title: z
          .string()
          .min(1)
          .max(200)
          .describe('Short title for the procedure, e.g. "Report a burst pipe"'),
        steps: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              description: z.string().max(2000).optional(),
            })
          )
          .min(1)
          .max(20),
      }),
      // NO execute function → surfaces to client as a UIMessage tool part.
    }),
  }
}
