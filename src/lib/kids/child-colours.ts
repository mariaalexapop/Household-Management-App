/**
 * Rotating highlight colours for children — Miro pastel palette.
 * Each entry has a hex (for inline styles) and Tailwind classes (for borders/bg).
 */
const CHILD_PALETTE = [
  { hex: '#e05252', border: 'border-l-[#e05252]', bg: 'bg-[#ffc6c6]' },   // coral
  { hex: '#187574', border: 'border-l-[#187574]', bg: 'bg-[#c3faf5]' },   // teal
  { hex: '#7a4000', border: 'border-l-[#7a4000]', bg: 'bg-[#ffe6cd]' },   // orange
  { hex: '#7a1060', border: 'border-l-[#7a1060]', bg: 'bg-[#ffd8f4]' },   // rose
  { hex: '#746019', border: 'border-l-[#746019]', bg: 'bg-[#fffacd]' },   // yellow
  { hex: '#5b76fe', border: 'border-l-[#5b76fe]', bg: 'bg-[#eef0ff]' },   // blue
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function childColourIndex(childId: string): number {
  return hashId(childId) % CHILD_PALETTE.length
}

/** Hex colour for a child (useful for inline styles, calendar dots, etc.) */
export function childHex(childId: string): string {
  return CHILD_PALETTE[childColourIndex(childId)].hex
}

/** Tailwind border-l class for a child */
export function childBorderClass(childId: string): string {
  return CHILD_PALETTE[childColourIndex(childId)].border
}

/** Tailwind bg class for a child (light pastel) */
export function childBgClass(childId: string): string {
  return CHILD_PALETTE[childColourIndex(childId)].bg
}

export { CHILD_PALETTE }
