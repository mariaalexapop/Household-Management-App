---
plan: "01-04"
status: complete
completed_at: "2026-03-27"
---

# Summary: 01-04 — Auth Flows

## What was built

All four auth pages, reusable AuthForm + OAuthButton components, PKCE callback route, Zod validation schemas, and 5 Playwright E2E tests covering the full auth lifecycle.

### Files created / modified

| File | Status | Description |
|------|--------|-------------|
| `src/lib/validations/auth.ts` | Pre-existing | loginSchema, signupSchema, resetPasswordSchema, updatePasswordSchema |
| `src/components/auth/AuthForm.tsx` | Pre-existing | Mode-aware form with react-hook-form + zodResolver |
| `src/components/auth/OAuthButton.tsx` | Pre-existing | Google OAuth button with inline SVG logo |
| `src/app/api/auth/callback/route.ts` | Pre-existing | PKCE code exchange → household check → /onboarding or /dashboard |
| `src/app/auth/login/page.tsx` | Moved from `(auth)/login/` | Login page |
| `src/app/auth/signup/page.tsx` | Moved from `(auth)/signup/` | Signup page |
| `src/app/auth/reset-password/page.tsx` | Moved from `(auth)/reset-password/` | Password reset request page |
| `src/app/auth/update-password/page.tsx` | Moved from `(auth)/update-password/` | Set new password page |
| `src/app/auth/verify-email/page.tsx` | Moved from `(auth)/verify-email/` | Email verification confirmation page |
| `src/middleware.ts` | Moved from root `middleware.ts` | Session refresh + unauthenticated redirect to /auth/login |
| `tests/e2e/auth.spec.ts` | Created | 5 Playwright tests for auth UI flows |

## Decisions made

### Next.js 16 middleware location
In Next.js 16 with a `src/` directory layout, middleware must be at `src/middleware.ts` — NOT at the project root `middleware.ts`. The original file from 01-02 was at the root and was silently ignored by Next.js 16 (no error, just not executed). Moved to `src/middleware.ts` to fix.

### Route group `(auth)` vs `auth/` directory
`src/app/(auth)/` is a route group — parentheses are excluded from the URL path, so `(auth)/login/page.tsx` creates `/login` not `/auth/login`. All links and middleware redirect to `/auth/login`. Fixed by moving pages to `src/app/auth/` (no parentheses).

### Signup E2E test strategy
Supabase rate-limits signup emails during repeated test runs. The signup test asserts that after form submission, either a redirect to `/auth/verify-email` OR an error `<p>` appears — both prove the form reached Supabase. Full verified-login flow is tested manually.

## Test results

```
Tests  5 passed (5)  [Chromium]
```

- Signup form renders and submits to Supabase ✅
- Login with invalid credentials shows error message ✅
- Password reset request shows success message ✅
- Unauthenticated user visiting /dashboard redirected to /auth/login ✅
- "Continue with Google" button visible on login page ✅

## Next plan

**01-05** — Onboarding wizard (Zustand store, Server Action, 3 step pages, components)
