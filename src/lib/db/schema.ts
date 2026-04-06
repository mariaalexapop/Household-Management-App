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
