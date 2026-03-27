import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env.local' })

const dbUrl = process.env.DATABASE_URL!
// Supabase direct connections require SSL
const url = dbUrl.includes('sslmode') ? dbUrl : `${dbUrl}?sslmode=require`

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
})
