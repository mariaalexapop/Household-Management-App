import { test, expect } from '@playwright/test'

/**
 * Realtime & Settings E2E smoke tests.
 *
 * These tests cover observable UI behaviour for unauthenticated users
 * (redirects, HTTP status) and structural assertions (routes registered).
 *
 * Tests that require a live authenticated session with a real Supabase
 * household are marked test.skip — run those manually against staging.
 *
 * NOTE: Live realtime disconnect testing requires network manipulation
 * (e.g., Chrome DevTools → Network throttling → Offline toggle).
 * TODO: Implement realtime disconnect tests with Playwright's route
 * interception or CDP once the staging environment is stable.
 */

test.describe('Connection indicator', () => {
  test('no reconnecting banner is visible on /dashboard for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    // Unauthenticated users are redirected away before realtime mounts
    // so the reconnecting banner should never appear
    const banner = page.locator('[role="status"]').filter({ hasText: 'Reconnecting' })
    await expect(banner).not.toBeVisible({ timeout: 5000 })
  })

  test.skip('reconnecting banner appears when WebSocket drops (manual test)', async ({ page }) => {
    // TODO: Use CDP (Chrome DevTools Protocol) or Playwright network interception
    // to simulate a WebSocket disconnect, then assert:
    //   1. Banner with text "Reconnecting..." appears within 2 seconds
    //   2. Banner disappears when connection restores
    // Requires: valid session + household + ability to drop WebSocket
  })
})

test.describe('Module settings page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/settings/modules')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
  })

  test.skip('shows all 5 module toggles when authenticated', async ({ page }) => {
    // TODO: Requires: valid session + household with settings row
    // Setup: authenticate programmatically, then visit /settings/modules
    await page.goto('/settings/modules')
    // All 5 module toggles should be visible
    const toggles = page.getByRole('switch')
    await expect(toggles).toHaveCount(5, { timeout: 10000 })
  })
})

test.describe('GDPR deletion endpoint', () => {
  test('GET /api/household/gdpr returns 405 Method Not Allowed (DELETE-only route)', async ({ request }) => {
    const response = await request.get('/api/household/gdpr')
    // Next.js returns 405 when the HTTP method has no handler registered
    expect(response.status()).toBe(405)
  })

  test('DELETE /api/household/gdpr returns 401 when not authenticated', async ({ request }) => {
    const response = await request.delete('/api/household/gdpr')
    expect(response.status()).toBe(401)
  })
})

test.describe('Settings page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
  })

  test.skip('shows Danger Zone section when authenticated', async ({ page }) => {
    // TODO: Requires: valid session + household member
    await page.goto('/settings')
    await expect(page.getByText('Danger Zone')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Delete my account' })).toBeVisible()
  })
})

test.describe('Household page — Activity section', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/household')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
  })

  test.skip('shows Activity section when authenticated', async ({ page }) => {
    // TODO: Requires: valid session + household with activity_feed rows
    await page.goto('/household')
    await expect(page.getByText('Activity')).toBeVisible({ timeout: 10000 })
  })
})
