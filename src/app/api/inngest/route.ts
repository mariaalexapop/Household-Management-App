import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { sendInviteEmail } from '@/lib/inngest/functions/send-invite-email'

/**
 * Inngest serve handler.
 * Exposes GET (introspection), POST (event delivery), PUT (sync) endpoints
 * required by the Inngest SDK.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendInviteEmail],
})
