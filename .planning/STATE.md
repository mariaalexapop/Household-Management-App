# Project State: Household Management App

**Last updated:** 2026-03-19
**Session:** Roadmap creation

---

## Project Reference

**Core Value:** The AI that turns fragmented household data into automated harmony — so nothing gets forgotten, costs stay visible, and maintenance never becomes a crisis.

**Stack:** Next.js 15 (App Router) + TypeScript 5 + Supabase (Postgres, Auth, Realtime, Storage) + Drizzle ORM + Vercel AI SDK + Anthropic Claude + Inngest + Tailwind CSS 4 + shadcn/ui

**Repo:** /Users/alexandrapop/Warp_project/Household-Management-App

---

## Current Position

**Current Phase:** Not started
**Current Plan:** None
**Status:** Roadmap created — ready to plan Phase 1

**Progress:**

```
Phase 1: Foundation            [ ] Not started
Phase 2: Tasks & Chores        [ ] Not started
Phase 3: Financials Core       [ ] Not started
Phase 4: AI Document Intel     [ ] Not started
Phase 5: AI Assistant          [ ] Not started
Phase 6: Maintenance           [ ] Not started
Phase 7: Platform & Polish     [ ] Not started
```

Overall: 0/7 phases complete

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 7 |
| Requirements total (v1) | 59 |
| Requirements mapped | 59/59 |
| Plans created | 0 |
| Plans complete | 0 |
| Phases complete | 0 |

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Supabase EU region chosen at project creation | GDPR compliance; cannot migrate later without data movement |
| RLS on every table from day one | Multi-tenant data isolation; not safely retrofittable |
| All AI pipelines async via Inngest | Claude P99 latency (10-30s) exceeds Vercel's 10s default timeout |
| OCR output always requires review before save | Trust preservation; one silent bad write destroys user trust |
| Chat assistant uses tool-calling for financial queries | LLM must never recall financial figures from memory |
| Ambient AI cards cached and batch-generated | Per-page-load Claude calls would make costs unviable |
| expense_categories stored as DB table, not enum | Household-level customisation; locked in from Phase 3 |
| tasks use RRULE strings for recurrence | Avoids bespoke recurrence schema; standard format |
| PLAT-01/02/04/05 assigned to Phase 1 | Real-time sync and GDPR compliance are foundational, not polish |
| PLAT-03 (mobile-responsive) assigned to Phase 7 | Responsive polish is a finishing step, not a prerequisite |
| Open banking deferred to v2 | Regulatory complexity (FCA) + demand validation via OCR first |

### Architecture Flags (verify before implementation)

- Supabase Realtime respects RLS — verify current docs before Phase 1 complete
- Inngest delayed steps for warranty reminders — verify current Inngest API before Phase 4
- Claude Vision OCR cost/accuracy — benchmark against real receipt samples before Phase 4 begins
- Model number → user manual retrieval — feasibility spike required before committing in Phase 6
- TrueLayer/Plaid webhook format — verify official docs before any banking work (v2)

### Todos

- [ ] Plan Phase 1 (`/gsd:plan-phase 1`)

### Blockers

None.

---

## Session Continuity

**To resume:** Run `/gsd:plan-phase 1` to decompose Phase 1 into executable plans.

**Context for next session:**
- Roadmap is complete with 59 requirements across 7 phases
- Phase 1 is the prerequisite for everything: Auth, Household Core, Realtime, RLS, GDPR setup
- The most critical constraint across the entire project: RLS and EU data residency must be locked in during Phase 1 — they cannot be retrofitted
- Architecture research is in `.planning/research/` — ARCHITECTURE.md and SUMMARY.md are the primary references
- Config is in `.planning/config.json`: mode=yolo, granularity=standard, parallelization=true

---

*State initialised: 2026-03-19*
