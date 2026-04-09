---
phase: 03-kids-activities
plan: 04
subsystem: kids-ui
status: complete
date: 2026-04-09
tags: [ui, kids, activities, react-hook-form, datepicker]
dependency_graph:
  requires: [03-02, 03-03]
  provides: [/kids route, ActivityList, ActivityRow, ChildTabs, ActivityForm, KidsClient]
  affects: [03-06]
tech_stack:
  added: []
  patterns: [server-component-page, client-shell, react-hook-form-zod, category-colour-badges]
key_files:
  created:
    - src/app/(app)/kids/page.tsx
    - src/app/(app)/kids/KidsClient.tsx
    - src/components/kids/ActivityList.tsx
    - src/components/kids/ActivityRow.tsx
    - src/components/kids/ChildTabs.tsx
    - src/components/kids/ActivityForm.tsx
  modified: []
decisions:
  - Remove .default('none') from Zod repeat enum so zodResolver infers correct non-optional type
  - Dead void createActivity/updateActivity refs removed from KidsClient (those actions are imported inside ActivityForm)
metrics:
  duration_minutes: 20
  completed_date: 2026-04-09
  tasks: 2
  files: 6
requirements:
  - KIDS-01
  - KIDS-02
  - KIDS-03
  - KIDS-06
  - KIDS-07
  - KIDS-08
---

# Phase 3 Plan 4: Kids UI Summary

## One-liner

/kids route with activity list, child tab filter, category-coloured rows, and 10-field add/edit dialog — mirrors /chores page structure.

## What Was Done

**Task 1: /kids page.tsx + KidsClient.tsx**
- `src/app/(app)/kids/page.tsx` — Server Component: auth guard, household lookup, Drizzle queries for kidActivities (non-template rows only), children, members. Renders KidsClient.
- `src/app/(app)/kids/KidsClient.tsx` — Client shell: optimistic state, list/calendar toggle (calendar placeholder replaced in Plan 06), dialog state, handleAdd/handleEdit/handleDelete/handleCreateChild handlers. Exports `ActivityItem`, `ChildItem`, `MemberItem` types.

**Task 2: ActivityList, ActivityRow, ChildTabs, ActivityForm**
- `src/components/kids/ActivityList.tsx` — Filters activities by selectedChildId, renders ChildTabs + ActivityRow list with empty state.
- `src/components/kids/ActivityRow.tsx` — Displays title, category badge (CATEGORY_COLOURS map), date/time via date-fns format, assignee name, edit/delete buttons.
- `src/components/kids/ChildTabs.tsx` — Pill buttons: "All" + one per child, active state with kinship-primary colour.
- `src/components/kids/ActivityForm.tsx` — 10-field form: child select with inline "add new child", title, category, starts DatePicker+time, ends DatePicker+time (optional), location, assignee, repeat+interval, reminder, notes. react-hook-form with zodResolver. Calls createActivity or updateActivity server action.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Remove dead void statements in KidsClient**
- **Found during:** TypeScript check
- **Issue:** KidsClient had `void createActivity` and `void updateActivity` referencing undefined variables (those actions are used inside ActivityForm, not KidsClient)
- **Fix:** Removed the two void lines
- **Files modified:** src/app/(app)/kids/KidsClient.tsx
- **Commit:** 46db2af

**2. [Rule 1 - Bug] Fix zodResolver type mismatch for repeat field**
- **Found during:** TypeScript check
- **Issue:** `z.enum([...]).default('none')` made the input type include `undefined`, causing react-hook-form's zodResolver generic mismatch
- **Fix:** Removed `.default('none')` from schema; default is already set in `useForm({ defaultValues })`
- **Files modified:** src/components/kids/ActivityForm.tsx
- **Commit:** 46db2af

## Self-Check: PASSED

Files created:
- src/app/(app)/kids/page.tsx — FOUND
- src/app/(app)/kids/KidsClient.tsx — FOUND
- src/components/kids/ActivityList.tsx — FOUND
- src/components/kids/ActivityRow.tsx — FOUND
- src/components/kids/ChildTabs.tsx — FOUND
- src/components/kids/ActivityForm.tsx — FOUND

Commit 46db2af — FOUND
