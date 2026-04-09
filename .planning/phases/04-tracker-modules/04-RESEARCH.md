# Phase 4: Tracker Modules - Research

**Researched:** 2026-04-09
**Domain:** Drizzle schema design, Supabase Storage uploads, Inngest reminder functions, calendar extension, costs dashboard
**Confidence:** HIGH

## Summary

Phase 4 adds three new household tracking modules (Cars, Insurance, Electronics) plus a Costs dashboard, integrating all new events into the existing Phase 3 unified calendar. The core technical challenges are: (1) designing 5-6 new database tables with Drizzle ORM following established project patterns, (2) implementing PDF file uploads via Supabase Storage with a signed-URL pattern to bypass Next.js server action body size limits, (3) creating Inngest reminder functions for MOT/tax/service/insurance-expiry/warranty dates, and (4) extending the calendar page's parallel data fetching to include new event sources.

The existing codebase provides strong precedent for every pattern needed. The `kids.ts` server actions, `send-activity-reminder.ts` Inngest function, and `/calendar/page.tsx` data layer are all directly reusable templates. The primary new element is Supabase Storage integration for PDF document uploads, which has a well-documented signed-URL approach.

**Primary recommendation:** Follow existing project patterns exactly (schema + RLS in `schema.ts`, server actions with Zod validation in `src/app/actions/`, Inngest 2-arg `createFunction` for reminders), and use Supabase Storage signed upload URLs for PDFs to avoid the Next.js 1MB server action body limit.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Separate routes per module: `/cars`, `/insurance`, `/electronics`, `/costs`
- Dedicated `/costs` route aggregating all costs with section and period breakdown
- Document uploads via Supabase Storage -- drag-and-drop zone, PDFs stored per household, linked to item
- Modules gated by household's `activeModules` setting -- reuse existing onboarding pattern, add `cars`, `insurance`, `electronics` as module keys
- Car fields: make, model, year, plate, colour (per CAR-01 -- no extras for MVP)
- Service history: timeline list per car, newest first, each entry as a card with date, type, mileage, garage, cost
- 3 key date reminder types: MOT/inspection, road tax, next service -- each with configurable days-before reminder
- Module accent colour: orange `#ea580c` (already defined in MODULE_COLOURS)
- Insurance policy types: home, car, health, life, travel, other (per INS-01)
- Premium payment schedules: annual, quarterly, monthly -- with next-payment-date field and auto-reminder
- Electronics warranty: expiry date + coverage summary text -- auto 30-day reminder (per ELEC-03)
- Max file upload size: 10MB per PDF
- Costs breakdown: by section (cars/insurance/electronics) + by month, filterable by year
- Visualization: simple table with totals -- no charting library for MVP
- Calendar integration: extend existing `/calendar` page query with car key dates, insurance expiry/payments, electronics warranty expiry as CalendarEvent[]
- Dashboard cards: add CarDashboardCard, InsuranceDashboardCard, ElectronicsDashboardCard to DashboardGrid (same pattern as ChoresDashboardCard)

### Claude's Discretion
- Database schema design (table structure, column types, indexes)
- Form layouts and field ordering within each module
- Inngest function design for reminders
- Supabase Storage bucket naming and path conventions

### Deferred Ideas (OUT OF SCOPE)
- INS-07, INS-08, INS-09 (chatbot integration with insurance docs) -- Phase 5
- ELEC-05 (chatbot integration with electronics manuals) -- Phase 5
- ELEC-V2-01 (auto-retrieve manual by model number) -- v2
- Advanced cost analytics (charts, trends, forecasting) -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAR-01 | User can add multiple cars per household (make, model, year, plate, colour) | Schema design for `cars` table; Server Action pattern from kids.ts |
| CAR-02 | User can log a service record per car (date, type, mileage, garage, cost) | Schema design for `service_records` table; cost as integer (cents) |
| CAR-03 | User can set key date reminders per car: MOT, tax, service | `car_reminders` table with reminder_type enum; Inngest delayed step |
| CAR-04 | User receives reminder X days before a key date (configurable) | Inngest function following send-activity-reminder pattern |
| CAR-05 | User can edit and delete cars and service records | Server Actions with Zod validation, cascade delete |
| CAR-06 | User can view full service history per car | Query pattern: filter by carId, order by date desc |
| INS-01 | User can add a policy with type, insurer, policy number, expiry date, renewal contact | Schema design for `insurance_policies` table |
| INS-02 | User can upload policy documents (PDF) | Supabase Storage signed-URL upload pattern; `documents` table |
| INS-03 | User can log premium costs with payment schedule and next payment date | Payment schedule fields on insurance_policies; cost in cents |
| INS-04 | User receives reminder X days before policy expires (configurable) | Inngest function for insurance expiry reminder |
| INS-05 | User receives reminder before premium payment is due | Inngest function for payment due reminder |
| INS-06 | User can edit and delete policies | Server Actions with cascade delete of documents |
| ELEC-01 | User can add item to electronics registry (name, brand, model, purchase date, cost) | Schema design for `electronics` table |
| ELEC-02 | User can upload warranty document with expiry date and coverage summary | Supabase Storage + `documents` table link |
| ELEC-03 | User receives reminder 30 days before warranty expires | Inngest function, fixed 30-day offset |
| ELEC-04 | User can upload a user manual (PDF) for any item | Supabase Storage upload, document type = 'manual' |
| ELEC-06 | User can edit and delete items and associated documents | Server Action with Storage cleanup |
| COST-01 | Cost is optional field on car service records, insurance premiums, electronics items | Integer (cents) column on relevant tables |
| COST-02 | User can view basic costs dashboard aggregating all costs | Parallel queries aggregating by section |
| COST-03 | Costs dashboard shows breakdown by section and month/year | SQL date_trunc grouping, year filter |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 | Schema definitions + queries | Already used for all tables |
| drizzle-kit | 0.31.10 | Migration generation | Project standard |
| @supabase/supabase-js | 2.100.1 | Supabase Storage client | Already installed, provides `.storage.from()` API |
| @supabase/ssr | 0.9.0 | Server-side Supabase client | Already used for auth |
| inngest | 4.1.0 | Background reminder jobs | Already used for task/activity reminders |
| zod | 4.3.6 | Server Action input validation | Already used in all actions |
| date-fns | 4.1.0 | Date manipulation | Already used throughout |
| react-hook-form | 7.72.0 | Form state management | Already used for activity/chore forms |
| @hookform/resolvers | 5.2.2 | Zod integration with react-hook-form | Already installed |
| lucide-react | 1.7.0 | Icons | Already used throughout |
| sonner | 2.0.7 | Toast notifications | Already used |

### No New Dependencies Required

All Phase 4 functionality can be built with the existing dependency set. Supabase Storage is part of `@supabase/supabase-js` (already installed). No charting library needed (table-only costs view per user decision). File drag-and-drop uses native HTML5 drag events (no library needed for MVP).

## Architecture Patterns

### Recommended Project Structure (new files)

```
src/
  lib/db/
    schema.ts              # ADD: cars, serviceRecords, insurancePolicies, electronics, documents tables
  app/actions/
    cars.ts                # NEW: createCar, updateCar, deleteCar, createServiceRecord, etc.
    insurance.ts           # NEW: createPolicy, updatePolicy, deletePolicy
    electronics.ts         # NEW: createItem, updateItem, deleteItem
    documents.ts           # NEW: getUploadUrl, deleteDocument, getDownloadUrl
    costs.ts               # NEW: getCostsBySection (read-only queries)
  app/(app)/
    cars/
      page.tsx             # Server Component: fetch cars + service records
      CarsClient.tsx       # Client Component: car list, forms, service timeline
    insurance/
      page.tsx
      InsuranceClient.tsx
    electronics/
      page.tsx
      ElectronicsClient.tsx
    costs/
      page.tsx             # Server Component: aggregate cost queries
      CostsClient.tsx      # Client Component: table with filters
    calendar/
      page.tsx             # MODIFY: add car/insurance/electronics queries
  components/
    tracker/
      FileUploadZone.tsx   # Shared drag-and-drop PDF upload component
      DocumentList.tsx     # Shared document list with download/delete
      ReminderConfig.tsx   # Shared reminder days-before picker
    dashboard/
      CarDashboardCard.tsx
      InsuranceDashboardCard.tsx
      ElectronicsDashboardCard.tsx
      DashboardGrid.tsx    # MODIFY: add new module cards
  lib/inngest/functions/
    send-car-reminder.ts
    send-insurance-reminder.ts
    send-warranty-reminder.ts
```

### Pattern 1: Schema with Inline RLS (established project pattern)

**What:** Every table defined in `schema.ts` includes `pgPolicy()` co-located in the table definition.
**When to use:** Every new table.

```typescript
// Follows exact pattern from children, kidActivities, tasks tables
export const cars = pgTable(
  'cars',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    plate: text('plate').notNull(),
    colour: text('colour'),
    // Key dates for reminders
    motDueDate: timestamp('mot_due_date', { withTimezone: true }),
    taxDueDate: timestamp('tax_due_date', { withTimezone: true }),
    nextServiceDate: timestamp('next_service_date', { withTimezone: true }),
    // Configurable reminder offsets (days before)
    motReminderDays: integer('mot_reminder_days').default(30),
    taxReminderDays: integer('tax_reminder_days').default(30),
    serviceReminderDays: integer('service_reminder_days').default(14),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('cars_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
  ]
)
```

### Pattern 2: Server Actions with Zod + Auth (established pattern)

**What:** Every mutation is a `'use server'` function that validates auth, resolves householdId, validates input with Zod, performs the DB operation, and revalidates paths.
**When to use:** All CRUD operations.

```typescript
// Follows kids.ts pattern exactly
export async function createCar(data: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const memberRow = await getMemberRow(user.id)
  if (!memberRow) return { success: false, error: 'No household found' }

  const parsed = createCarSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const [newCar] = await db.insert(cars).values({
    householdId: memberRow.householdId,
    ...parsed.data,
    createdBy: user.id,
  }).returning({ id: cars.id })

  // Fire Inngest reminders for any set key dates
  // ...

  revalidatePath('/cars')
  revalidatePath('/calendar')
  return { success: true, data: { id: newCar.id } }
}
```

### Pattern 3: Supabase Storage Signed-URL Upload

**What:** Server action creates a signed upload URL; client uploads directly to Supabase Storage, bypassing the Next.js 1MB server action body limit.
**When to use:** All PDF document uploads (insurance policies, warranty docs, user manuals).

```typescript
// Server Action: documents.ts
'use server'
export async function getUploadUrl(data: unknown): Promise<ActionResult<{ signedUrl: string; token: string; path: string }>> {
  // Validate auth + household membership
  // ...
  const parsed = uploadRequestSchema.safeParse(data)
  // ...

  // Path convention: {householdId}/{module}/{entityId}/{filename}
  const storagePath = `${memberRow.householdId}/${parsed.data.module}/${parsed.data.entityId}/${parsed.data.fileName}`

  const supabase = await createClient()
  const { data: uploadData, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(storagePath)

  if (error) return { success: false, error: error.message }

  return {
    success: true,
    data: {
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: storagePath,
    },
  }
}

// Server Action: get a signed download URL
export async function getDownloadUrl(data: unknown): Promise<ActionResult<{ url: string }>> {
  // Validate auth + household
  // ...
  const supabase = await createClient()
  const { data: urlData, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(parsed.data.path, 3600) // 1 hour expiry

  if (error) return { success: false, error: error.message }
  return { success: true, data: { url: urlData.signedUrl } }
}
```

```typescript
// Client-side upload using the signed URL
async function uploadFile(file: File, signedUrl: string, token: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .uploadToSignedUrl(storagePath, token, file, {
      contentType: 'application/pdf',
      upsert: false,
    })
  return { data, error }
}
```

### Pattern 4: Inngest Reminder with sleepUntil (established pattern)

**What:** Inngest function receives event with date + offset, sleeps until reminder time, inserts notification + sends email.
**When to use:** All key date reminders (car MOT/tax/service, insurance expiry/payment, warranty expiry).

```typescript
// Exact same pattern as send-task-reminder.ts and send-activity-reminder.ts
export const sendCarReminder = inngest.createFunction(
  {
    id: 'send-car-reminder',
    name: 'Send Car Key Date Reminder',
    triggers: [{ event: 'car/reminder.scheduled' }],
  },
  async ({ event, step }) => {
    const { carId, householdId, reminderType, dueDate, reminderDays, createdBy } = event.data

    const remindAt = new Date(new Date(dueDate).getTime() - reminderDays * 24 * 60 * 60 * 1000)
    await step.sleepUntil('wait-for-reminder-time', remindAt)

    // Insert notification + send email (same pattern as existing)
  }
)
```

### Pattern 5: Calendar Extension (established extension point)

**What:** Add parallel queries to `/calendar/page.tsx` and map results to `CalendarEvent[]` using existing type.
**When to use:** Integrating car/insurance/electronics events into calendar.

```typescript
// In /calendar/page.tsx, extend the Promise.all:
const [choreRows, activityRows, childRows, carRows, insuranceRows, electronicsRows] = await Promise.all([
  // ... existing chore + kids queries ...

  // Car key dates: MOT, tax, service due dates
  db.select({ id: cars.id, make: cars.make, model: cars.model, motDueDate: cars.motDueDate, taxDueDate: cars.taxDueDate, nextServiceDate: cars.nextServiceDate })
    .from(cars)
    .where(eq(cars.householdId, householdId)),

  // Insurance: expiry dates + next payment dates
  db.select({ id: insurancePolicies.id, insurer: insurancePolicies.insurer, policyType: insurancePolicies.policyType, expiryDate: insurancePolicies.expiryDate, nextPaymentDate: insurancePolicies.nextPaymentDate })
    .from(insurancePolicies)
    .where(eq(insurancePolicies.householdId, householdId)),

  // Electronics: warranty expiry dates
  db.select({ id: electronics.id, name: electronics.name, warrantyExpiryDate: electronics.warrantyExpiryDate })
    .from(electronics)
    .where(eq(electronics.householdId, householdId)),
])

// Map car dates to CalendarEvent[]
const carEvents: CalendarEvent[] = carRows.flatMap((car) => {
  const events: CalendarEvent[] = []
  if (car.motDueDate) events.push({
    id: `${car.id}-mot`, title: `MOT: ${car.make} ${car.model}`,
    startsAt: car.motDueDate, module: 'car', href: '/cars',
    colour: MODULE_COLOURS.car, label: toCalendarLabel(`MOT: ${car.make} ${car.model}`),
  })
  // ... similar for tax, service
  return events
})
```

### Anti-Patterns to Avoid
- **Passing File in Server Action body:** Next.js server actions have a 1MB body limit. Always use signed URLs for file uploads.
- **Using `numeric` for money columns:** Returns strings in JavaScript, requiring constant parsing. Use `integer` to store cents (pennies) and format for display.
- **Separate reminder tables:** Don't create a separate `reminders` table -- store reminder config (offset days + due date) on the entity itself (car, policy) and fire Inngest events on create/update.
- **Custom file upload middleware:** Don't build custom upload handling -- Supabase Storage handles everything including CDN, access control, and signed URLs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF file storage | Custom file server or S3 integration | Supabase Storage (already in stack) | Built-in CDN, signed URLs, RLS-compatible, 5GB per file limit |
| File upload progress | Custom XHR progress tracking | Supabase Storage standard upload | Under 10MB, progress not essential; standard upload is simpler |
| Delayed reminders | cron + polling | Inngest `step.sleepUntil()` | Already proven pattern in project; handles retries, exactly-once |
| Notification delivery | Custom queue system | Inngest + notifications table + Resend | Already established in Phase 2/3 |
| Date formatting | Manual date math | `date-fns` (already installed) | Handles timezones, formatting, relative dates |
| Form validation | Manual validation | Zod schemas + `@hookform/resolvers` | Already established pattern |
| Drag-and-drop | `react-dropzone` or similar library | Native HTML5 drag events + `<input type="file">` | No new dep needed for single-file PDF upload; keep it simple |

**Key insight:** Phase 4 introduces no genuinely new technical patterns. Every capability (CRUD, reminders, calendar events, dashboard cards) has a direct precedent in Phases 2-3. The only new integration is Supabase Storage, which is part of the already-installed SDK.

## Common Pitfalls

### Pitfall 1: Next.js Server Action Body Size Limit
**What goes wrong:** Passing `FormData` with a PDF file through a server action fails silently or returns a 413 error for files over 1MB.
**Why it happens:** Next.js limits server action request bodies to 1MB by default.
**How to avoid:** Use the signed-URL pattern: server action creates a signed upload URL, client uploads directly to Supabase Storage.
**Warning signs:** File uploads work in dev (small test files) but fail in production with larger PDFs.

### Pitfall 2: Supabase Storage Bucket Must Exist Before Upload
**What goes wrong:** `upload()` or `createSignedUploadUrl()` returns "Bucket not found" error.
**Why it happens:** Supabase Storage buckets must be created via dashboard or SQL migration before use.
**How to avoid:** Create the `documents` bucket in a migration or via Supabase dashboard as part of Wave 0 setup. Set it as private (default) with 10MB file size limit and `application/pdf` MIME type restriction.
**Warning signs:** 404 errors on first upload attempt.

### Pitfall 3: Orphaned Storage Files on Entity Delete
**What goes wrong:** Deleting a car/policy/electronics item leaves orphaned PDFs in storage, wasting space.
**Why it happens:** Database cascade delete removes the `documents` row but not the actual file in Supabase Storage.
**How to avoid:** In the delete server action, first query all associated document paths, delete from Supabase Storage (`supabase.storage.from('documents').remove([paths])`), then delete the database row.
**Warning signs:** Storage usage grows even after items are deleted.

### Pitfall 4: Drizzle `numeric()` Returns Strings
**What goes wrong:** Cost fields defined as `numeric(10, 2)` return `"123.45"` (string) instead of `123.45` (number) from queries.
**Why it happens:** PostgreSQL numeric type maps to string in JavaScript to avoid floating-point precision loss.
**How to avoid:** Use `integer` columns to store costs in cents (pennies). `costCents: integer('cost_cents')`. Format for display with `(cents / 100).toFixed(2)`. This matches the project's existing `integer` usage for `reminderOffsetMinutes`.
**Warning signs:** TypeScript errors when trying to do arithmetic on cost values.

### Pitfall 5: Calendar Window Filtering for Non-Recurring Events
**What goes wrong:** Car MOT dates, insurance expiry dates etc. are single-point dates (not recurring), so the existing `gte(startsAt, windowStart)` filter may exclude past-due items the user needs to see.
**Why it happens:** The existing calendar queries filter to a 3-month window. Key dates outside this window are invisible.
**How to avoid:** For tracker module dates, either: (a) don't apply window filtering (these tables are small -- a household has few cars/policies), or (b) filter more broadly (current year). The dataset is tiny compared to recurring chores/activities.
**Warning signs:** User sets a car MOT date 6 months out but doesn't see it on the calendar.

### Pitfall 6: Inngest Reminder Rescheduling on Update
**What goes wrong:** User updates a car's MOT date, but the old Inngest reminder still fires at the original time.
**Why it happens:** Inngest `step.sleepUntil()` is set when the function is first triggered. There's no built-in way to cancel a sleeping function.
**How to avoid:** When updating a key date, fire a new Inngest event. In the Inngest function, add a `step.run()` before notification that re-checks the current date from the database. If the date has changed since the event was fired, skip the notification.
**Warning signs:** User receives reminders for dates they've already updated.

## Code Examples

### Recommended Schema: `cars` table

```typescript
export const cars = pgTable(
  'cars',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    plate: text('plate').notNull(),
    colour: text('colour'),
    motDueDate: timestamp('mot_due_date', { withTimezone: true }),
    taxDueDate: timestamp('tax_due_date', { withTimezone: true }),
    nextServiceDate: timestamp('next_service_date', { withTimezone: true }),
    motReminderDays: integer('mot_reminder_days').default(30),
    taxReminderDays: integer('tax_reminder_days').default(30),
    serviceReminderDays: integer('service_reminder_days').default(14),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('cars_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
      withCheck: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
    }),
  ]
)
```

### Recommended Schema: `service_records` table

```typescript
export const serviceRecords = pgTable(
  'service_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    carId: uuid('car_id')
      .notNull()
      .references(() => cars.id, { onDelete: 'cascade' }),
    serviceDate: timestamp('service_date', { withTimezone: true }).notNull(),
    serviceType: text('service_type').notNull(), // 'full_service' | 'mot' | 'repair' | 'tyre' | 'other'
    mileage: integer('mileage'),
    garage: text('garage'),
    costCents: integer('cost_cents'), // nullable, stored in cents
    notes: text('notes'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('service_records_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
      withCheck: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
    }),
  ]
)
```

### Recommended Schema: `insurance_policies` table

```typescript
export const insurancePolicies = pgTable(
  'insurance_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    policyType: text('policy_type').notNull(), // 'home' | 'car' | 'health' | 'life' | 'travel' | 'other'
    insurer: text('insurer').notNull(),
    policyNumber: text('policy_number'),
    expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
    renewalContactName: text('renewal_contact_name'),
    renewalContactPhone: text('renewal_contact_phone'),
    renewalContactEmail: text('renewal_contact_email'),
    paymentSchedule: text('payment_schedule'), // 'annual' | 'quarterly' | 'monthly'
    premiumCents: integer('premium_cents'),     // cost per period in cents
    nextPaymentDate: timestamp('next_payment_date', { withTimezone: true }),
    expiryReminderDays: integer('expiry_reminder_days').default(30),
    paymentReminderDays: integer('payment_reminder_days').default(7),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('insurance_policies_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
      withCheck: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
    }),
  ]
)
```

### Recommended Schema: `electronics` table

```typescript
export const electronics = pgTable(
  'electronics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    brand: text('brand'),
    modelNumber: text('model_number'),
    purchaseDate: timestamp('purchase_date', { withTimezone: true }),
    costCents: integer('cost_cents'),             // optional purchase cost in cents
    warrantyExpiryDate: timestamp('warranty_expiry_date', { withTimezone: true }),
    coverageSummary: text('coverage_summary'),     // free-text warranty coverage
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('electronics_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
      withCheck: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
    }),
  ]
)
```

### Recommended Schema: `documents` table (shared across modules)

```typescript
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    // Polymorphic link: module + entityId point to the owning record
    module: text('module').notNull(),       // 'insurance' | 'electronics'
    entityId: uuid('entity_id').notNull(),  // FK to insurance_policies.id or electronics.id
    documentType: text('document_type').notNull(), // 'policy' | 'warranty' | 'manual'
    fileName: text('file_name').notNull(),
    storagePath: text('storage_path').notNull(), // path in Supabase Storage bucket
    fileSizeBytes: integer('file_size_bytes'),
    uploadedBy: uuid('uploaded_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('documents_all_member', {
      for: 'all',
      to: authenticatedRole,
      using: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
      withCheck: sql`household_id IN (SELECT household_id FROM household_members WHERE user_id = ${authUid})`,
    }),
  ]
)
```

### Supabase Storage Bucket Setup (SQL migration or dashboard)

```sql
-- Create private bucket for household documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10MB in bytes
  ARRAY['application/pdf']
);

-- RLS policy: household members can manage their own household's files
CREATE POLICY "household_members_manage_docs" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text FROM household_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text FROM household_members WHERE user_id = auth.uid()
    )
  );
```

### Cost Formatting Utility

```typescript
// src/lib/format.ts
export function formatCostFromCents(cents: number | null | undefined): string {
  if (cents == null) return '--'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(cents / 100)
}

export function centsToPounds(cents: number): number {
  return cents / 100
}
```

### Costs Dashboard Aggregation Query

```typescript
// In costs page.tsx Server Component
const [carCosts, insuranceCosts, electronicsCosts] = await Promise.all([
  db.select({
    month: sql<string>`to_char(${serviceRecords.serviceDate}, 'YYYY-MM')`,
    totalCents: sql<number>`COALESCE(SUM(${serviceRecords.costCents}), 0)`,
  })
    .from(serviceRecords)
    .where(and(
      eq(serviceRecords.householdId, householdId),
      gte(serviceRecords.serviceDate, yearStart),
    ))
    .groupBy(sql`to_char(${serviceRecords.serviceDate}, 'YYYY-MM')`),

  db.select({
    month: sql<string>`to_char(${insurancePolicies.nextPaymentDate}, 'YYYY-MM')`,
    totalCents: sql<number>`COALESCE(SUM(${insurancePolicies.premiumCents}), 0)`,
  })
    .from(insurancePolicies)
    .where(and(
      eq(insurancePolicies.householdId, householdId),
      gte(insurancePolicies.nextPaymentDate, yearStart),
    ))
    .groupBy(sql`to_char(${insurancePolicies.nextPaymentDate}, 'YYYY-MM')`),

  db.select({
    totalCents: sql<number>`COALESCE(SUM(${electronics.costCents}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(electronics)
    .where(and(
      eq(electronics.householdId, householdId),
      gte(electronics.purchaseDate, yearStart),
    )),
])
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `FormData` file upload through Server Action | Signed-URL direct upload to Supabase Storage | Established pattern since Next.js 14 | Avoids 1MB body limit; better UX for large files |
| `numeric(10,2)` for money | `integer` storing cents | Long-standing best practice | Avoids string return type from Drizzle; clean arithmetic |
| Separate reminder scheduling service | Inngest `step.sleepUntil()` | Inngest v4 (already in use) | Durable, retry-safe, no infrastructure to manage |
| `pgEnum` for constrained strings | `text` with Zod validation | Project decision from Phase 1 | More flexible; avoids migration pain when adding values |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + Playwright 1.58.2 |
| Config file | vitest.config.ts (exists), playwright.config.ts (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAR-01 | Create car with required fields | unit | `npx vitest run tests/actions/cars.test.ts -t "createCar"` | No -- Wave 0 |
| CAR-02 | Log service record with cost | unit | `npx vitest run tests/actions/cars.test.ts -t "createServiceRecord"` | No -- Wave 0 |
| CAR-05 | Edit/delete car cascades service records | unit | `npx vitest run tests/actions/cars.test.ts -t "deleteCar"` | No -- Wave 0 |
| INS-01 | Create policy with all fields | unit | `npx vitest run tests/actions/insurance.test.ts -t "createPolicy"` | No -- Wave 0 |
| INS-02 | Upload PDF document | integration | `npx vitest run tests/actions/documents.test.ts -t "getUploadUrl"` | No -- Wave 0 |
| INS-06 | Delete policy removes documents | unit | `npx vitest run tests/actions/insurance.test.ts -t "deletePolicy"` | No -- Wave 0 |
| ELEC-01 | Create electronics item | unit | `npx vitest run tests/actions/electronics.test.ts -t "createItem"` | No -- Wave 0 |
| ELEC-02 | Upload warranty document | integration | `npx vitest run tests/actions/documents.test.ts -t "warranty upload"` | No -- Wave 0 |
| COST-02 | Costs aggregation query | unit | `npx vitest run tests/actions/costs.test.ts -t "getCostsBySection"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/actions/cars.test.ts` -- covers CAR-01, CAR-02, CAR-05, CAR-06
- [ ] `tests/actions/insurance.test.ts` -- covers INS-01, INS-03, INS-06
- [ ] `tests/actions/electronics.test.ts` -- covers ELEC-01, ELEC-02, ELEC-06
- [ ] `tests/actions/documents.test.ts` -- covers INS-02, ELEC-02, ELEC-04
- [ ] `tests/actions/costs.test.ts` -- covers COST-02, COST-03

## Open Questions

1. **Supabase Storage bucket creation method**
   - What we know: Buckets can be created via dashboard, SQL migration, or admin API
   - What's unclear: Whether the project prefers to create buckets via Drizzle migration SQL or Supabase dashboard setup
   - Recommendation: Create via SQL in the same migration that creates Phase 4 tables (keeps infrastructure as code)

2. **Insurance cost aggregation for costs dashboard**
   - What we know: Insurance has premiums with payment schedules (monthly/quarterly/annual)
   - What's unclear: Should costs dashboard show the per-period premium or annualized cost? Should it show actual payment dates or projected?
   - Recommendation: Show premiumCents as-is for each nextPaymentDate entry. For annual totals, multiply by schedule frequency (monthly x12, quarterly x4, annual x1).

3. **Inngest event naming convention for tracker modules**
   - What we know: Existing events use `chore/task.reminder.scheduled` and `kids/activity.reminder.scheduled`
   - What's unclear: Whether to use one generic `tracker/reminder.scheduled` or separate per-module events
   - Recommendation: Separate events per module (`car/reminder.scheduled`, `insurance/expiry.reminder.scheduled`, `insurance/payment.reminder.scheduled`, `electronics/warranty.reminder.scheduled`) for clarity and independent function management.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/db/schema.ts` -- established schema patterns with inline RLS
- Project codebase: `src/app/actions/kids.ts` -- established server action patterns
- Project codebase: `src/lib/inngest/functions/send-activity-reminder.ts` -- established Inngest patterns
- Project codebase: `src/lib/calendar/types.ts` -- CalendarEvent type with Phase 4 extension points
- Project codebase: `src/app/(app)/calendar/page.tsx` -- calendar data layer with parallel queries
- [Supabase Storage upload docs](https://supabase.com/docs/reference/javascript/storage-from-upload) -- upload API
- [Supabase Storage signed upload URL docs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) -- signed URL creation
- [Supabase Storage signed download URL docs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl) -- download URL API
- [Supabase Storage standard uploads guide](https://supabase.com/docs/guides/storage/uploads/standard-uploads) -- file size limits, content-type, upsert
- [Supabase Storage buckets fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- public vs private, RLS

### Secondary (MEDIUM confidence)
- [Supabase + Next.js signed URL pattern](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) -- community pattern for bypassing server action body limit
- [Drizzle ORM PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) -- numeric/integer column API
- [Drizzle numeric returns strings issue](https://github.com/drizzle-team/drizzle-orm/issues/1042) -- confirmed behavior for numeric columns

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies needed; all libraries already installed and proven in Phases 2-3
- Architecture: HIGH -- every pattern (schema, actions, Inngest, calendar) has direct precedent in codebase
- Supabase Storage: HIGH -- official docs confirm signed-URL pattern; well-documented API
- Pitfalls: HIGH -- derived from official docs (body size limit, bucket creation) and codebase analysis (numeric type, orphaned files)
- Schema design: MEDIUM -- recommended but under Claude's discretion; planner may adjust

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable stack, no fast-moving dependencies)
