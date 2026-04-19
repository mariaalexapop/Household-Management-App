import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('service worker', () => {
  const swPath = path.join(process.cwd(), 'public', 'sw.js')

  it('exists at public/sw.js', () => {
    expect(fs.existsSync(swPath)).toBe(true)
  })

  it('registers install listener', () => {
    const content = fs.readFileSync(swPath, 'utf-8')
    expect(content).toContain("addEventListener('install'")
  })

  it('registers activate listener', () => {
    const content = fs.readFileSync(swPath, 'utf-8')
    expect(content).toContain("addEventListener('activate'")
  })

  it('registers fetch listener', () => {
    const content = fs.readFileSync(swPath, 'utf-8')
    expect(content).toContain("addEventListener('fetch'")
  })
})
