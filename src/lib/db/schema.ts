/**
 * Kinship — Drizzle ORM schema with inline RLS policies.
 *
 * All five Phase 1 tables are defined here with pgPolicy() co-located in each
 * table definition.  drizzle-kit generate produces SQL that includes:
 *   ENABLE ROW LEVEL SECURITY and CREATE POLICY for every table.
 *
 * Cross-schema FK note:
 *   Drizzle cannot reference auth.users (a different Postgres schema) via its
 *   FK API.  user_id / invited_by / claimed_by / actor_id columns are plain
 *   uuid() columns with a comment noting the implied FK.  The actual
 *   FOREIGN KEY … REFERENCES auth.users(id) ON DELETE CASCADE constraints are
 *   added manually to the generated migration SQL (see 0000_phase1_tables.sql).
 */
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'

// ---------------------------------------------------------------------------
// households
// ---------------------------------------------------------------------------
export const households = pgTable(
  'households',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('households_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('households_insert_authenticated', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
  ]
)

// ---------------------------------------------------------------------------
// household_members
// ---------------------------------------------------------------------------
export const householdMembers = pgTable(
  'household_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    // References auth.users(id) — not a Drizzle FK (cross-schema).
    // ON DELETE CASCADE is added manually to the migration SQL.
    userId: uuid('user_id').notNull(),
    role: text('role').notNull().default('member'), // 'admin' | 'member'
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('household_members_household_id_user_id_unique').on(t.householdId, t.userId),
    pgPolicy('household_members_select_own_household', {
      for: 'select',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('household_members_insert_self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = ${authUid}`,
    }),
    pgPolicy('household_members_delete_admin_only', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = ${authUid} AND role = 'admin'
      )`,
    }),
  ]
)

// ---------------------------------------------------------------------------
// household_settings
// ---------------------------------------------------------------------------
export const householdSettings = pgTable(
  'household_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .unique()
      .references(() => households.id, { onDelete: 'cascade' }),
    // Valid values: 'couple' | 'family_with_kids' | 'flatmates' | 'single'
    // Validation enforced at application layer (Zod) — not pgEnum.
    householdType: text('household_type').notNull(),
    activeModules: text('active_modules')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('household_settings_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('household_settings_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('household_settings_update_member', {
      for: 'update',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
  ]
)

// ---------------------------------------------------------------------------
// household_invites
// ---------------------------------------------------------------------------
export const householdInvites = pgTable(
  'household_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    token: uuid('token').notNull().unique().defaultRandom(),
    email: text('email'), // nullable — shareable links don't require email
    // References auth.users(id) ON DELETE CASCADE — added manually to migration.
    invitedBy: uuid('invited_by').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Set atomically when invite is claimed (UPDATE WHERE claimed_at IS NULL).
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    // References auth.users(id) ON DELETE CASCADE — added manually to migration.
    claimedBy: uuid('claimed_by'),
  },
  () => [
    pgPolicy('household_invites_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('household_invites_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    // NOTE: No UPDATE policy — invite claiming is done via service-role admin
    // client to ensure atomic single-use enforcement
    // (UPDATE … WHERE claimed_at IS NULL RETURNING *).
  ]
)

// ---------------------------------------------------------------------------
// activity_feed
// ---------------------------------------------------------------------------
export const activityFeed = pgTable(
  'activity_feed',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    // References auth.users(id) — not a Drizzle FK (cross-schema).
    actorId: uuid('actor_id').notNull(),
    eventType: text('event_type').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'), // nullable
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('activity_feed_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('activity_feed_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
  ]
)

// ---------------------------------------------------------------------------
// chore_areas
// ---------------------------------------------------------------------------
export const choreAreas = pgTable(
  'chore_areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('chore_areas_all_member', {
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

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    notes: text('notes'),
    areaId: uuid('area_id').references(() => choreAreas.id, { onDelete: 'set null' }),
    // ownerId references household_members.id — plain uuid, FK in migration
    ownerId: uuid('owner_id'),
    status: text('status').notNull().default('todo'), // 'todo' | 'in_progress' | 'done'
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: jsonb('recurrence_rule'),
    // parentTaskId self-FK — plain uuid, FK added in migration
    parentTaskId: uuid('parent_task_id'),
    // createdBy references auth.users(id) — cross-schema, FK in migration
    createdBy: uuid('created_by').notNull(),
    // reminderOffsetMinutes: null = use household default (1440 = 1 day)
    reminderOffsetMinutes: integer('reminder_offset_minutes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('tasks_all_member', {
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

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    // userId references auth.users(id) — cross-schema, FK in migration
    userId: uuid('user_id').notNull(),
    type: text('type').notNull(), // 'task_assigned' | 'task_reminder'
    entityId: uuid('entity_id'),
    message: text('message').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('notifications_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
    }),
    pgPolicy('notifications_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`household_id IN (
        SELECT household_id FROM household_members WHERE user_id = ${authUid}
      )`,
    }),
    pgPolicy('notifications_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
    }),
  ]
)

// ---------------------------------------------------------------------------
// children
// ---------------------------------------------------------------------------
export const children = pgTable(
  'children',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('children_all_member', {
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

// ---------------------------------------------------------------------------
// kid_activities
// ---------------------------------------------------------------------------
export const kidActivities = pgTable(
  'kid_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    // 'school' | 'medical' | 'sport' | 'hobby' | 'social'
    category: text('category').notNull(),
    location: text('location'),
    // assigneeId references household_members.id — plain uuid, FK added in migration
    assigneeId: uuid('assignee_id'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    notes: text('notes'),
    // null = use default (1 day = 1440 minutes)
    reminderOffsetMinutes: integer('reminder_offset_minutes'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: jsonb('recurrence_rule'),
    // parentActivityId self-FK — plain uuid, FK added in migration
    parentActivityId: uuid('parent_activity_id'),
    // createdBy references auth.users(id) — cross-schema, FK added in migration
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('kid_activities_all_member', {
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

// ---------------------------------------------------------------------------
// cars
// ---------------------------------------------------------------------------
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
    // createdBy references auth.users(id) — cross-schema, FK added in migration
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

// ---------------------------------------------------------------------------
// service_records
// ---------------------------------------------------------------------------
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
    costCents: integer('cost_cents'), // COST-01: cost in cents
    notes: text('notes'),
    // createdBy references auth.users(id) — cross-schema, FK added in migration
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('service_records_all_member', {
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

// ---------------------------------------------------------------------------
// insurance_policies
// ---------------------------------------------------------------------------
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
    premiumCents: integer('premium_cents'), // COST-01: premium per period in cents
    nextPaymentDate: timestamp('next_payment_date', { withTimezone: true }),
    expiryReminderDays: integer('expiry_reminder_days').default(30),
    paymentReminderDays: integer('payment_reminder_days').default(7),
    // createdBy references auth.users(id) — cross-schema, FK added in migration
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('insurance_policies_all_member', {
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

// ---------------------------------------------------------------------------
// electronics
// ---------------------------------------------------------------------------
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
    costCents: integer('cost_cents'), // COST-01: purchase cost in cents
    warrantyExpiryDate: timestamp('warranty_expiry_date', { withTimezone: true }),
    coverageSummary: text('coverage_summary'), // free-text warranty coverage
    // createdBy references auth.users(id) — cross-schema, FK added in migration
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('electronics_all_member', {
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

// ---------------------------------------------------------------------------
// documents (shared polymorphic table for PDF uploads)
// ---------------------------------------------------------------------------
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    module: text('module').notNull(), // 'insurance' | 'electronics'
    entityId: uuid('entity_id').notNull(), // points to insurancePolicies.id or electronics.id
    documentType: text('document_type').notNull(), // 'policy' | 'warranty' | 'manual'
    fileName: text('file_name').notNull(),
    storagePath: text('storage_path').notNull(), // path in Supabase Storage 'documents' bucket
    fileSizeBytes: integer('file_size_bytes'),
    // uploadedBy references auth.users(id) — cross-schema, FK added in migration
    uploadedBy: uuid('uploaded_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    pgPolicy('documents_all_member', {
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
