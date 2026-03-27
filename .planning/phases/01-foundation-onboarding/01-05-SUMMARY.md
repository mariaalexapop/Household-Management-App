---
plan: "01-05"
phase: 1
title: "Onboarding wizard — Zustand store, Server Action, 3-step pages, wizard components"
status: complete
---

## What was built

A 3-step onboarding wizard that every new user completes after signup to create their household.

### Files created

| File | Purpose |
|------|---------|
| `src/stores/onboarding.ts` | Zustand store: step, householdName, householdType, activeModules with setters and reset |
| `src/lib/validations/onboarding.ts` | Zod schemas: step1Schema, step2Schema, createHouseholdSchema |
| `src/app/actions/onboarding.ts` | `createHousehold` Server Action with Drizzle transaction |
| `src/app/(onboarding)/onboarding/page.tsx` | Root redirect → /onboarding/step-1 |
| `src/app/(onboarding)/onboarding/step-1/page.tsx` | Household name + type selection |
| `src/app/(onboarding)/onboarding/step-2/page.tsx` | Module selection (multi-select) |
| `src/app/(onboarding)/onboarding/step-3/page.tsx` | Summary + Create Household submit |
| `src/components/onboarding/WizardLayout.tsx` | Shared layout: step indicator, back/next navigation |
| `src/components/onboarding/HouseholdTypeSelector.tsx` | 4-option card grid for household type |
| `src/components/onboarding/ModuleSelector.tsx` | 5-module toggle list with checkmark badges |
| `tests/unit/onboarding/wizard.test.ts` | 13 unit tests for store + schema |

### Key decisions

- **No localStorage persistence**: Wizard state is ephemeral; losing it on refresh is acceptable (user starts again).
- **Drizzle transaction for atomicity**: `db.transaction()` ensures all 3 inserts (households, household_members, household_settings) succeed or all roll back.
- **Double-create guard**: Server Action checks for existing household membership before inserting, returns `{ success: false, error: 'Household already exists' }` if found.
- **No redirect inside Server Action**: Action returns `{ success, householdId }` and the component handles `router.push('/dashboard')` — avoids issues with `redirect()` inside try/catch.
- **URL-based navigation**: Each step is a separate page (`/onboarding/step-N`) rather than a single SPA wizard, keeping server components and deep-linking available.

### Requirements covered

- ONBD-01: New user lands on /onboarding after auth
- ONBD-02: Step 1 captures household name + type; Step 2 captures module selection
- ONBD-03: Step 3 confirms and submits; creates household in single transaction
- HSLD-01: Household creator has role=admin in household_members

### Verification

- `pnpm exec vitest run tests/unit/onboarding/wizard.test.ts` → 13/13 passed
- `pnpm build` → compiled successfully, all 4 onboarding routes present
