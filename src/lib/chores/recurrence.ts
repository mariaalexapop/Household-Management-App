import { addDays, addWeeks, addMonths, addYears, setDate, setDay, isBefore, isEqual } from 'date-fns'

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  on_day_of_month?: number | null
  on_day_of_week?: number | null
  recurrence_end_date?: string | null // yyyy-MM-dd; null / absent = no end (1-year window)
}

/**
 * Generates all occurrence dates for a recurring task within the window
 * [startDate, windowEndDate]. The first occurrence is startDate itself
 * (adjusted for on_day_of_week / on_day_of_month if specified).
 *
 * For weekly recurrence with on_day_of_week set: if startDate is not on that
 * day of week, advances to the next occurrence of that day first.
 *
 * For monthly/yearly with on_day_of_month set: adjusts the day of month.
 * Capped at 400 iterations to prevent infinite loops.
 */
export function generateOccurrences(
  rule: RecurrenceRule,
  startDate: Date,
  windowEndDate: Date
): Date[] {
  if (!rule.interval || rule.interval <= 0) return []

  const occurrences: Date[] = []
  let current = new Date(startDate)

  // For weekly: snap to on_day_of_week if specified
  if (rule.frequency === 'weekly' && rule.on_day_of_week != null) {
    current = setDay(current, rule.on_day_of_week, { weekStartsOn: 0 })
    // If setDay moved us backward, advance one week
    if (isBefore(current, startDate) && !isEqual(current, startDate)) {
      current = addWeeks(current, 1)
    }
  }

  // For monthly/yearly: snap to on_day_of_month if specified
  if (
    (rule.frequency === 'monthly' || rule.frequency === 'yearly') &&
    rule.on_day_of_month != null
  ) {
    current = setDate(current, rule.on_day_of_month)
    if (isBefore(current, startDate) && !isEqual(current, startDate)) {
      current = addMonths(current, 1)
      if (rule.on_day_of_month != null) {
        current = setDate(current, rule.on_day_of_month)
      }
    }
  }

  let iterations = 0
  while (isBefore(current, windowEndDate) && iterations < 400) {
    occurrences.push(new Date(current))
    switch (rule.frequency) {
      case 'daily':
        current = addDays(current, rule.interval)
        break
      case 'weekly':
        current = addWeeks(current, rule.interval)
        break
      case 'monthly': {
        current = addMonths(current, rule.interval)
        if (rule.on_day_of_month != null) current = setDate(current, rule.on_day_of_month)
        break
      }
      case 'yearly':
        current = addYears(current, rule.interval)
        break
    }
    iterations++
  }

  return occurrences
}
