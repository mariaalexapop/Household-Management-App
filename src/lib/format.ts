/**
 * Cost formatting utilities.
 * All costs in the database are stored as integer cents (COST-01).
 * These helpers convert between cents and display strings / pounds.
 */

export function formatCostFromCents(cents: number | null | undefined): string {
  if (cents == null) return '--'
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function centsToPounds(cents: number): number {
  return cents / 100
}

export function poundsToCents(pounds: number): number {
  return Math.round(pounds * 100)
}
