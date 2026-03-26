---
phase: "01"
plan: "02"
title: "Project Init — Next.js 15, pnpm, env, Supabase project"
subsystem: "foundation"
tags: ["nextjs", "supabase", "auth", "tailwind", "shadcn", "middleware"]
completed_date: "2026-03-26"
duration_minutes: 45

dependency_graph:
  requires: []
  provides:
    - "Next.js 15 app scaffold with App Router"
    - "Supabase browser client (src/lib/supabase/client.ts)"
    - "Supabase server client (src/lib/supabase/server.ts)"
    - "Supabase admin client (src/lib/supabase/admin.ts)"
    - "Session refresh middleware (middleware.ts)"
    - "Tailwind v4 CSS-first globals with Kinship brand tokens"
    - "shadcn/ui components: button, card, input, label, badge, avatar, separator"
  affects:
    - "All subsequent plans that use Supabase auth or database access"
    - "All plans rendering UI (Kinship design tokens available)"

tech_stack:
  added:
    - "next@16.2.1 — App Router, Server Components, middleware"
    - "@supabase/supabase-js@2.100.1 — Auth, DB, Realtime, Storage"
    - "@supabase/ssr@0.9.0 — Cookie-based SSR sessions"
    - "drizzle-orm@0.45.1 — Type-safe ORM with RLS"
    - "drizzle-kit@0.31.10 — Migration generator"
    - "react-hook-form@7.72.0 — Form state"
    - "zod@4.3.6 — Schema validation"
    - "zustand@5.0.12 — Client-side state"
    - "date-fns@4.1.0 — Date formatting"
    - "lucide-react@1.7.0 — Icons"
    - "tw-animate-css@1.4.0 — CSS animations (replaces tailwindcss-animate)"
    - "inngest@4.1.0 — Background jobs"
    - "resend@6.9.4 — Transactional email"
    - "vitest@4.1.2 — Unit testing"
    - "@playwright/test@1.58.2 — E2E testing"
    - "shadcn/ui@4.1.0 — Component library"
  patterns:
    - "Tailwind v4 CSS-first: @theme inline {} in globals.css, no tailwind.config.ts"
    - "Supabase SSR: createBrowserClient / createServerClient / createAdminClient"
    - "Middleware uses getUser() not getSession() for secure JWT validation"
    - "next/font for Plus Jakarta Sans (display) + Public Sans (body)"

key_files:
  created:
    - path: "src/lib/supabase/client.ts"
      purpose: "Browser Supabase client using createBrowserClient + anon key"
    - path: "src/lib/supabase/server.ts"
      purpose: "Async server Supabase client using createServerClient + cookies()"
    - path: "src/lib/supabase/admin.ts"
      purpose: "Service-role admin client — bypasses RLS, server-only"
    - path: "middleware.ts"
      purpose: "Session refresh on every request using getUser(); redirects unauthenticated users to /auth/login"
    - path: ".env.example"
      purpose: "Placeholder env file documenting all required vars"
    - path: "src/components/ui/avatar.tsx"
      purpose: "shadcn Avatar component"
    - path: "src/components/ui/badge.tsx"
      purpose: "shadcn Badge component"
    - path: "src/components/ui/card.tsx"
      purpose: "shadcn Card component"
    - path: "src/components/ui/input.tsx"
      purpose: "shadcn Input component"
    - path: "src/components/ui/label.tsx"
      purpose: "shadcn Label component"
    - path: "src/components/ui/separator.tsx"
      purpose: "shadcn Separator component"
  modified:
    - path: "src/app/globals.css"
      purpose: "Added Kinship brand colour tokens and font vars to @theme inline {}; tw-animate-css import"
    - path: "src/app/layout.tsx"
      purpose: "Replaced Geist with Plus Jakarta Sans + Public Sans; Kinship metadata"
    - path: "src/app/page.tsx"
      purpose: "Replaced Next.js default template with minimal Kinship placeholder"
    - path: "next.config.ts"
      purpose: "Added turbopack.root to prevent workspace root detection warning"

decisions:
  - id: "SUPABASE_KEY_NAMING"
    summary: "Anon key env var is NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (not the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) — matching the key name already set in .env.local"
  - id: "NO_TAILWIND_CONFIG"
    summary: "No tailwind.config.ts created — Tailwind v4 is CSS-first; all config in globals.css @theme inline {}"
  - id: "TW_ANIMATE_CSS"
    summary: "Used tw-animate-css instead of tailwindcss-animate — correct package for Tailwind v4 ecosystem"
  - id: "GETUSER_NOT_GETSESSION"
    summary: "Middleware uses getUser() which validates JWT against Supabase auth server; getSession() reads cookie without verification and is insecure"
  - id: "NEXT_FONT"
    summary: "Used next/font/google for Plus Jakarta Sans and Public Sans instead of @import url() — better performance, automatic font subsetting, no CLS"

metrics:
  tasks_completed: 1
  tasks_total: 2
  files_created: 11
  files_modified: 4
  commits: 1
  build_status: "passing"
---

# Phase 01 Plan 02: Project Init Summary

**One-liner:** Next.js 15 app bootstrapped with Tailwind v4 CSS-first config, Kinship brand tokens, shadcn/ui components, and three-tier Supabase client architecture (browser/server/admin) with secure getUser() session middleware.

---

## What Was Built

The complete project skeleton for Kinship: a Next.js 16.2.1 application with App Router, TypeScript, and all Phase 1 dependencies installed. The Supabase integration follows the official `@supabase/ssr` pattern with three distinct clients:

- **Browser client** (`client.ts`): uses `createBrowserClient` with the anon/publishable key for client-side operations
- **Server client** (`server.ts`): uses `createServerClient` with an async cookie adapter for Server Components and Route Handlers
- **Admin client** (`admin.ts`): uses the service role key with `autoRefreshToken: false` and `persistSession: false` — server-only, bypasses RLS

The middleware refreshes auth cookies on every request using `getUser()` (not `getSession()`), which validates the JWT against the Supabase auth server rather than trusting the unverified cookie. Unauthenticated requests to non-auth, non-API routes are redirected to `/auth/login`.

The design system uses Tailwind v4 CSS-first configuration: all tokens live in `@theme inline {}` in `globals.css`. Kinship brand colours (`#0053dc` primary, `#f7f9fb` surface, `#2d3337` on-surface) are registered as `--color-kinship-*` tokens. Typography uses `next/font/google` for Plus Jakarta Sans (display/headlines) and Public Sans (body/labels).

---

## Task Execution

### Task 1: Create Supabase project in EU Frankfurt region
**Status:** COMPLETE (pre-existing — Task 1 was a human-action checkpoint that was completed before this execution session)

Supabase project exists at `qjvubteqxnpixqqscwyt.supabase.co` in Frankfurt (eu-central-1). `.env.local` is fully populated with all required env vars.

### Task 2: Bootstrap Next.js 15 with dependencies and Supabase clients
**Status:** COMPLETE — commit `86cea8c`

All Phase 1 dependencies installed, shadcn/ui initialized and components added, three Supabase client modules created, middleware wired, globals.css updated with Kinship design tokens, layout.tsx updated with Kinship fonts and metadata.

---

## Deviations from Plan

### Auto-applied adjustments

**1. [Rule 3 - Blocking] Next.js project name restriction**
- **Found during:** Task 2 (project init)
- **Issue:** `pnpm create next-app@latest .` rejected the directory name `Household-Management-App` because npm naming conventions prohibit capital letters
- **Fix:** Created the project in a temp subdirectory `kinship-temp`, then moved all files to the project root. Renamed the package from `kinship-temp` to `kinship` in `package.json`.
- **Files modified:** `package.json`

**2. [Rule 2 - Enhancement] Added turbopack.root to next.config.ts**
- **Found during:** First build
- **Issue:** Next.js detected a parent-directory `package-lock.json` from the Warp_project workspace and emitted a warning about incorrect workspace root detection
- **Fix:** Set `turbopack.root` in `next.config.ts` to the project directory, silencing the warning
- **Files modified:** `next.config.ts`

**3. [Rule 2 - Enhancement] Used next/font instead of @import url() for Google Fonts**
- **Found during:** Task 2 (layout.tsx update)
- **Issue:** `@import url()` in CSS loads fonts at runtime; `next/font` preloads fonts, eliminates CLS, and handles subsetting automatically
- **Fix:** Used `Plus_Jakarta_Sans` and `Public_Sans` from `next/font/google`; removed the `@import url()` from `globals.css`
- **Files modified:** `src/app/layout.tsx`, `src/app/globals.css`

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm build` exits 0 | PASS |
| `grep -n "getUser" middleware.ts` returns match | PASS — line 28, 32 |
| `grep -n "SUPABASE_SERVICE_ROLE_KEY" src/lib/supabase/admin.ts` returns match | PASS — line 11 |
| `grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/lib/supabase/client.ts` returns NO match | PASS — exit 1 |
| `ls tailwind.config.ts` shows "No such file" | PASS |

---

## Self-Check: PASSED

All files confirmed on disk. Commit `86cea8c` confirmed in git log.
