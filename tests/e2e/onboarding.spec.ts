import { test, expect } from '@playwright/test'

/**
 * Onboarding E2E tests.
 *
 * Tests that require an authenticated session (no household) are skipped when
 * SUPABASE_URL is not available in the environment — they are validated manually
 * against the live project.
 *
 * UI-only tests (wizard page structure) are skipped because the middleware
 * redirects unauthenticated users to /auth/login; these pages require a valid
 * session and are covered by the authenticated test group.
 */

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL

test.describe('Onboarding wizard — UI structure', () => {
  // These tests require a live auth session; skip in environments without Supabase.
  test.skip(!hasSupabase, 'Requires NEXT_PUBLIC_SUPABASE_URL (live Supabase project)')

  test('wizard step-1 shows household name input and type options', async ({ page }) => {
    await page.goto('/onboarding/step-1')

    await expect(page.getByLabel('Household name')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Couple')).toBeVisible()
    await expect(page.getByText('Family with Kids')).toBeVisible()
    await expect(page.getByText('Flatmates')).toBeVisible()
    await expect(page.getByText('Single')).toBeVisible()
  })

  test('wizard step-2 shows 5 module toggle cards', async ({ page }) => {
    await page.goto('/onboarding/step-2')

    await expect(page.getByText('Home Chores')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Car Maintenance')).toBeVisible()
    await expect(page.getByText('Insurance')).toBeVisible()
    await expect(page.getByText('Electronics')).toBeVisible()
    await expect(page.getByText('Kids Activities')).toBeVisible()
  })

  test('Back button on step-2 returns to step-1', async ({ page }) => {
    await page.goto('/onboarding/step-2')
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/onboarding\/step-1/, { timeout: 5000 })
  })
})

test.describe('Dashboard redirect behaviour', () => {
  test('unauthenticated user visiting /dashboard is redirected to login', async ({ page }) => {
    await page.goto('/dashboard')
    // Middleware redirects unauthenticated users to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
  })

  test.skip(!hasSupabase, 'Requires authenticated session to test onboarding redirect')

  test('authenticated user with no household visiting /dashboard is redirected to /onboarding', async ({ page }) => {
    // This test requires a real session for a user who has no household.
    // Covered by manual QA + future test helpers that inject auth cookies.
    test.skip(true, 'Requires auth session injection — see tests/helpers/factories.ts')
  })
})
