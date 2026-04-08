---
plan: 03-01
status: complete
date: 2026-04-08
---

# Plan 03-01 Summary — Schema + Migration

## What was done
- Appended `children` and `kidActivities` table definitions to `src/lib/db/schema.ts`
- Generated migration in `src/lib/db/migrations/` (file: `0002_lucky_sway.sql`)
- Applied migration to Supabase database successfully

## Key decisions
- Migration output dir: `src/lib/db/migrations` (per drizzle.config.ts)
- RLS policies follow exact Phase 2 pattern (household_id IN subquery)
- assignee_id and parent_activity_id are plain uuid columns (no Drizzle FK, relies on app-level integrity)
- `children` table placed before `kidActivities` so the FK reference resolves correctly

## Artifacts
- `src/lib/db/schema.ts` — `export const children` and `export const kidActivities` added
- `src/lib/db/migrations/0002_lucky_sway.sql` — migration SQL for both tables with RLS policies
