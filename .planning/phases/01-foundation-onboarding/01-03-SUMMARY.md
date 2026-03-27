---
plan: "01-03"
status: complete
completed_at: "2026-03-27"
---

# Summary: 01-03 — Drizzle Schema + RLS + Migration

## What was built

All 5 Phase 1 database tables are live in Supabase with RLS enabled and policies applied.

### Files created / modified

| File | Status | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | Pre-existing (01-02) | All 5 tables with inline pgPolicy RLS |
| `src/lib/db/index.ts` | Pre-existing (01-02) | Drizzle client with `{ prepare: false }` |
| `drizzle.config.ts` | Pre-existing (01-02) | Points to schema.ts + migrations/ |
| `src/lib/db/migrations/0000_flaky_sage.sql` | Pre-existing, verified | Generated SQL with ENABLE RLS, CREATE POLICY, ON DELETE CASCADE, ALTER PUBLICATION |
| `tests/helpers/supabase-rls.ts` | Created | `assertRlsBlocks()` helper for cross-household isolation checks |
| `tests/unit/db/rls.test.ts` | Created | 3 RLS isolation tests |
| `vitest.setup.ts` | Modified | Added dotenv `.env.local` loading for integration tests |

### Tables in Supabase

- `households` — RLS: SELECT (members only), INSERT (any authenticated)
- `household_members` — RLS: SELECT (own household), INSERT (self only), DELETE (admin only)
- `household_settings` — RLS: SELECT/INSERT/UPDATE (household members)
- `household_invites` — RLS: SELECT/INSERT (household members); no UPDATE policy (service role claim)
- `activity_feed` — RLS: SELECT/INSERT (household members)

### Realtime publication

`household_members` and `activity_feed` added to `supabase_realtime` publication.

### GDPR cascade

`ON DELETE CASCADE` added manually for all `auth.users` FK columns:
- `household_members.user_id`
- `household_invites.invited_by`
- `household_invites.claimed_by`

## Infrastructure note

Supabase direct connection URL (`db.<ref>.supabase.co`) does not resolve on IPv4 networks for newer projects. Session pooler URL must be used for migrations. Updated `.env.local` accordingly.

## Test results

```
Tests  3 passed (3)
```

- `household_members`: User A cannot read household B members ✅
- `household_settings`: User A cannot read household B settings ✅
- `household_members`: non-admin cannot DELETE from their own household ✅

## Decisions made

- `admin` client initialized lazily inside `beforeAll` (not at module level) so Vitest setup file loads env vars first
- `vitest.setup.ts` now calls `dotenv.config({ path: '.env.local' })` to support integration tests

## Next plan

**01-04** — Auth flows (signup, email verify, password reset, Google OAuth)
