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

// Card components — mock for test isolation.
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { 'data-testid': 'card', className }, children),
  CardContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  CardDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement('p', null, children),
  CardHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  CardTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('h3', null, children),
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
  CalendarHeart: () => React.createElement('span', { 'aria-hidden': true }, null),
}))

// date-fns format — mock for test isolation.
vi.mock('date-fns', () => ({
  format: (_date: Date, _fmt: string) => 'Mon 7 Apr',
}))

// React 19 renders asynchronously — use findBy* (async) instead of getBy* (sync).

// ---------------------------------------------------------------------------
// DashboardGrid
// ---------------------------------------------------------------------------

describe('DashboardGrid', () => {
  it('renders ChoresDashboardCard for chores module and ModuleCard for car', async () => {
    const modules: ModuleKey[] = ['chores', 'car']
    render(React.createElement(DashboardGrid, { activeModules: modules, upcomingTasks: [], upcomingActivities: [] }))

    // ChoresDashboardCard renders its own "Home Chores" heading
    await screen.findByText('Home Chores')
    // car still renders a ModuleCard
    await screen.findByText('Car Maintenance')
  })

  it('renders 1 "Coming soon" badge for 2 active modules (chores uses ChoresDashboardCard)', async () => {
    const modules: ModuleKey[] = ['chores', 'car']
    render(React.createElement(DashboardGrid, { activeModules: modules, upcomingTasks: [], upcomingActivities: [] }))

    // Only 'car' module shows "Coming soon"; 'chores' shows ChoresDashboardCard
    const badges = await screen.findAllByText('Coming soon')
    expect(badges).toHaveLength(1)
  })

  it('renders EmptyModuleState when activeModules is empty', async () => {
    render(React.createElement(DashboardGrid, { activeModules: [], upcomingTasks: [], upcomingActivities: [] }))

    await screen.findByText('No modules activated yet')
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('renders 3 "Coming soon" badges when all 5 modules are active (chores and kids use dashboard cards)', async () => {
    const all: ModuleKey[] = ['chores', 'car', 'insurance', 'electronics', 'kids']
    render(React.createElement(DashboardGrid, { activeModules: all, upcomingTasks: [], upcomingActivities: [] }))

    // 'chores' renders ChoresDashboardCard, 'kids' renders KidsDashboardCard — car/insurance/electronics show ModuleCard
    const badges = await screen.findAllByText('Coming soon')
    expect(badges).toHaveLength(3)
  })

  it('renders ChoresDashboardCard empty state when upcomingTasks is empty', async () => {
    render(React.createElement(DashboardGrid, { activeModules: ['chores'], upcomingTasks: [], upcomingActivities: [] }))

    await screen.findByText('No upcoming tasks. Add a task to get started.')
  })

  it('renders task list in ChoresDashboardCard when tasks provided', async () => {
    const tasks = [
      { id: '1', title: 'Clean kitchen', areaName: 'Kitchen', startsAt: new Date('2026-04-07T10:00:00Z') },
    ]
    render(React.createElement(DashboardGrid, { activeModules: ['chores'], upcomingTasks: tasks, upcomingActivities: [] }))

    await screen.findByText('Clean kitchen')
    await screen.findByText('Kitchen')
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
