import { createClient } from '@supabase/supabase-js'

/**
 * Service-role admin client — NEVER expose to the browser.
 * Only use in API Route Handlers, Server Actions, and Inngest jobs.
 * Has full database access, bypasses RLS.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
