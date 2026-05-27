---
phase: 3
slug: kids-activities
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + @testing-library/react 16 |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `vitest run tests/unit/kids/ tests/unit/calendar/ --passWithNoTests` |
| **Full suite command** | `vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run tests/unit/kids/ tests/unit/calendar/ --passWithNoTests`
- **After every plan wave:** Run `vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | KIDS-01, KIDS-02 | migration | `rtk tsc` | ✅ schema.ts | ⬜ pending |
| 03-01-02 | 01 | 1 | KIDS-01, KIDS-02 | migration | `vitest run tests/unit/kids/children.test.ts --passWithNoTests` | ❌ Wave 0 | ⬜ pending |
| 03-02-01 | 02 | 2 | KIDS-01, KIDS-02, KIDS-03, KIDS-07 | unit | `vitest run tests/unit/kids/children.test.ts tests/unit/kids/activities.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 03-02-02 | 02 | 2 | KIDS-03, KIDS-07, KIDS-08 | unit | `vitest run tests/unit/kids/activities.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 03-03-01 | 03 | 2 | KIDS-04 | unit | `vitest run tests/unit/kids/recurrence.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 03-03-02 | 03 | 2 | KIDS-05 | unit | `vitest run tests/unit/kids/reminder.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 03-04-01 | 04 | 3 | KIDS-06, KIDS-08 | manual + tsc | `rtk tsc` | ✅ page.tsx | ⬜ pending |
| 03-04-02 | 04 | 3 | KIDS-03, KIDS-07 | manual + tsc | `rtk tsc` | ✅ KidsClient.tsx | ⬜ pending |
| 03-05-01 | 05 | 3 | CAL-01, CAL-02, CAL-03 | unit | `vitest run tests/unit/calendar/merge.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 03-05-02 | 05 | 3 | CAL-01, CAL-04 | unit | `vitest run tests/unit/calendar/groupByDay.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| 03-06-01 | 06 | 4 | CAL-04, KIDS-06 | manual + tsc | `rtk tsc` | ❌ new files | ⬜ pending |
| 03-06-02 | 06 | 4 | CAL-01, CAL-02, CAL-03 | manual + tsc | `rtk tsc` | ✅ dashboard/page.tsx | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/kids/children.test.ts` — stubs for KIDS-01, KIDS-02 (createChild action)
- [ ] `tests/unit/kids/activities.test.ts` — stubs for KIDS-03, KIDS-07, KIDS-08 (createActivity, deleteActivity, category enum)
- [ ] `tests/unit/kids/recurrence.test.ts` — stubs for KIDS-04 (generateOccurrences for kid_activities)
- [ ] `tests/unit/kids/reminder.test.ts` — stubs for KIDS-05 (reminder offset → remindAt timestamp calculation)
- [ ] `tests/unit/calendar/groupByDay.test.ts` — stubs for CAL-04 (groupEventsByDay utility)
- [ ] `tests/unit/calendar/merge.test.ts` — stubs for CAL-01, CAL-02, CAL-03 (CalendarEvent merge, MODULE_COLOURS, href values)

Existing infrastructure: `vitest.config.ts` exists and configured. No new framework install required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Month calendar grid renders correctly with event dots | KIDS-06, CAL-04 | Visual rendering | Navigate to `/calendar`, verify month grid shows today, events appear as coloured dots with short labels |
| Week view time-slot layout renders correctly | CAL-04 | Visual rendering | Toggle to week view, verify 7 columns with hourly rows and events placed at correct times |
| "+N more" overflow expands correctly | CAL-04 | Interactive UI | Add 3+ activities on the same day, verify "+1 more" appears and click expands to show all |
| Click calendar event navigates to source | CAL-03 | Navigation | Click a chore event → lands on `/chores`; click a kids activity → lands on `/kids` |
| Child tabs filter correctly | KIDS-06 | Interactive UI | Navigate to `/kids`, click a child tab, verify only that child's activities show |
| View toggle persists across refresh | CAL-04 | URL state | Switch to calendar view, refresh page, verify calendar view is preserved |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
