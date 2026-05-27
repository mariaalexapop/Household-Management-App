/**
 * Suggestion template mapping — deadline types to action-oriented task titles.
 *
 * Each template receives a context object with entity-specific fields and
 * returns a { title, notes } pair used to populate the suggestions table.
 */

export interface TemplateContext {
  // Car
  make?: string
  model?: string
  // Insurance
  insurer?: string
  type?: string
  // Electronics
  name?: string
  // Common — formatted deadline date
  date: string
}

export type TemplateKey =
  | 'car.motDueDate'
  | 'car.taxDueDate'
  | 'car.nextServiceDate'
  | 'insurance.expiryDate'
  | 'insurance.nextPaymentDate'
  | 'electronics.warrantyExpiryDate'

export const TEMPLATES: Record<
  TemplateKey,
  (ctx: TemplateContext) => { title: string; notes: string }
> = {
  'car.motDueDate': (ctx) => ({
    title: `Book MOT for ${ctx.make ?? ''} ${ctx.model ?? ''}`.trim(),
    notes: `MOT is due on ${ctx.date}. Book an appointment with a local testing centre.`,
  }),

  'car.taxDueDate': (ctx) => ({
    title: `Renew road tax for ${ctx.make ?? ''} ${ctx.model ?? ''}`.trim(),
    notes: `Road tax is due on ${ctx.date}. Renew online or at a post office.`,
  }),

  'car.nextServiceDate': (ctx) => ({
    title: `Book service for ${ctx.make ?? ''} ${ctx.model ?? ''}`.trim(),
    notes: `Service is due on ${ctx.date}. Schedule with your preferred garage.`,
  }),

  'insurance.expiryDate': (ctx) => ({
    title: `Renew ${ctx.insurer ?? ''} ${ctx.type ?? ''} policy`.trim(),
    notes: `Your ${ctx.type ?? 'insurance'} policy with ${ctx.insurer ?? 'your insurer'} expires on ${ctx.date}. Review and renew before it lapses.`,
  }),

  'insurance.nextPaymentDate': (ctx) => ({
    title: `Pay ${ctx.insurer ?? ''} ${ctx.type ?? ''} premium`.trim(),
    notes: `Premium payment for your ${ctx.type ?? 'insurance'} policy with ${ctx.insurer ?? 'your insurer'} is due on ${ctx.date}.`,
  }),

  'electronics.warrantyExpiryDate': (ctx) => ({
    title: `Check warranty options for ${ctx.name ?? 'device'}`,
    notes: `Warranty for ${ctx.name ?? 'your device'} expires on ${ctx.date}. Consider extended warranty or replacement options.`,
  }),
}
