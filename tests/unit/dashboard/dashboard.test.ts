import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { ModuleCard } from '@/components/dashboard/ModuleCard'
import type { ModuleKey } from '@/stores/onboarding'

// next/link renders as <a> in jsdom
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}))

// Badge uses @base-ui/react which conflicts with the test React instance in pnpm's
// virtual store. Mock with a plain span to keep tests hermetic.
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': 'badge' }, children),
  badgeVariants: () => '',
}))

// lucide-react v1.x uses SVG internals incompatible with jsdom — mock with stubs.
vi.mock('lucide-react', () => ({
  CheckSquare: () => React.createElement('span', { 'aria-hidden': true }, null),
  Car: () => React.createElement('span', { 'aria-hidden': true }, null),
  Shield: () => React.createElement('span', { 'aria-hidden': true }, null),
  Laptop: () => React.createElement('span', { 'aria-hidden': true }, null),
  Users: () => React.createElement('span', { 'aria-hidden': true }, null),
  ChevronLeft: () => React.createElement('span', { 'aria-hidden': true }, null),
  Check: () => React.createElement('span', { 'aria-hidden': true }, null),
  Heart: () => React.createElement('span', { 'aria-hidden': true }, null),
  Home: () => React.createElement('span', { 'aria-hidden': true }, null),
  User: () => React.createElement('span', { 'aria-hidden': true }, null),
}))

// React 19 renders asynchronously — use findBy* (async) instead of getBy* (sync).

// ---------------------------------------------------------------------------
// DashboardGrid
// ---------------------------------------------------------------------------

describe('DashboardGrid', () => {
  it('renders one ModuleCard per active module', async () => {
    const modules: ModuleKey[] = ['chores', 'car']
    render(React.createElement(DashboardGrid, { activeModules: modules }))

    await screen.findByText('Home Chores')
    await screen.findByText('Car Maintenance')
  })

  it('renders exactly 2 "Coming soon" badges for 2 active modules', async () => {
    const modules: ModuleKey[] = ['chores', 'car']
    render(React.createElement(DashboardGrid, { activeModules: modules }))

    const badges = await screen.findAllByText('Coming soon')
    expect(badges).toHaveLength(2)
  })

  it('renders EmptyModuleState when activeModules is empty', async () => {
    render(React.createElement(DashboardGrid, { activeModules: [] }))

    await screen.findByText('No modules activated yet')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('renders all 5 "Coming soon" badges when all modules are active', async () => {
    const all: ModuleKey[] = ['chores', 'car', 'insurance', 'electronics', 'kids']
    render(React.createElement(DashboardGrid, { activeModules: all }))

    const badges = await screen.findAllByText('Coming soon')
    expect(badges).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// ModuleCard
// ---------------------------------------------------------------------------

describe('ModuleCard', () => {
  it('renders the label "Home Chores" for key=chores', async () => {
    render(React.createElement(ModuleCard, { moduleKey: 'chores' }))
    await screen.findByText('Home Chores')
  })

  it('renders the label "Car Maintenance" for key=car', async () => {
    render(React.createElement(ModuleCard, { moduleKey: 'car' }))
    await screen.findByText('Car Maintenance')
  })

  it('renders the description for each module', async () => {
    render(React.createElement(ModuleCard, { moduleKey: 'insurance' }))
    await screen.findByText('Policies, documents, expiry reminders')
  })

  it('renders a "Coming soon" badge', async () => {
    render(React.createElement(ModuleCard, { moduleKey: 'kids' }))
    await screen.findByText('Coming soon')
  })
})
