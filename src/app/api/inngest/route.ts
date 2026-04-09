import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { sendInviteEmail } from '@/lib/inngest/functions/send-invite-email'
import { generateRecurrence } from '@/lib/inngest/functions/generate-recurrence'
import { sendTaskAssignedEmail } from '@/lib/inngest/functions/send-task-assigned-email'
import { sendTaskReminder } from '@/lib/inngest/functions/send-task-reminder'
import { generateActivityRecurrence } from '@/lib/inngest/functions/generate-activity-recurrence'
import { sendActivityReminder } from '@/lib/inngest/functions/send-activity-reminder'
import { sendCarReminder } from '@/lib/inngest/functions/send-car-reminder'
import { sendWarrantyReminder } from '@/lib/inngest/functions/send-warranty-reminder'
import { sendInsuranceExpiryReminder, sendInsurancePaymentReminder } from '@/lib/inngest/functions/send-insurance-reminder'

/**
 * Inngest serve handler.
 * Exposes GET (introspection), POST (event delivery), PUT (sync) endpoints
 * required by the Inngest SDK.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendInviteEmail, generateRecurrence, sendTaskAssignedEmail, sendTaskReminder, generateActivityRecurrence, sendActivityReminder, sendCarReminder, sendWarrantyReminder, sendInsuranceExpiryReminder, sendInsurancePaymentReminder],
})
