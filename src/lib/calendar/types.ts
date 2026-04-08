/**
 * CalendarEvent — unified type for all calendar data sources.
 *
 * Phase 3 sources: chores (tasks table), kids (kid_activities table)
 * Phase 4 extension: add car, insurance, electronics sources to the
 * calendar page without modifying this type or the UnifiedCalendar component.
 */
export interface CalendarEvent {
  id: string
  title: string
  startsAt: Date
  endsAt?: Date | null
  module: 'chores' | 'kids' | 'car' | 'insurance' | 'electronics'
  href: string   // navigates to source item in its module section
  colour: string // hex from MODULE_COLOURS
  label?: string // truncated title for month grid cells (max 20 chars)
}

/**
 * MODULE_COLOURS — canonical colour per module (CAL-02).
 * Phase 4 will use the same map when adding car/insurance/electronics events.
 */
export const MODULE_COLOURS: Record<CalendarEvent['module'], string> = {
  chores:      '#0053dc', // blue — Kinship primary
  kids:        '#16a34a', // green-600
  car:         '#ea580c', // orange-600
  insurance:   '#9333ea', // purple-600
  electronics: '#0d9488', // teal-600
}

/**
 * Helper: map a raw title to a short calendar label (max 20 chars).
 */
export function toCalendarLabel(title: string): string {
  return title.length > 20 ? title.slice(0, 19) + '…' : title
}
