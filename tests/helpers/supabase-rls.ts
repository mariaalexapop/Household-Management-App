/**
 * RLS isolation test helper.
 *
 * Pass a Supabase client authenticated as User A, and a household_id belonging
 * to User B. Asserts User A cannot read User B's household data.
 *
 * Usage:
 *   await assertRlsBlocks('household_members', householdBId, userAClient)
 *
 * The assertion passes if:
 *   - The query returns an empty array (RLS filtered all rows), or
 *   - The query throws a permission error (RLS rejected the query entirely)
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { expect } from 'vitest'

export async function assertRlsBlocks(
  tableName: string,
  householdIdToBlock: string,
  userClient: SupabaseClient
): Promise<void> {
  const { data, error } = await userClient
    .from(tableName)
    .select('*')
    .eq('household_id', householdIdToBlock)

  if (error) {
    // RLS threw an error — access was denied, which counts as blocked
    return
  }

  expect(data).toHaveLength(0)
}
