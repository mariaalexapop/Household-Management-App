/**
 * Drizzle ORM client for Kinship.
 *
 * Uses the `postgres` (node-postgres compatible) driver with the Supabase
 * direct connection URL (not the PgBouncer pooler URL — Drizzle prepared
 * statements are not compatible with transaction-mode pooling).
 *
 * { prepare: false } disables prepared statements, which is required when
 * connecting through Supabase's connection pooler in session mode.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Disable prefetch as it is not supported for "Transaction" pool mode.
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
