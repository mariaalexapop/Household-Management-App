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
  module: 'chores' | 'kids' | 'car' | 'insurance' | 'electronics' | 'costs'
  href: string   // navigates to source item in its module section
  colour: string // hex from MODULE_COLOURS
  label?: string // truncated title for month grid cells (max 20 chars)
  icon?: 'money' | null // optional icon override (e.g. money for payment events)
  filterCategory: FilterCategory // user-facing filter group
  childName?: string | null  // for kids events — child name pill label
  childColour?: string | null // hex for child pill background
}

export type FilterCategory =
  | 'chores'
  | 'kids_activities'
  | 'insurance_costs'
  | 'insurance_expiry'
  | 'warranty_expiry'
  | 'car_deadlines'

/**
 * MODULE_COLOURS — canonical colour per module (CAL-02).
 */
export const MODULE_COLOURS: Record<CalendarEvent['module'], string> = {
  chores:      '#0053dc', // blue — Kinship primary
  kids:        '#16a34a', // green-600
  car:         '#ea580c', // orange-600
  insurance:   '#9333ea', // purple-600
  electronics: '#0d9488', // teal-600
  costs:       '#ca8a04', // yellow-600
}

export const FILTER_COLOURS: Record<FilterCategory, string> = {
  chores:           '#0053dc',
  kids_activities:  '#16a34a',
  insurance_costs:  '#ca8a04',
  insurance_expiry: '#9333ea',
  warranty_expiry:  '#0d9488',
  car_deadlines:    '#ea580c',
}

export const FILTER_LABELS: Record<FilterCategory, string> = {
  chores:           'Chores',
  kids_activities:  'Kids Activities',
  insurance_costs:  'Insurance Costs',
  insurance_expiry: 'Insurance Expiration',
  warranty_expiry:  'Warranty Expiration',
  car_deadlines:    'Car-related Deadlines',
}

/** Ordered list for consistent rendering */
export const FILTER_ORDER: FilterCategory[] = [
  'chores',
  'kids_activities',
  'insurance_costs',
  'insurance_expiry',
  'warranty_expiry',
  'car_deadlines',
]

/**
 * Helper: map a raw title to a short calendar label (max 20 chars).
 */
export function toCalendarLabel(title: string): string {
  return title.length > 20 ? title.slice(0, 19) + '…' : title
}
