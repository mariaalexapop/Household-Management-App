/**
 * RLS isolation tests for Phase 1 tables.
 *
 * These are integration tests that connect to the real Supabase test project.
 * They verify cross-household data is blocked by Row Level Security policies.
 *
 * Tests are skipped if the required env vars are not set (CI safety).
 */
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAdminClient } from '../../../src/lib/supabase/admin'
import { makeTestHousehold, makeTestUser } from '../../helpers/factories'
import { assertRlsBlocks } from '../../helpers/supabase-rls'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const skip = !supabaseUrl || !serviceRoleKey

describe.skipIf(skip)('RLS isolation', () => {
  // Initialized lazily in beforeAll so env vars are loaded first
  let admin: ReturnType<typeof createAdminClient>

  // Household A — userA is admin
  let householdAId: string
  let userAId: string
  let userAClient: ReturnType<typeof createClient>

  // Household B — userB is admin
  let householdBId: string
  let userBId: string

  beforeAll(async () => {
    admin = createAdminClient()
    const userAData = makeTestUser()
    const userBData = makeTestUser()
    const householdAData = makeTestHousehold()
    const householdBData = makeTestHousehold()

    // Create users via admin
    const { data: createdUserA, error: errA } =
      await admin.auth.admin.createUser({
        email: userAData.email,
        password: userAData.password,
        email_confirm: true,
      })
    if (errA) throw new Error(`Failed to create userA: ${errA.message}`)
    userAId = createdUserA.user.id

    const { data: createdUserB, error: errB } =
      await admin.auth.admin.createUser({
        email: userBData.email,
        password: userBData.password,
        email_confirm: true,
      })
    if (errB) throw new Error(`Failed to create userB: ${errB.message}`)
    userBId = createdUserB.user.id

    // Create households via admin (bypasses RLS)
    const { data: hA, error: hAErr } = await admin
      .from('households')
      .insert({ name: householdAData.name })
      .select('id')
      .single()
    if (hAErr) throw new Error(`Failed to create household A: ${hAErr.message}`)
    householdAId = hA.id

    const { data: hB, error: hBErr } = await admin
      .from('households')
      .insert({ name: householdBData.name })
      .select('id')
      .single()
    if (hBErr) throw new Error(`Failed to create household B: ${hBErr.message}`)
    householdBId = hB.id

    // Add userA as admin of household A
    const { error: mAErr } = await admin.from('household_members').insert({
      household_id: householdAId,
      user_id: userAId,
      role: 'admin',
      display_name: 'User A',
    })
    if (mAErr) throw new Error(`Failed to add userA to household A: ${mAErr.message}`)

    // Add userB as admin of household B
    const { error: mBErr } = await admin.from('household_members').insert({
      household_id: householdBId,
      user_id: userBId,
      role: 'admin',
      display_name: 'User B',
    })
    if (mBErr) throw new Error(`Failed to add userB to household B: ${mBErr.message}`)

    // Add settings for household B (so there's data to try to read)
    const { error: sErr } = await admin.from('household_settings').insert({
      household_id: householdBId,
      household_type: 'couple',
      active_modules: [],
    })
    if (sErr) throw new Error(`Failed to add settings for household B: ${sErr.message}`)

    // Authenticate userA with a real session
    userAClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)
    const { error: signInErr } = await userAClient.auth.signInWithPassword({
      email: userAData.email,
      password: userAData.password,
    })
    if (signInErr) throw new Error(`Failed to sign in userA: ${signInErr.message}`)
  })

  afterAll(async () => {
    // Clean up users (cascades to household_members via auth.users FK)
    if (userAId) await admin.auth.admin.deleteUser(userAId)
    if (userBId) await admin.auth.admin.deleteUser(userBId)
    // Clean up households
    if (householdAId) await admin.from('households').delete().eq('id', householdAId)
    if (householdBId) await admin.from('households').delete().eq('id', householdBId)
  })

  it('household_members: user A cannot read household B members', async () => {
    await assertRlsBlocks('household_members', householdBId, userAClient)
  })

  it('household_settings: user A cannot read household B settings', async () => {
    await assertRlsBlocks('household_settings', householdBId, userAClient)
  })

  it('household_members: non-admin cannot DELETE from their own household', async () => {
    // Add userA as a plain member (non-admin) in a new household C
    const { data: hC } = await admin
      .from('households')
      .insert({ name: 'Household C' })
      .select('id')
      .single()

    const { data: memberC } = await admin
      .from('household_members')
      .insert({
        household_id: hC!.id,
        user_id: userAId,
        role: 'member',
        display_name: 'User A as member',
      })
      .select('id')
      .single()

    // userA (non-admin in household C) tries to delete their own member row
    const { error } = await userAClient
      .from('household_members')
      .delete()
      .eq('id', memberC!.id)

    // RLS should block this — either an error or the row was not deleted
    if (!error) {
      // Verify the row still exists via admin
      const { data: stillExists } = await admin
        .from('household_members')
        .select('id')
        .eq('id', memberC!.id)
      expect(stillExists).toHaveLength(1)
    }

    // Cleanup household C
    await admin.from('households').delete().eq('id', hC!.id)
  })
})
