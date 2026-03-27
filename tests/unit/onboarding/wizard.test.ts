import { beforeEach, describe, expect, it } from 'vitest'
import { useOnboardingStore } from '@/stores/onboarding'
import { step1Schema, step2Schema } from '@/lib/validations/onboarding'

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset()
  })

  describe('toggleModule', () => {
    it('adds a module when not already selected', () => {
      useOnboardingStore.getState().toggleModule('chores')
      expect(useOnboardingStore.getState().activeModules).toEqual(['chores'])
    })

    it('removes a module when already selected (idempotent toggle)', () => {
      useOnboardingStore.getState().toggleModule('chores')
      useOnboardingStore.getState().toggleModule('chores')
      expect(useOnboardingStore.getState().activeModules).toEqual([])
    })

    it('can select multiple modules independently', () => {
      useOnboardingStore.getState().toggleModule('chores')
      useOnboardingStore.getState().toggleModule('car')
      expect(useOnboardingStore.getState().activeModules).toContain('chores')
      expect(useOnboardingStore.getState().activeModules).toContain('car')
    })
  })

  describe('setHouseholdType', () => {
    it('sets the household type', () => {
      useOnboardingStore.getState().setHouseholdType('family_with_kids')
      expect(useOnboardingStore.getState().householdType).toBe('family_with_kids')
    })

    it('replaces the previous household type', () => {
      useOnboardingStore.getState().setHouseholdType('couple')
      useOnboardingStore.getState().setHouseholdType('single')
      expect(useOnboardingStore.getState().householdType).toBe('single')
    })
  })
})

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

describe('step1Schema', () => {
  it('rejects an empty household name', () => {
    const result = step1Schema.safeParse({ householdName: '', householdType: 'couple' })
    expect(result.success).toBe(false)
  })

  it('rejects a name that is too short (1 char)', () => {
    const result = step1Schema.safeParse({ householdName: 'A', householdType: 'couple' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid name and household type', () => {
    const result = step1Schema.safeParse({
      householdName: 'The Smiths',
      householdType: 'family_with_kids',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid household type', () => {
    const result = step1Schema.safeParse({
      householdName: 'The Smiths',
      householdType: 'invalid_type',
    })
    expect(result.success).toBe(false)
  })
})

describe('step2Schema', () => {
  it('rejects an empty activeModules array', () => {
    const result = step2Schema.safeParse({ activeModules: [] })
    expect(result.success).toBe(false)
  })

  it('accepts an array with one valid module', () => {
    const result = step2Schema.safeParse({ activeModules: ['chores'] })
    expect(result.success).toBe(true)
  })

  it('accepts an array with multiple valid modules', () => {
    const result = step2Schema.safeParse({ activeModules: ['chores', 'car', 'insurance'] })
    expect(result.success).toBe(true)
  })

  it('rejects an array containing an invalid module key', () => {
    const result = step2Schema.safeParse({ activeModules: ['invalid'] })
    expect(result.success).toBe(false)
  })
})
