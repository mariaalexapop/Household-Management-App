'use server'

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Check whether an email address is registered in auth.users.
 * Uses Drizzle (direct DB connection, bypasses RLS) so the result is
 * authoritative. Called after a failed login to give a specific error.
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT id FROM auth.users WHERE email = ${email} LIMIT 1`
  )
  return result.length > 0
}
