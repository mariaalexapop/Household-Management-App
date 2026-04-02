/**
 * Unit tests for recurrence rule parsing and occurrence generation (CHORE-05, CHORE-06).
 * Pure date logic — no DB, no Inngest.
 */
import { describe, it } from 'vitest'

describe('Recurrence', () => {
  it.todo('CHORE-05: generateOccurrences with frequency=daily, interval=1 produces 365 dates within 1 year')
  it.todo('CHORE-05: generateOccurrences with frequency=weekly, interval=1 produces 52 dates within 1 year')
  it.todo('CHORE-05: generateOccurrences with frequency=monthly, interval=1 produces 12 dates within 1 year')
  it.todo('CHORE-05: generateOccurrences with frequency=yearly, interval=1 produces 1 date within 1 year')
  it.todo('CHORE-05: generateOccurrences respects on_day_of_week for weekly recurrence')
  it.todo('CHORE-05: generateOccurrences respects on_day_of_month for monthly recurrence')
  it.todo('CHORE-05: generateOccurrences with interval=2 and frequency=weekly produces ~26 dates')
  it.todo('CHORE-06: all occurrence rows have parentTaskId set to the parent task id')
  it.todo('CHORE-06: occurrence rows have isRecurring=true')
  it.todo('CHORE-06: parent task row has parentTaskId=null and isRecurring=true')
})
