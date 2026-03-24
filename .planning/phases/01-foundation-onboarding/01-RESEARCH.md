# Phase 1: Foundation & Onboarding - Research

**Researched:** 2026-03-24
**Domain:** Next.js 15 App Router + Supabase Auth + Drizzle ORM + Supabase Realtime + shadcn/ui Tailwind v4
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Supabase Auth email/password via `supabase.auth.signUp()` — documented and verified |
| AUTH-02 | User receives email verification after signup | Supabase sends verification emails by default; PKCE flow for SSR apps |
| AUTH-03 | User can reset password via email link | `supabase.auth.resetPasswordForEmail()` + callback route handler |
| AUTH-04 | User can sign up and log in with Google OAuth | Supabase Google provider — configure in dashboard + callback route |
| AUTH-05 | User session persists across browser refresh | `@supabase/ssr` cookie-based session + middleware refresh pattern |
| ONBD-01 | User selects household type during initial setup | Multi-step wizard with Zustand state + DB write on completion |
| ONBD-02 | User selects modules to activate during setup | Multi-select step in wizard; write `household_modules` table on completion |
| ONBD-03 | Dashboard generated based on selected modules | Server Component reads `household_modules`, renders module cards conditionally |
| ONBD-04 | User can add/remove modules from settings | Settings page updates `household_modules`; dashboard re-fetches |
| HSLD-01 | Creator becomes household admin | `is_admin` boolean on `household_members` row at INSERT time |
| HSLD-02 | Admin can invite members by email | `supabase.auth.admin.inviteUserByEmail()` via service-role API route |
| HSLD-03 | Admin can generate shareable invite link | UUID token stored in `household_invites` table; single-use, expirable |
| HSLD-04 | Invited person receives email and joins | Supabase invite email flow; on accept, insert into `household_members` |
| HSLD-05 | All members can view other household members | RLS SELECT policy on `household_members` for same household |
| HSLD-06 | User can set display name and avatar | Profile update via `supabase.auth.updateUser()` + Storage avatar upload |
| HSLD-07 | Admin can remove a member | DELETE from `household_members` guarded by `is_admin` RLS policy |
| HSLD-08 | User can view household activity feed | Append-only `activity_feed` table; INSERT trigger or application-layer logging |
| PLAT-01 | Real-time sync across all members | Supabase Realtime `postgres_changes` subscriptions; RLS enforced automatically |
| PLAT-02 | Reconnecting indicator when connection drops | Supabase Realtime `onHeartbeat` callback + `RealtimeChannel` status events |
| PLAT-04 | Data stored in EU infrastructure | Supabase Frankfurt region (eu-central-1) selected at project creation |
| PLAT-05 | User can request personal data deletion | `supabase.auth.admin.deleteUser()` + cascading DELETE via FK ON DELETE CASCADE |
</phase_requirements>

---

## Summary

Phase 1 establishes the full infrastructure stack that every subsequent phase depends on. The three most technically complex areas are: (1) the Supabase Auth + Next.js 15 SSR session pattern, which has moved to `@supabase/ssr` with a specific middleware pattern where `getUser()` must replace `getSession()`; (2) Drizzle ORM's native RLS support, which now lets you define `pgPolicy` inline in table schemas and generates the SQL, rather than writing raw migration SQL; and (3) Supabase Realtime's RLS enforcement for Postgres Changes, which is confirmed active — subscribed users only receive rows their RLS policies allow.

The household invite system requires two complementary flows: Supabase's built-in `admin.inviteUserByEmail()` (which sends an email with a magic link) and a custom shareable-link mechanism backed by a `household_invites` table with a UUID token and expiry timestamp. The shareable link approach requires a claim-invite route that validates the token before completing signup.

Tailwind v4 introduces a CSS-first configuration paradigm — `tailwind.config.ts` is gone; all theme tokens live in `globals.css` under `@theme inline`. shadcn/ui has fully migrated to Tailwind v4 and React 19, with `tw-animate-css` replacing `tailwindcss-animate`.

**Primary recommendation:** Set up Supabase project (Frankfurt region), configure `@supabase/ssr` middleware first, then scaffold Drizzle schema with RLS policies co-located in schema files, then wire Realtime subscriptions. Every table needs RLS from migration zero — retrofitting is prohibitive.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | Full-stack React framework with App Router | Project decision; SSR + Server Actions + API routes in one |
| @supabase/supabase-js | 2.100.0 | Supabase client SDK | Official SDK; handles Auth, DB queries, Realtime, Storage |
| @supabase/ssr | 0.9.0 | Cookie-based Auth for Next.js SSR | Required for sessions in Server Components; replaces auth-helpers |
| drizzle-orm | 0.45.1 | Type-safe ORM with RLS support | Project decision; inline RLS policies, Supabase-native roles |
| drizzle-kit | 0.31.10 | Migration generator for Drizzle | Generates SQL migrations from schema; `npx drizzle-kit generate` |
| tailwindcss | 4.2.2 | Utility-first CSS | Project decision; v4 CSS-first config; no tailwind.config.ts |
| shadcn (CLI) | 4.1.0 | Copy-paste component library on Radix UI | Project decision; fully compatible with Tailwind v4 + React 19 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.72.0 | Form state management | All forms in wizard, auth, settings |
| zod | 4.3.6 | Schema validation (client + server) | Validate form input and Server Action payloads |
| zustand | 5.0.12 | Minimal client state store | Multi-step onboarding wizard state; UI-only state (modals etc) |
| date-fns | 4.1.0 | Date formatting and arithmetic | Activity feed timestamps, invite expiry |
| lucide-react | 1.6.0 | Icon set | Ships with shadcn/ui; consistent icons throughout |
| tw-animate-css | latest | CSS animations for shadcn | Replaced tailwindcss-animate in Tailwind v4 ecosystem |
| vitest | 4.1.1 | Unit/component test runner | All unit and component tests |
| @vitejs/plugin-react | latest | Vitest React support | Required vitest plugin for React components |
| @testing-library/react | latest | Component testing utilities | Behaviour-driven component tests |
| @playwright/test | 1.58.2 | E2E test runner | Cross-browser auth flows and onboarding wizard |
| inngest | 4.0.5 | Background job queue | Used in Phase 1 for sending invite emails via Resend (async) |
| resend | 6.9.4 | Transactional email | Household invite emails, GDPR deletion confirmation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma heavier for edge; no native RLS policy definitions in schema |
| Zustand for wizard state | URL search params | URL params are shareable but more complex for multi-step with validation |
| Custom invite tokens | Supabase invite only | `inviteUserByEmail` requires email; shareable links need custom token table |

### Installation

```bash
pnpm add @supabase/supabase-js @supabase/ssr drizzle-orm postgres
pnpm add next react react-dom
pnpm add react-hook-form zod zustand date-fns lucide-react
pnpm add inngest resend
pnpm add -D drizzle-kit vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @playwright/test
npx shadcn@latest init
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages: login, signup, reset-password, callback
│   ├── (onboarding)/        # Onboarding wizard pages: step 1, 2, 3
│   ├── (app)/               # Protected app: dashboard, settings, household
│   │   ├── dashboard/
│   │   ├── household/
│   │   └── settings/
│   └── api/
│       ├── auth/callback/   # Supabase PKCE callback handler
│       └── household/       # invite, remove-member, accept-invite endpoints
├── components/
│   ├── ui/                  # shadcn/ui components (auto-generated)
│   ├── auth/                # AuthForm, OAuthButton
│   ├── onboarding/          # WizardStep, ModuleSelector, HouseholdTypeSelector
│   ├── household/           # MembersList, InviteModal, ActivityFeed
│   ├── dashboard/           # ModuleCard, DashboardGrid
│   └── realtime/            # RealtimeProvider, ConnectionIndicator
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client (createBrowserClient)
│   │   ├── server.ts        # Server client (createServerClient + cookies)
│   │   └── admin.ts         # Service-role client (invite, delete user)
│   ├── db/
│   │   ├── index.ts         # Drizzle client
│   │   ├── schema.ts        # All table definitions with RLS policies
│   │   └── migrations/      # Generated SQL migration files
│   └── validations/         # Zod schemas shared client/server
├── middleware.ts             # Supabase session refresh middleware
└── stores/
    └── onboarding.ts        # Zustand store for wizard state
```

### Pattern 1: Supabase SSR Auth Middleware

**What:** Next.js middleware that refreshes Supabase Auth tokens on every request and stores them in cookies.
**When to use:** Required for all authenticated Server Components and protected routes.

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: use getClaims() not getSession() — validates JWT against auth server
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Pattern 2: Drizzle Schema with Inline RLS Policies

**What:** Define RLS policies directly in the Drizzle schema file alongside table definitions using Drizzle's `pgPolicy` and Supabase-provided roles.
**When to use:** Every household-scoped table. Run `drizzle-kit generate` to get SQL migrations that include `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements.

```typescript
// Source: https://orm.drizzle.team/docs/rls
// src/lib/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'
import { sql } from 'drizzle-orm'

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // couple | family | flatmates | single
  invite_code: uuid('invite_code').defaultRandom(),
  created_at: timestamp('created_at').defaultNow(),
})

export const householdMembers = pgTable('household_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  household_id: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull(), // references auth.users
  display_name: text('display_name'),
  avatar_url: text('avatar_url'),
  is_admin: boolean('is_admin').default(false),
  joined_at: timestamp('joined_at').defaultNow(),
}, (t) => [
  pgPolicy('members_select_own_household', {
    for: 'select',
    to: authenticatedRole,
    using: sql`household_id IN (
      SELECT household_id FROM household_members WHERE user_id = ${authUid()}
    )`,
  }),
  pgPolicy('members_insert_self', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`user_id = ${authUid()}`,
  }),
])
```

### Pattern 3: Realtime Subscription with Connection Status

**What:** Subscribe to Postgres changes for a household and track connection health for PLAT-02 (reconnecting indicator).
**When to use:** Dashboard and any data-displaying page. Subscribe on mount, unsubscribe on unmount.

```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
// components/realtime/RealtimeProvider.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export function useHouseholdRealtime(householdId: string) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`household:${householdId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'household_members',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        // handle member changes
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_feed',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        // handle activity changes
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus('connected')
        if (status === 'CHANNEL_ERROR') setStatus('disconnected')
        if (status === 'TIMED_OUT') setStatus('disconnected')
      })

    // Monitor heartbeat for silent disconnections
    channel.onHeartbeat?.((heartbeatStatus) => {
      if (heartbeatStatus === 'timeout' || heartbeatStatus === 'disconnected') {
        setStatus('disconnected')
      } else if (heartbeatStatus === 'ok') {
        setStatus('connected')
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [householdId])

  return { status }
}
```

### Pattern 4: Multi-Step Onboarding Wizard

**What:** Client-side wizard with Zustand state accumulation across steps; single DB write at final step confirmation.
**When to use:** The post-signup onboarding flow for ONBD-01 through ONBD-03.

```typescript
// stores/onboarding.ts
import { create } from 'zustand'

type HouseholdType = 'couple' | 'family_with_kids' | 'flatmates' | 'single'
type ModuleKey = 'home_chores' | 'car_maintenance' | 'insurance' | 'electronics' | 'kids_activities'

interface OnboardingState {
  householdName: string
  householdType: HouseholdType | null
  activeModules: ModuleKey[]
  setHouseholdName: (name: string) => void
  setHouseholdType: (type: HouseholdType) => void
  toggleModule: (module: ModuleKey) => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  householdName: '',
  householdType: null,
  activeModules: [],
  setHouseholdName: (name) => set({ householdName: name }),
  setHouseholdType: (type) => set({ householdType: type }),
  toggleModule: (module) => set((state) => ({
    activeModules: state.activeModules.includes(module)
      ? state.activeModules.filter((m) => m !== module)
      : [...state.activeModules, module],
  })),
}))
```

### Pattern 5: Household Invite System

**What:** Two flows — email invite (Supabase Admin API) and shareable link (custom UUID token in DB).
**When to use:** HSLD-02 (email invite) and HSLD-03 (link invite).

Email invite requires a service-role client in a Next.js API route (never expose service role to client):

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
// app/api/household/invite/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { email, householdId } = await request.json()
  // verify caller is admin of householdId first...
  const supabase = createAdminClient() // uses SUPABASE_SERVICE_ROLE_KEY
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { household_id: householdId, invited_as: 'member' },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite`,
  })
  // ...
}
```

Shareable link: generate a UUID, store in `household_invites` table with `household_id`, `token`, `expires_at`, `used_at`. The accept-invite route validates token, checks expiry, and inserts into `household_members`.

### Anti-Patterns to Avoid

- **`getSession()` in server code:** Replaced by `getUser()` / `getClaims()`. `getSession()` does not re-validate the JWT — use only in client components where freshness is not critical.
- **Service role client in middleware or client components:** Service role bypasses all RLS. Only use in Next.js API routes (`route.ts`), never in middleware or browser code.
- **Shipping RLS-less tables:** Tables added without RLS later require a migration freeze and careful policy backfill. Enable RLS at the `CREATE TABLE` step.
- **Single Supabase client for both user and admin operations:** Create `client.ts` (browser), `server.ts` (SSR), and `admin.ts` (service role) as three separate modules.
- **Polling for Realtime:** The Supabase client handles reconnection with exponential backoff (1s, 2s, 5s, 10s). Do not poll. Use `onHeartbeat` for disconnect detection instead.
- **Tailwind config file in v4:** `tailwind.config.ts` no longer exists. All theme tokens go in `@theme inline {}` inside `globals.css`.
- **`tailwindcss-animate` in v4:** Replaced by `tw-animate-css`. Using the old package causes broken animations.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management in SSR | Custom cookie/JWT logic | `@supabase/ssr` + middleware | Cookie rotation, token refresh, PKCE — edge cases are numerous |
| Email verification & magic links | Custom token generation | Supabase Auth built-in | Token hashing, expiry, email delivery, rate limiting |
| Google OAuth PKCE flow | Custom OAuth redirect logic | Supabase `signInWithOAuth` + `/auth/callback` route | State parameter, code exchange, nonce for One-Tap |
| DB schema RLS policies | Raw SQL in migration files | Drizzle `pgPolicy` in schema | Policies co-located with table, type-safe `authUid()` helper, generated correctly |
| Invite email delivery | Direct SMTP | Resend via Inngest background job | Rate limiting, retries, bounce handling, template rendering |
| UI components from scratch | Custom Button, Dialog, Form | shadcn/ui copy-paste | Accessibility (Radix UI), keyboard navigation, focus trapping — all handled |
| Onboarding step state | Redux/complex state machine | Zustand store | Simple key-value accumulation; no async state needed at wizard level |

**Key insight:** Supabase handles the entire Auth lifecycle. Custom auth code always misses edge cases (token refresh race conditions, PKCE state tampering, concurrent session tabs). The `@supabase/ssr` package exists precisely to avoid these.

---

## Common Pitfalls

### Pitfall 1: `getSession()` in Middleware / Server Components

**What goes wrong:** Auth appears to work but tokens are served from cache without server re-validation. An expired or revoked token can still pass the middleware check.
**Why it happens:** `getSession()` reads from the cookie without hitting the Supabase Auth server. `getUser()` sends the JWT to Supabase for verification on every call.
**How to avoid:** Use `supabase.auth.getUser()` (or `getClaims()` per current docs) everywhere in middleware and Server Components. `getSession()` is only appropriate in Client Components where slightly stale data is acceptable.
**Warning signs:** Users stay "logged in" after being deleted from Supabase dashboard.

### Pitfall 2: Supabase Realtime Tables Not in Publication

**What goes wrong:** Subscriptions connect but never fire any events.
**Why it happens:** Tables must be added to the `supabase_realtime` publication for changes to stream through the replication slot.
**How to avoid:** For each table needing Realtime, run in migration: `alter publication supabase_realtime add table <table_name>;`. Or enable via Supabase Dashboard > Database > Publications.
**Warning signs:** `channel.subscribe()` callback shows `SUBSCRIBED` status but no payloads arrive.

### Pitfall 3: RLS Blocking Realtime Subscription Payloads

**What goes wrong:** Realtime subscription fires but the `payload.new` or `payload.old` is empty (`{}`) instead of containing the changed row.
**Why it happens:** When RLS is enabled and the authenticated user does not have a SELECT policy that covers the row, Supabase Realtime sends the event but redacts the data to `{}`.
**How to avoid:** Verify RLS SELECT policies are correct before testing Realtime. Use `service_role` client for debugging to confirm events fire, then confirm the user-scoped client has matching policies.
**Warning signs:** Events arrive with empty `new` and `old` objects.

### Pitfall 4: Connection Pooler Mode for Drizzle Migrations

**What goes wrong:** Migrations fail or prepared statements error.
**Why it happens:** Supabase offers two pool modes: "Transaction" (PgBouncer, no prepared statements) and "Session" (direct). `drizzle-kit migrate` needs a direct connection; application queries can use the pooler.
**How to avoid:** Use two separate `DATABASE_URL` values: `DATABASE_URL` (direct, for migrations and server code) and `DATABASE_URL_POOLER` (pooled, for edge function contexts). Set `{ prepare: false }` on the pooler connection.
**Warning signs:** `Error: prepared statement "..." already exists` or migrations hang.

### Pitfall 5: Tailwind v4 Border Color Default Change

**What goes wrong:** All borders become black text color instead of the theme border color.
**Why it happens:** Tailwind v4 changed the default `border-color` from `gray-200` to `currentColor`.
**How to avoid:** Use explicit color utilities everywhere (`border-border`, not just `border`). Configure `--border-color-DEFAULT` in `@theme` or fix the shadcn globals.css setup per official migration guide.
**Warning signs:** All dividers and card borders render as black lines.

### Pitfall 6: Invite User Requires Service Role Key on Server

**What goes wrong:** `admin.inviteUserByEmail()` returns a 403 or auth error.
**Why it happens:** This method requires the service role key, not the anon key. Calling it from a browser client (which uses anon key) will always fail.
**How to avoid:** Create `admin.ts` Supabase client using `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`). Only call from `route.ts` API handlers running on the server.
**Warning signs:** `AuthApiError: not allowed` on invite calls.

### Pitfall 7: Shareable Invite Link Race Condition

**What goes wrong:** Two people click the same shareable link simultaneously; both join, but one gets an orphaned `household_members` row.
**Why it happens:** The token-claim step is not atomic.
**How to avoid:** Use a database transaction: `UPDATE household_invites SET used_at = NOW() WHERE token = $1 AND used_at IS NULL` with a row-level lock, then `INSERT INTO household_members`. If update affects 0 rows, the link was already used.

---

## Code Examples

Verified patterns from official sources:

### Server Component Supabase Client

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Browser (Client Component) Supabase Client

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Service Role Admin Client

```typescript
// lib/supabase/admin.ts — NEVER import in client components
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // never NEXT_PUBLIC_
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

### Drizzle Client Setup

```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// For server-side queries (not edge)
const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle({ client, schema })
```

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

### Google OAuth Callback Route

```typescript
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### GDPR: Delete User and Cascade Data

```typescript
// app/api/account/delete/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // All household data cascades via FK ON DELETE CASCADE
  // The auth.users deletion cascades to household_members via trigger
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(user.id)
  return new Response(null, { status: 204 })
}
```

---

## Database Schema — Phase 1 Tables

The following tables must be created with RLS in Phase 1. Drizzle generates the migration SQL.

```typescript
// Core tables needed for Phase 1 requirements:

// households — HSLD-01
// household_members (user_id, is_admin, display_name, avatar_url) — HSLD-01 through HSLD-07
// household_invites (token uuid, household_id, email nullable, expires_at, used_at) — HSLD-02, HSLD-03
// household_modules (household_id, module_key, is_active) — ONBD-02 through ONBD-04
// activity_feed (household_id, actor_id, event_type, entity_type, entity_id, metadata jsonb, created_at) — HSLD-08
// child_profiles (household_id, name, date_of_birth) — anticipate Kids Activities; NOT exposed in Phase 1 UI
```

Note on `child_profiles`: the project decision requires the data model to anticipate child profiles even though Kids Activities module is Phase 3. Create the table with correct RLS in Phase 1 migrations to avoid schema migration complexity later.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers deprecated; ssr is the current package |
| `getSession()` in middleware | `getUser()` / `getClaims()` | 2024 | Security fix; getSession doesn't validate JWT server-side |
| `tailwind.config.ts` | CSS-only config in `globals.css` via `@theme inline` | Tailwind v4.0 (2025) | No config file; all tokens in CSS |
| `tailwindcss-animate` | `tw-animate-css` | shadcn/ui + Tailwind v4 migration (2025) | New package required for Tailwind v4 |
| `forwardRef` in shadcn components | Plain function components | shadcn/ui React 19 migration (2025) | Simpler types; `ref` now a prop |
| Manual SQL for RLS policies | `pgPolicy` in Drizzle schema | Drizzle ORM 0.30+ | Policies co-located with schema; generated in migrations |

**Deprecated / outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated. Do not install.
- `tailwindcss-animate`: Replaced by `tw-animate-css` in Tailwind v4 setups.
- `supabase.auth.getSession()` in server contexts: Functionally replaced by `getUser()`. Still exists but insecure for server use.

---

## Open Questions

1. **Supabase `getClaims()` vs `getUser()` in current `@supabase/ssr` 0.9.0**
   - What we know: Official docs retrieved (2026-03-24) mention `getClaims()` as the replacement for `getSession()` server-side. Some results still show `getUser()`.
   - What's unclear: Whether `getClaims()` is a new method added in 0.9.0 or if `getUser()` is still the recommended call. The two may be aliases or `getClaims()` may be additive.
   - Recommendation: During Wave 0 setup, run `console.log(Object.keys(supabase.auth))` to verify available methods, then check the `@supabase/ssr` 0.9.0 changelog.

2. **Realtime publication setup: manual SQL vs Drizzle migration**
   - What we know: `alter publication supabase_realtime add table <table_name>` must be run for each table. Drizzle migrations generate table DDL but not publication commands.
   - What's unclear: Whether Drizzle kit has a way to emit publication alterations, or whether these must be additional SQL files in the migrations directory.
   - Recommendation: Add publication commands as raw SQL appended to each table's migration file. Alternatively, use a single `000-publications.sql` file run at the end of Wave 0.

3. **Inngest vs pg_cron for Phase 1 invite emails**
   - What we know: STACK.md lists Inngest for background jobs (AI, async). STACK.md also lists pg_cron for scheduled reminders. Invite emails are one-shot async tasks, not scheduled.
   - What's unclear: Whether to use Inngest for sending invite emails (Resend) or just call Resend directly from the API route synchronously (since invite emails are fast, not AI-scale latency).
   - Recommendation: Call Resend directly from the invite API route for Phase 1. Inngest is not needed until Phase 2+ async jobs. This keeps Phase 1 infrastructure simpler.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 + React Testing Library + Playwright 1.58.2 |
| Config file | `vitest.config.mts` — Wave 0 gap (does not exist yet) |
| Quick run command | `pnpm test --run` |
| Full suite command | `pnpm test --run && pnpm playwright test` |

**Important limitation:** Vitest does not support async React Server Components. Unit tests cover Client Components, utility functions, and validation logic. Async Server Component rendering must be covered by Playwright E2E tests.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email signup creates user and redirects | E2E | `pnpm playwright test tests/e2e/auth/signup.spec.ts` | ❌ Wave 0 |
| AUTH-02 | Email verification email is sent | E2E (manual verify) | `pnpm playwright test tests/e2e/auth/email-verify.spec.ts` | ❌ Wave 0 |
| AUTH-03 | Password reset email sends and redirect works | E2E | `pnpm playwright test tests/e2e/auth/password-reset.spec.ts` | ❌ Wave 0 |
| AUTH-04 | Google OAuth redirects to callback and creates session | E2E | `pnpm playwright test tests/e2e/auth/google-oauth.spec.ts` | ❌ Wave 0 |
| AUTH-05 | Session survives page refresh | E2E | `pnpm playwright test tests/e2e/auth/session-persist.spec.ts` | ❌ Wave 0 |
| ONBD-01 | Household type selection renders step, updates store | Unit | `pnpm test --run src/components/onboarding/HouseholdTypeSelector.test.tsx` | ❌ Wave 0 |
| ONBD-02 | Module multi-select updates store correctly | Unit | `pnpm test --run src/components/onboarding/ModuleSelector.test.tsx` | ❌ Wave 0 |
| ONBD-03 | Dashboard renders only active module cards | Unit | `pnpm test --run src/components/dashboard/DashboardGrid.test.tsx` | ❌ Wave 0 |
| ONBD-04 | Settings page module toggle persists to DB | E2E | `pnpm playwright test tests/e2e/settings/modules.spec.ts` | ❌ Wave 0 |
| HSLD-01 | Household creator has is_admin=true | Unit (DB util) | `pnpm test --run src/lib/db/household.test.ts` | ❌ Wave 0 |
| HSLD-02 | Admin can send email invite | Integration | `pnpm test --run src/app/api/household/invite.test.ts` | ❌ Wave 0 |
| HSLD-03 | Invite link token is generated and stored | Unit | `pnpm test --run src/lib/household/invite.test.ts` | ❌ Wave 0 |
| HSLD-04 | Invite accept flow creates household_members row | E2E | `pnpm playwright test tests/e2e/household/accept-invite.spec.ts` | ❌ Wave 0 |
| HSLD-05 | Members list shows all household members | Unit | `pnpm test --run src/components/household/MembersList.test.tsx` | ❌ Wave 0 |
| HSLD-06 | Display name update persists | E2E | `pnpm playwright test tests/e2e/settings/profile.spec.ts` | ❌ Wave 0 |
| HSLD-07 | Admin can remove member; non-admin cannot | Unit (RLS policy) | `pnpm test --run src/lib/db/household-rls.test.ts` | ❌ Wave 0 |
| HSLD-08 | Activity feed shows events in correct order | Unit | `pnpm test --run src/components/household/ActivityFeed.test.tsx` | ❌ Wave 0 |
| PLAT-01 | DB change propagates to second browser tab | E2E | `pnpm playwright test tests/e2e/realtime/sync.spec.ts` | ❌ Wave 0 |
| PLAT-02 | Reconnecting indicator appears on disconnect | Unit | `pnpm test --run src/components/realtime/ConnectionIndicator.test.tsx` | ❌ Wave 0 |
| PLAT-04 | Supabase project region = eu-central-1 | Manual verify | — manual | N/A |
| PLAT-05 | Delete account removes auth user and cascades data | Integration | `pnpm test --run src/app/api/account/delete.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test --run` (unit + integration; skip E2E)
- **Per wave merge:** `pnpm test --run && pnpm playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.mts` — Vitest configuration file
- [ ] `playwright.config.ts` — Playwright E2E configuration
- [ ] `tests/e2e/` — E2E test directory
- [ ] `src/__tests__/` or colocated test files — unit test directory
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @playwright/test`
- [ ] Supabase test utilities: `pnpm add -D @supabase/supabase-js` (already a prod dep; ensure test mock/stub pattern is established)

---

## Sources

### Primary (HIGH confidence)

- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, `getUser()` over `getSession()`, server/browser client setup
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) — channel API, publication setup, RLS enforcement
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization) — confirmed RLS respected for Postgres Changes
- [Drizzle ORM RLS docs](https://orm.drizzle.team/docs/rls) — `pgPolicy`, Supabase roles (`authenticatedRole`, `authUid`), `.link()` API
- [Drizzle + Supabase tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — connection setup, migration commands, pooler considerations
- [shadcn/ui Tailwind v4 migration](https://ui.shadcn.com/docs/tailwind-v4) — `@theme inline`, OKLCH colors, `tw-animate-css`, `data-slot` attributes
- [Next.js Vitest setup](https://nextjs.org/docs/app/guides/testing/vitest) — `vitest.config.mts`, async Server Component limitation
- [Google OAuth Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) — PKCE flow, callback route, nonce for One-Tap
- npm registry verified versions: next@16.2.1, @supabase/supabase-js@2.100.0, @supabase/ssr@0.9.0, drizzle-orm@0.45.1, drizzle-kit@0.31.10, tailwindcss@4.2.2, shadcn@4.1.0, react-hook-form@7.72.0, zod@4.3.6, zustand@5.0.12, vitest@4.1.1, @playwright/test@1.58.2

### Secondary (MEDIUM confidence)

- [Supabase inviteUserByEmail reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — service role requirement, `data` metadata on invite
- [Supabase EU region / GDPR guide (2025)](https://www.kontocsv.de/en/ratgeber/supabase-dsgvo-konform) — Frankfurt region = eu-central-1; must accept DPA in Supabase console
- [Realtime heartbeat monitoring](https://supabase.com/docs/guides/troubleshooting/realtime-heartbeat-messages) — `onHeartbeat` callback, exponential backoff reconnection
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) — `npx shadcn@latest init`, component add commands

### Tertiary (LOW confidence — verify before implementation)

- `getClaims()` method availability in `@supabase/ssr` 0.9.0: mentioned in fetched docs but needs runtime verification against current package

---

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — verified against npm registry 2026-03-24
- Auth patterns (`@supabase/ssr`, middleware, `getUser`): HIGH — verified against current official Supabase docs
- Drizzle RLS (`pgPolicy`, `authUid`): HIGH — verified against official Drizzle docs
- Realtime RLS enforcement: HIGH — confirmed via official Supabase Realtime Authorization docs
- Tailwind v4 + shadcn/ui: HIGH — verified against shadcn official Tailwind v4 migration page
- Invite system design: MEDIUM — Supabase `inviteUserByEmail` is documented; custom token table is a standard pattern but not from an official reference
- `getClaims()` availability: LOW — mentioned in fetched docs summary but not directly verified in package source

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (Supabase and shadcn move quickly; re-verify @supabase/ssr changelog if implementing after this date)
