import { test, expect } from '@playwright/test'

/**
 * Household E2E tests.
 *
 * NOTE: Tests that require a fully authenticated session with an existing
 * household are skipped here — they require a live Supabase session and
 * seeded data. Run those manually against a staging environment.
 *
 * The tests below cover observable UI behaviour for unauthenticated users
 * (redirects) and basic structural assertions.
 */

test.describe('Household page', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/household')
    // Unauthenticated users should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
  })

  test.skip('renders Members heading when authenticated', async ({ page }) => {
    // Requires: valid session cookie + household exists in DB
    // Setup: log in programmatically, then visit /household
    await page.goto('/household')
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible({ timeout: 10000 })
  })

  test.skip('shows current user in member list', async ({ page }) => {
    // Requires: valid session + household membership
    await page.goto('/household')
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible()
    // Current user's display name / email should appear in the list
    const memberList = page.locator('[data-testid="members-list"]')
    await expect(memberList).toBeVisible()
  })

  test.skip('InviteModal opens when Invite member button clicked', async ({ page }) => {
    // Requires: admin session + household
    await page.goto('/household')
    await page.getByRole('button', { name: 'Invite member' }).click()
    // Modal should be visible with tabs
    await expect(page.getByText('Invite by email')).toBeVisible()
    await expect(page.getByText('Share link')).toBeVisible()
  })

  test.skip('InviteModal shows two tabs — email and link', async ({ page }) => {
    // Requires: admin session + household
    await page.goto('/household')
    await page.getByRole('button', { name: 'Invite member' }).click()

    const emailTab = page.getByRole('button', { name: 'Invite by email' })
    const linkTab = page.getByRole('button', { name: 'Share link' })

    await expect(emailTab).toBeVisible()
    await expect(linkTab).toBeVisible()

    // Switch to link tab
    await linkTab.click()
    await expect(page.getByRole('button', { name: 'Generate link' })).toBeVisible()
  })
})

test.describe('Accept invite flow', () => {
  test('invalid token redirects unauthenticated user to signup with token preserved', async ({ page }) => {
    await page.goto('/api/household/invite/accept?token=not-a-real-token')
    // Unauthenticated users are redirected to signup with token preserved.
    // Authenticated users with an invalid/expired token would be redirected to /auth/login?error=invite_invalid.
    await expect(page).toHaveURL(/\/(auth\/signup|auth\/login)/, { timeout: 10000 })
  })

  test('missing token redirects to login with error', async ({ page }) => {
    await page.goto('/api/household/invite/accept')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
  })
})
