/**
 * Unit tests for recurrence rule parsing and occurrence generation (CHORE-05, CHORE-06).
 * Pure date logic — no DB, no Inngest.
 */
import { describe, it, expect } from 'vitest'
import { generateOccurrences } from '@/lib/chores/recurrence'

describe('generateOccurrences', () => {
  const START = new Date('2026-01-01T09:00:00Z')
  const WINDOW_END = new Date('2027-01-01T09:00:00Z') // exactly 1 year

  it('CHORE-05: daily interval=1 produces 365 occurrences in 1 year', () => {
    const result = generateOccurrences({ frequency: 'daily', interval: 1 }, START, WINDOW_END)
    expect(result.length).toBe(365)
  })

  it('CHORE-05: weekly interval=1 produces 52-53 occurrences in 1 year', () => {
    // 365-day year starting Jan 1: 52 full weeks + 1 day → 53 Thursdays fit before Jan 1 next year
    const result = generateOccurrences({ frequency: 'weekly', interval: 1 }, START, WINDOW_END)
    expect(result.length).toBeGreaterThanOrEqual(52)
    expect(result.length).toBeLessThanOrEqual(53)
  })

  it('CHORE-05: monthly interval=1 produces 12 occurrences in 1 year', () => {
    const result = generateOccurrences({ frequency: 'monthly', interval: 1 }, START, WINDOW_END)
    expect(result.length).toBe(12)
  })

  it('CHORE-05: yearly interval=1 produces 1 occurrence in 1 year', () => {
    const result = generateOccurrences({ frequency: 'yearly', interval: 1 }, START, WINDOW_END)
    expect(result.length).toBe(1)
  })

  it('CHORE-05: biweekly (interval=2) produces ~26 occurrences', () => {
    const result = generateOccurrences({ frequency: 'weekly', interval: 2 }, START, WINDOW_END)
    expect(result.length).toBeGreaterThanOrEqual(26)
    expect(result.length).toBeLessThanOrEqual(27)
  })

  it('CHORE-05: weekly with on_day_of_week=1 (Monday), start=Wednesday, first occurrence is next Monday', () => {
    const wed = new Date('2026-01-07T09:00:00Z') // Wednesday
    const result = generateOccurrences({ frequency: 'weekly', interval: 1, on_day_of_week: 1 }, wed, WINDOW_END)
    // First occurrence should be Monday 2026-01-12
    expect(result[0]?.toISOString().startsWith('2026-01-12')).toBe(true)
  })

  it('CHORE-05: monthly with on_day_of_month=15, first two occurrences on 15th', () => {
    const result = generateOccurrences({ frequency: 'monthly', interval: 1, on_day_of_month: 15 }, START, WINDOW_END)
    expect(new Date(result[0]!).getUTCDate()).toBe(15)
    expect(new Date(result[1]!).getUTCDate()).toBe(15)
  })

  it('CHORE-05: no occurrence exceeds windowEndDate', () => {
    const result = generateOccurrences({ frequency: 'daily', interval: 1 }, START, WINDOW_END)
    const last = result[result.length - 1]!
    expect(last <= WINDOW_END).toBe(true)
  })

  it('CHORE-06: returns empty array when interval=0', () => {
    const result = generateOccurrences({ frequency: 'daily', interval: 0 }, START, WINDOW_END)
    expect(result.length).toBe(0)
  })
})
