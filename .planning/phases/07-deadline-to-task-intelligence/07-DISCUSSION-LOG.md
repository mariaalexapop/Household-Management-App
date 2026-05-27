# Phase 7: Deadline-to-Task Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 07-deadline-to-task-intelligence
**Areas discussed:** Timeline separation, Suggestion persistence, Task templates, Dismiss & snooze behavior

---

## Timeline Separation

| Option | Description | Selected |
|--------|-------------|----------|
| Tasks only | Only chores and kids activities appear as rows. Car/insurance/electronics deadlines removed entirely — they only surface as suggestions in the sidebar. | ✓ |
| Tasks + payment rows | Chores, kids activities, AND insurance payment-due items with amounts. Car/electronics deadlines only as suggestions. | |
| Everything but styled differently | Keep all items but visually separate deadlines (dimmed, no checkbox) from actionable tasks. | |

**User's choice:** Tasks only
**Notes:** User also specified that overdue tasks should only appear in timeline if ≤14 days old. Older overdue items should go to a separate "Things you need to review" card.

---

## Suggestion Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Database-backed | Inngest job runs daily, checks deadlines, creates suggestion records in DB. Dismiss/snooze persists across sessions and devices. | ✓ |
| Client-side computed | Keep current approach: computed on each page load from deadline data. Simple but dismiss resets on reload. | |
| Hybrid | Compute suggestions client-side, but store dismiss/snooze state in a small DB table. | |

**User's choice:** Database-backed
**Notes:** Full DB persistence chosen for cross-device consistency.

---

## Task Templates

| Option | Description | Selected |
|--------|-------------|----------|
| Smart rewriting | Each deadline type gets an action-oriented template: MOT due → 'Book MOT for [car]', insurance expiry → 'Renew [insurer] [type] policy' | ✓ |
| AI-generated titles | Use Claude API to generate natural task titles. More flexible but adds API cost and latency. | |
| Direct pass-through | Use the deadline title as-is. Simple, no transformation. | |

**User's choice:** Smart rewriting
**Notes:** Static templates preferred over AI generation for simplicity and speed.

---

## Dismiss & Snooze Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Permanent dismiss per cycle | Dismissed for this deadline cycle. If same deadline comes back next year, new suggestion appears. | ✓ |
| Snooze for 7 days | Suggestion reappears after 7 days. Good for 'not now' situations. | |
| Both options available | User sees 'Dismiss' (permanent) and 'Snooze' (7d). Two buttons per suggestion. | |

**User's choice:** Permanent dismiss per cycle
**Notes:** Keep it simple — no snooze complexity.

---

## Claude's Discretion

- Suggestion card visual design
- Days-before-deadline threshold for generating suggestions
- Inngest scheduling frequency
- DB schema details

## Deferred Ideas

- AI-generated task titles
- Snooze functionality
- Push notification for new suggestions
