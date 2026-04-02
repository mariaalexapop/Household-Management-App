---
phase: 2
slug: home-chores
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.2 + Playwright ^1.58.2 |
| **Config file** | `vitest.config.ts` (exists) + `playwright.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm test:e2e` |
| **Estimated runtime** | ~30 seconds (unit) / ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (unit only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | CHORE-07 | unit | `pnpm test tests/unit/chores/areas.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-01-02 | 01 | 1 | CHORE-01,02,03,04 | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-01-03 | 01 | 1 | CHORE-09 | integration | `pnpm test tests/unit/db/rls.test.ts` | ❌ Wave 0 (extend) | ⬜ pending |
| 2-02-01 | 02 | 2 | CHORE-01 | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-02-02 | 02 | 2 | CHORE-02 | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-02-03 | 02 | 2 | CHORE-03 | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-02-04 | 02 | 2 | CHORE-04 | unit | `pnpm test tests/unit/chores/tasks.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-03-01 | 03 | 2 | CHORE-05 | unit | `pnpm test tests/unit/chores/recurrence.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-03-02 | 03 | 2 | CHORE-06 | unit | `pnpm test tests/unit/chores/recurrence.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-04-01 | 04 | 2 | CHORE-08 | unit | `pnpm test tests/unit/chores/notifications.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-04-02 | 04 | 2 | CHORE-10 | unit (mock) | `pnpm test tests/unit/chores/notifications.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-05-01 | 05 | 3 | CHORE-09 | e2e | `pnpm test:e2e` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/chores/tasks.test.ts` — stubs for CHORE-01, CHORE-02, CHORE-03, CHORE-04
- [ ] `tests/unit/chores/recurrence.test.ts` — stubs for CHORE-05, CHORE-06 (pure date logic, no DB)
- [ ] `tests/unit/chores/areas.test.ts` — stubs for CHORE-07
- [ ] `tests/unit/chores/notifications.test.ts` — stubs for CHORE-08, CHORE-10
- [ ] Extend `tests/unit/db/rls.test.ts` with tasks + notifications table assertions (CHORE-09)
- [ ] Extend `tests/helpers/factories.ts` with `makeTestTask`, `makeTestChoreArea`, `makeTestNotification` helpers

*Wave 0 is Plan 02-01's first task — test stubs created before schema implementation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Realtime: task appears for all members without refresh | CHORE-01 | Requires two live browser sessions | Open app in two browsers as different household members; create task in one; verify it appears in the other within 3 seconds |
| In-app notification bell unread count | CHORE-08 | Requires Supabase Realtime in browser | Assign task to self in one session; verify bell count increments in real time |
| Inngest sleepUntil fires at correct time | CHORE-10 | Inngest timing is runtime-only | Use Inngest Dev Server UI to verify sleep function is scheduled at `starts_at - offset` |
| Email sent on task assignment | CHORE-08 | Resend delivery is external | Check Resend dashboard / test mailbox for assignment email after task creation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
