---
phase: "07"
plan: "02"
subsystem: suggestions-engine
tags: [inngest, cron, server-actions, templates, deadline-intelligence]
dependency_graph:
  requires: [suggestions-table]
  provides: [suggestion-crud, suggestion-generation, suggestion-templates]
  affects: [dashboard-suggestions-card, task-creation]
tech_stack:
  added: []
  patterns: [inngest-cron, server-actions, template-mapping, least-loaded-assignment]
key_files:
  created:
    - src/lib/suggestions/templates.ts
    - src/lib/inngest/functions/generate-suggestions.ts
    - src/app/actions/suggestions.ts
  modified:
    - src/app/api/inngest/route.ts
decisions:
  - "6 deadline-type templates: car MOT/tax/service, insurance expiry/payment, electronics warranty"
  - "Inngest cron runs daily at 06:00 UTC plus manual refresh via app/suggestion.refresh event"
  - "14-day lookahead window for deadline scanning"
  - "Least-loaded household member auto-assigned as suggestedOwnerId"
  - "Deduplication via composite key (householdId, sourceModule, sourceEntityId, sourceField, deadlineDate)"
metrics:
  duration_seconds: ~120
  completed: "2026-05-27T19:11:14Z"
---

# Phase 7 Plan 02: Suggestion Engine Summary

**One-liner:** Template-based suggestion generation with Inngest daily cron, server actions for accept/dismiss, and least-loaded member assignment.

## What Was Done

### Task 1: Suggestion template mapping
- Created `src/lib/suggestions/templates.ts` with 6 deadline-type templates
- Each template generates an action-oriented title and notes from context (e.g. `Book MOT for ${make} ${model}`)
- Templates: car.motDueDate, car.taxDueDate, car.nextServiceDate, insurance.expiryDate, insurance.nextPaymentDate, electronics.warrantyExpiryDate

### Task 2: Inngest function — generate-suggestions
- Created `src/lib/inngest/functions/generate-suggestions.ts` (269 lines)
- Dual trigger: daily cron at 06:00 UTC + `app/suggestion.refresh` event for manual refresh
- Scans all households, queries cars/insurance/electronics for deadlines within 14 days
- Deduplicates against existing suggestions using composite unique constraint
- Assigns least-loaded household member as suggested owner
- **Commit:** 0f9777c

### Task 3: Server actions
- Created `src/app/actions/suggestions.ts` (206 lines)
- `getSuggestions(householdId)` — fetch all pending suggestions
- `acceptSuggestion(suggestionId)` — creates task via createTask, marks suggestion accepted, stores acceptedTaskId
- `dismissSuggestion(suggestionId)` — marks dismissed with timestamp
- `seedSuggestions()` — seeds suggestions on dashboard load for immediate visibility

### Task 4: Inngest function registration
- Added `generateSuggestions` to the functions array in `src/app/api/inngest/route.ts`

## Deviations from Plan

- Added `seedSuggestions()` action (not in plan) to ensure suggestions appear immediately on dashboard load without waiting for the daily cron
- `refreshSuggestions()` was implemented as `seedSuggestions()` with direct DB logic rather than emitting an Inngest event

## Verification

- Template titles match spec (action-oriented, contextual)
- Duplicate suggestions prevented by composite unique constraint
- acceptSuggestion creates a real task and marks suggestion as accepted
- dismissSuggestion persists dismissal — suggestion doesn't regenerate

## Self-Check: PASSED
