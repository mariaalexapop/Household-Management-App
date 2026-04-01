import { Inngest } from 'inngest'

/**
 * Shared Inngest client for Kinship.
 * All event-driven background jobs reference this client instance.
 */
export const inngest = new Inngest({ id: 'household-app' })
