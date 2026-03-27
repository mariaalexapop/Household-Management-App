import { z } from 'zod'

export const step1Schema = z.object({
  householdName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  householdType: z.enum(['couple', 'family_with_kids', 'flatmates', 'single']),
})

export const step2Schema = z.object({
  activeModules: z
    .array(z.enum(['chores', 'car', 'insurance', 'electronics', 'kids']))
    .min(1, 'Select at least one module'),
})

export const createHouseholdSchema = z.object({
  householdName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  householdType: z.enum(['couple', 'family_with_kids', 'flatmates', 'single']),
  activeModules: z
    .array(z.enum(['chores', 'car', 'insurance', 'electronics', 'kids']))
    .min(1, 'Select at least one module'),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type CreateHouseholdData = z.infer<typeof createHouseholdSchema>
