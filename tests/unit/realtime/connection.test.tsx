/**
 * Unit tests for realtime components.
 *
 * Tests cover:
 * 1. ConnectionIndicator renders null when status is 'connected'
 * 2. ConnectionIndicator renders reconnecting text when status is 'disconnected'
 * 3. mergeActivityItems (pure function) — deduplicates by id, sorts by created_at desc
 * 4. ActivityFeed renders items and shows empty state
 *
 * useRealtime hook is mocked via vi.mock.
 * date-fns is mocked to avoid time-zone-sensitive output in CI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks — vi.mock calls are hoisted to the top by vitest
// ---------------------------------------------------------------------------

vi.mock('@/components/realtime/RealtimeProvider', () => ({
  useRealtime: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ refresh: vi.fn() }),
}))

// Mock date-fns to avoid locale/tz issues in tests
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}))

// ---------------------------------------------------------------------------
// Static imports (resolved after mock hoisting)
// ---------------------------------------------------------------------------

import { useRealtime } from '@/components/realtime/RealtimeProvider'
import { ConnectionIndicator } from '@/components/realtime/ConnectionIndicator'
import { ActivityFeed, mergeActivityItems } from '@/components/household/ActivityFeed'
import type { ActivityFeedItem } from '@/components/realtime/RealtimeProvider'

const mockUseRealtime = vi.mocked(useRealtime)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(id: string, createdAt: string): ActivityFeedItem {
  return {
    id,
    householdId: 'hh-1',
    actorId: 'user-1',
    eventType: 'member_joined',
    entityType: 'household_members',
    metadata: { actorName: 'Alice' },
    createdAt,
  }
}

// ---------------------------------------------------------------------------
// ConnectionIndicator tests
// ---------------------------------------------------------------------------

describe('ConnectionIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when status is connected', async () => {
    mockUseRealtime.mockReturnValue({ status: 'connected', activityItems: [], notifications: [], unreadCount: 0 })
    render(<ConnectionIndicator />)
    // No banner text should be visible
    await new Promise((r) => setTimeout(r, 0)) // flush
    expect(document.querySelector('[role="status"]')).toBeNull()
  })

  it('renders reconnecting banner when status is disconnected', async () => {
    mockUseRealtime.mockReturnValue({ status: 'disconnected', activityItems: [], notifications: [], unreadCount: 0 })
    render(<ConnectionIndicator />)
    const banner = await screen.findByText('Reconnecting...')
    expect(banner).toBeTruthy()
  })

  it('renders reconnecting banner when status is connecting', async () => {
    mockUseRealtime.mockReturnValue({ status: 'connecting', activityItems: [], notifications: [], unreadCount: 0 })
    render(<ConnectionIndicator />)
    const banner = await screen.findByText('Reconnecting...')
    expect(banner).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// mergeActivityItems pure function tests (no React rendering needed)
// ---------------------------------------------------------------------------

describe('mergeActivityItems', () => {
  it('deduplicates items by id — realtime takes priority', () => {
    const item1 = makeItem('id-1', '2024-01-01T10:00:00Z')
    const item2 = makeItem('id-2', '2024-01-01T09:00:00Z')

    // item1 appears in both arrays — should only appear once in output
    const result = mergeActivityItems([item1], [item1, item2])
    expect(result).toHaveLength(2)
    expect(result.map((i) => i.id)).toEqual(['id-1', 'id-2'])
  })

  it('sorts by created_at descending (newer first)', () => {
    const older = makeItem('id-old', '2024-01-01T08:00:00Z')
    const newer = makeItem('id-new', '2024-01-02T08:00:00Z')

    const result = mergeActivityItems([], [older, newer])
    expect(result[0].id).toBe('id-new')
    expect(result[1].id).toBe('id-old')
  })

  it('merges realtime and initial items with distinct ids', () => {
    const initial = makeItem('init-1', '2024-01-01T07:00:00Z')
    const realtime = makeItem('rt-1', '2024-01-01T11:00:00Z')

    const result = mergeActivityItems([realtime], [initial])
    expect(result).toHaveLength(2)
    // Realtime item (newer) should come first
    expect(result[0].id).toBe('rt-1')
    expect(result[1].id).toBe('init-1')
  })

  it('returns empty array when both inputs are empty', () => {
    const result = mergeActivityItems([], [])
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// ActivityFeed rendering tests (useRealtime mocked, date-fns mocked)
// ---------------------------------------------------------------------------

describe('ActivityFeed rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no items', async () => {
    mockUseRealtime.mockReturnValue({ status: 'connected', activityItems: [], notifications: [], unreadCount: 0 })
    render(<ActivityFeed initialItems={[]} />)
    const empty = await screen.findByText('No activity yet.')
    expect(empty).toBeTruthy()
  })

  it('renders activity items from initialItems', async () => {
    mockUseRealtime.mockReturnValue({ status: 'connected', activityItems: [], notifications: [], unreadCount: 0 })
    const item = makeItem('id-1', '2024-01-01T10:00:00Z')
    render(<ActivityFeed initialItems={[item]} />)
    const text = await screen.findByText('Alice joined the household')
    expect(text).toBeTruthy()
  })
})
