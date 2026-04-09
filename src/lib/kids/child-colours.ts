/**
 * Rotating highlight colours for children — 6 visually distinct colours.
 *
 * Colours are assigned by position in a sorted child list, not by hash,
 * to guarantee no two children share the same colour (up to 6 children).
 */
const CHILD_PALETTE = [
  '#5b76fe', // blue
  '#00b473', // green
  '#e05252', // coral
  '#b34a9c', // purple
  '#ea8c00', // amber
  '#187574', // teal
]

// Runtime registry: call registerChildren() with the full sorted child list,
// then childHex() returns a deterministic colour per child ID.
const childIndexMap = new Map<string, number>()

/** Call once with the full sorted child list to assign colours by position. */
export function registerChildren(childIds: string[]): void {
  childIndexMap.clear()
  childIds.forEach((id, i) => childIndexMap.set(id, i))
}

/** Hex colour for a child. Falls back to position-based modulo if registered,
 *  or uses last 4 hex chars of the UUID for a stable fallback. */
export function childHex(childId: string): string {
  const idx = childIndexMap.get(childId)
  if (idx !== undefined) return CHILD_PALETTE[idx % CHILD_PALETTE.length]
  // Fallback: use last 4 hex chars of UUID for stable distribution
  const tail = parseInt(childId.replace(/-/g, '').slice(-4), 16)
  return CHILD_PALETTE[tail % CHILD_PALETTE.length]
}

export { CHILD_PALETTE }
