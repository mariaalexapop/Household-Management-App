/**
 * AI SDK v6 tool definitions for the household assistant.
 */
import { tool } from 'ai'
import { z } from 'zod'
import { and, asc, eq, gte, ilike, lte } from 'drizzle-orm'

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
        'Return chore tasks in this household. Use this whenever the user asks about chores, to-dos, or tasks.',
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            notes: tasks.notes,
            startsAt: tasks.startsAt,
            status: tasks.status,
          })
          .from(tasks)
          .where(eq(tasks.householdId, householdId))
          .orderBy(asc(tasks.startsAt))
          .limit(20)

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
        'Return upcoming kids activities in this household (school, medical, sport, hobby, social).',
      inputSchema: z.object({}),
      execute: async () => {
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
          .limit(10)

        return {
          activities: rows.map((r) => ({
            ...r,
            startsAt: r.startsAt ? r.startsAt.toISOString() : null,
          })),
        }
      },
    }),

    get_electronics: tool({
      description:
        'Return all electronics and appliances registered in this household with full details including brand, model number, warranty, and purchase info. Use this when the user asks about any appliance, device, warranty, or product they own.',
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            id: electronics.id,
            name: electronics.name,
            brand: electronics.brand,
            modelNumber: electronics.modelNumber,
            purchaseDate: electronics.purchaseDate,
            costCents: electronics.costCents,
            warrantyExpiryDate: electronics.warrantyExpiryDate,
            coverageSummary: electronics.coverageSummary,
          })
          .from(electronics)
          .where(eq(electronics.householdId, householdId))

        return {
          items: rows.map((r) => ({
            ...r,
            purchaseDate: r.purchaseDate?.toISOString() ?? null,
            warrantyExpiryDate: r.warrantyExpiryDate?.toISOString() ?? null,
            costFormatted: r.costCents ? `€${(r.costCents / 100).toFixed(2)}` : null,
          })),
        }
      },
    }),

    get_insurance_policies: tool({
      description:
        'Return all insurance policies in this household with full details including insurer, type, expiry, premium, and payment info.',
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            id: insurancePolicies.id,
            insurer: insurancePolicies.insurer,
            policyType: insurancePolicies.policyType,
            policyNumber: insurancePolicies.policyNumber,
            expiryDate: insurancePolicies.expiryDate,
            premiumCents: insurancePolicies.premiumCents,
            paymentSchedule: insurancePolicies.paymentSchedule,
            nextPaymentDate: insurancePolicies.nextPaymentDate,
            coveredName: insurancePolicies.coveredName,
          })
          .from(insurancePolicies)
          .where(eq(insurancePolicies.householdId, householdId))

        return {
          policies: rows.map((r) => ({
            ...r,
            expiryDate: r.expiryDate?.toISOString() ?? 'ongoing',
            nextPaymentDate: r.nextPaymentDate?.toISOString() ?? null,
            premiumFormatted: r.premiumCents ? `€${(r.premiumCents / 100).toFixed(2)}` : null,
          })),
        }
      },
    }),

    get_cars: tool({
      description:
        'Return all cars in the household with their MOT, tax, and next-service dates.',
      inputSchema: z.object({}),
      execute: async () => {
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

        return {
          cars: rows.map((r) => ({
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

    search_web: tool({
      description:
        'Search the web for information like user manuals, product guides, troubleshooting tips, or forum discussions. When the user asks about a registered product, first call get_electronics to get the brand and model number, then call this tool with those details.',
      inputSchema: z.object({
        query: z.string().describe('The search query, e.g. "LG OLED55C52LA user manual"'),
      }),
      execute: async ({ query }) => {
        const apiKey = process.env.TAVILY_API_KEY
        if (!apiKey) {
          return { error: 'Web search is not configured', results: [] }
        }

        try {
          const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              max_results: 5,
              include_answer: true,
              search_depth: 'basic',
            }),
          })

          if (!res.ok) {
            return { error: `Search failed (${res.status})`, results: [] }
          }

          const data = await res.json()
          return {
            answer: data.answer ?? null,
            results: (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
              title: r.title,
              url: r.url,
              snippet: r.content?.slice(0, 500),
            })),
          }
        } catch {
          return { error: 'Search request failed', results: [] }
        }
      },
    }),

    extract_procedure: tool({
      description:
        'Call this ONLY when the user explicitly asks to turn guidance into tasks. Return the ordered step list. The client will render a preview modal.',
      inputSchema: z.object({
        title: z.string().describe('Short title for the procedure'),
        steps: z
          .array(
            z.object({
              title: z.string(),
              description: z.string().optional(),
            })
          ),
      }),
      // NO execute function → surfaces to client as a UIMessage tool part.
    }),
  }
}
