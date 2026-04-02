/**
 * In-memory test factories for Kinship unit and integration tests.
 *
 * These factories generate unique test data using timestamp suffixes.
 * They do NOT create any database records — DB creation is the
 * responsibility of individual test setup blocks using the Supabase
 * admin client (see tests/helpers/supabase-rls.ts, created in 01-03).
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export interface TestHousehold {
  id: string;
  name: string;
}

/**
 * Generates a unique in-memory TestUser with a timestamped email.
 * Does NOT create the user in the database.
 *
 * @param overrides - Optional partial values to override generated defaults
 * @returns A TestUser object with unique email and password
 */
export function makeTestUser(overrides?: Partial<TestUser>): TestUser {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: `test-user-${suffix}`,
    email: `test-${suffix}@kinship-test.example`,
    password: `Test_Pass_${suffix}!`,
    ...overrides,
  };
}

/**
 * Generates a unique in-memory TestHousehold with a timestamped name.
 * Does NOT create the household in the database.
 *
 * @param overrides - Optional partial values to override generated defaults
 * @returns A TestHousehold object with a unique name
 */
export function makeTestHousehold(
  overrides?: Partial<TestHousehold>
): TestHousehold {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: `test-household-${suffix}`,
    name: `Test Household ${suffix}`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Phase 2 — Chores factories
// ---------------------------------------------------------------------------

export interface TestChoreArea {
  id: string;
  householdId: string;
  name: string;
  isDefault: boolean;
}

export interface TestTask {
  id: string;
  householdId: string;
  title: string;
  notes: string | null;
  areaId: string | null;
  ownerId: string | null;
  status: 'todo' | 'in_progress' | 'done';
  startsAt: Date;
  endsAt: Date | null;
  isRecurring: boolean;
  recurrenceRule: Record<string, unknown> | null;
  parentTaskId: string | null;
  createdBy: string;
  reminderOffsetMinutes: number | null;
}

export interface TestNotification {
  id: string;
  householdId: string;
  userId: string;
  type: 'task_assigned' | 'task_reminder';
  entityId: string | null;
  message: string;
  readAt: Date | null;
}

/**
 * Generates a unique in-memory TestChoreArea.
 * Does NOT create the area in the database.
 */
export function makeTestChoreArea(
  overrides?: Partial<TestChoreArea>
): TestChoreArea {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: `test-area-${suffix}`,
    householdId: `test-household-${suffix}`,
    name: `Test Area ${suffix}`,
    isDefault: false,
    ...overrides,
  };
}

/**
 * Generates a unique in-memory TestTask.
 * Does NOT create the task in the database.
 */
export function makeTestTask(overrides?: Partial<TestTask>): TestTask {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: `test-task-${suffix}`,
    householdId: `test-household-${suffix}`,
    title: `Test Task ${suffix}`,
    notes: null,
    areaId: null,
    ownerId: null,
    status: 'todo',
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
    endsAt: null,
    isRecurring: false,
    recurrenceRule: null,
    parentTaskId: null,
    createdBy: `test-user-${suffix}`,
    reminderOffsetMinutes: null,
    ...overrides,
  };
}

/**
 * Generates a unique in-memory TestNotification.
 * Does NOT create the notification in the database.
 */
export function makeTestNotification(
  overrides?: Partial<TestNotification>
): TestNotification {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: `test-notification-${suffix}`,
    householdId: `test-household-${suffix}`,
    userId: `test-user-${suffix}`,
    type: 'task_assigned',
    entityId: null,
    message: `Test notification ${suffix}`,
    readAt: null,
    ...overrides,
  };
}
