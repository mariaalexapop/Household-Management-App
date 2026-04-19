import { describe, it, expect, vi } from 'vitest'

// Mock next/font/google to avoid font loading in test environment
vi.mock('next/font/google', () => ({
  Space_Grotesk: () => ({ variable: '--font-display' }),
  Noto_Sans: () => ({ variable: '--font-body' }),
}))

import { viewport } from '@/app/layout'

describe('viewport export', () => {
  it('sets width to device-width', () => {
    expect(viewport.width).toBe('device-width')
  })

  it('sets initialScale to 1', () => {
    expect(viewport.initialScale).toBe(1)
  })

  it('sets viewportFit to cover for safe area insets', () => {
    expect(viewport.viewportFit).toBe('cover')
  })

  it('sets themeColor', () => {
    expect(viewport.themeColor).toBeTruthy()
  })
})
