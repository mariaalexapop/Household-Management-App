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
