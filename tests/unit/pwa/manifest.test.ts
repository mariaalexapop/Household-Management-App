import { describe, it, expect } from 'vitest'
import manifest from '@/app/manifest'

describe('PWA manifest', () => {
  const m = manifest()

  it('has a name', () => {
    expect(m.name).toBeTruthy()
  })

  it('has a short_name', () => {
    expect(m.short_name).toBeTruthy()
  })

  it('sets display to standalone', () => {
    expect(m.display).toBe('standalone')
  })

  it('sets start_url to /dashboard', () => {
    expect(m.start_url).toBe('/dashboard')
  })

  it('has 192px and 512px icons', () => {
    const icons = m.icons ?? []
    const sizes = icons.map((i: { sizes?: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  it('has a maskable icon', () => {
    const icons = m.icons ?? []
    const maskable = icons.find((i: { purpose?: string }) => i.purpose === 'maskable')
    expect(maskable).toBeTruthy()
  })
})
