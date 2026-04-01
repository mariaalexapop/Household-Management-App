/**
 * Drizzle ORM client for Kinship.
 *
 * Uses a global singleton in development to survive Next.js hot reloads
 * without exhausting the Supabase connection pool.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// In development, reuse the client across hot reloads to avoid exhausting
// the connection pool. In production each instance gets its own client.
const globalForDb = globalThis as unknown as { _pgClient?: postgres.Sql }

const client =
  globalForDb._pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: 1, // single connection in dev; pooler handles concurrency in prod
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb._pgClient = client
}

export const db = drizzle(client, { schema })
