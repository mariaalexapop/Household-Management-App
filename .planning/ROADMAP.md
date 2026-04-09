# Roadmap: Household Management App

**Project:** Family household command centre with AI chatbot
**Core Value:** One place for families to track everything they own, owe, and need to do — with an AI chatbot that answers questions and turns documents into actionable tasks.
**Created:** 2026-03-24 (revised from 2026-03-19)
**Granularity:** Standard (6 phases)
**Coverage:** 75/75 v1 requirements mapped

---

## Phases

- [ ] **Phase 1: Foundation & Onboarding** - Auth, household setup, onboarding wizard, module-based dashboard, real-time infrastructure, GDPR
- [x] **Phase 2: Home Chores** - Task management, recurring chores, assignments, due date reminders, notifications
- [x] **Phase 3: Kids Activities** - Child profiles, activity tracking, unified calendar (CAL-01–04 pulled forward from Phase 4), reminders
- [ ] **Phase 4: Tracker Modules** - Car maintenance, insurance management, electronics registry, costs dashboard, calendar data extension
- [ ] **Phase 5: AI Chatbot & RAG** - Document embedding pipeline, pgvector RAG, chatbot, task creation from chat
- [ ] **Phase 6: Platform & Polish** - Mobile responsiveness, PWA, camera UX, performance audit

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Onboarding | 2/8 | In Progress|  |
| 2. Home Chores | 6/6 | Complete | 2026-04-03 |
| 3. Kids Activities | 6/6 | Complete | 2026-04-09 |
| 4. Tracker Modules | 0/TBD | Not started | - |
| 5. AI Chatbot & RAG | 0/TBD | Not started | - |
| 6. Platform & Polish | 0/TBD | Not started | - |

---

## Phase Details

### Phase 1: Foundation & Onboarding

**Goal:** A user can create an account, set up a household (choosing their household type and activating modules), invite members, and land on a personalised dashboard — with all infrastructure for real-time sync and GDPR compliance in place from day one.

**Depends on:** Nothing — prerequisite for every subsequent phase.

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ONBD-01, ONBD-02, ONBD-03, ONBD-04, HSLD-01, HSLD-02, HSLD-03, HSLD-04, HSLD-05, HSLD-06, HSLD-07, HSLD-08, PLAT-01, PLAT-02, PLAT-04, PLAT-05

**Success Criteria:**
1. A new user can sign up (email/password or Google OAuth), verify their email, and stay logged in across browser refresh.
2. A user completes onboarding: selects household type, activates at least one module, and sees a dashboard reflecting those choices.
3. A household admin can invite another person by email or link; the invitee creates an account and both see each other as members.
4. When any household member makes a change, all other members see it update in their browser within seconds without refreshing.
5. All data is stored in EU infrastructure; a user can request deletion of their personal data and it is removed.

**Plans:** 2/8 plans executed

Plans:
- [ ] 01-01-PLAN.md — Test scaffold (Vitest, Playwright, factory helpers) — Wave 1
- [ ] 01-02-PLAN.md — Project init (Next.js 15, pnpm, env, Supabase project + checkpoint) — Wave 1
- [ ] 01-03-PLAN.md — Drizzle schema (all 5 Phase 1 tables + RLS + migrations + RLS helper) — Wave 2
- [ ] 01-04-PLAN.md — Auth flows (signup, email verify, password reset, Google OAuth) — Wave 2
- [ ] 01-05-PLAN.md — Onboarding wizard (Zustand store, Server Action, 3 step pages, components) — Wave 2
- [ ] 01-06-PLAN.md — Module-based dashboard skeleton (Server Component, ModuleCard, DashboardGrid) — Wave 3
- [ ] 01-07-PLAN.md — Invite system (email + shareable link + accept flow + member removal) — Wave 3
- [ ] 01-08-PLAN.md — Real-time sync, reconnect indicator, activity feed, GDPR deletion — Wave 4

---

### Phase 2: Home Chores

**Goal:** Any household member can create, assign, and complete shared tasks and chores — including recurring ones — and receive timely reminders so nothing gets forgotten.

**Depends on:** Phase 1 (household membership, real-time, notifications infrastructure).

**Requirements:** CHORE-01, CHORE-02, CHORE-03, CHORE-04, CHORE-05, CHORE-06, CHORE-07, CHORE-08, CHORE-09, CHORE-10

**Success Criteria:**
1. A user can create a task with title, description, category, assignee, and due date — all household members see it immediately without refreshing.
2. A user can mark a task complete; if recurring, the next occurrence appears automatically at the correct interval.
3. A user assigned a task receives an in-app and push notification immediately and a configurable reminder before the due date.
4. Any household member can view, edit, and delete any task regardless of who created it.

**Plans:** 1/6 plans executed

---

### Phase 3: Kids Activities

**Goal:** Parents can track all activities and commitments for their children in one place, with a shared unified calendar (chores + kids) and timely reminders — without children needing their own accounts.

**Depends on:** Phase 1 (household context, notifications), Phase 2 (notifications infrastructure proven).

**Note:** CAL-01 to CAL-04 (unified calendar) are delivered in this phase, not Phase 4. The calendar is built with Phase 4 extension points — Phase 4 adds car/insurance/electronics data to the existing component.

**Requirements:** KIDS-01, KIDS-02, KIDS-03, KIDS-04, KIDS-05, KIDS-06, KIDS-07, KIDS-08, CAL-01, CAL-02, CAL-03, CAL-04

**Success Criteria:**
1. A user can add child profiles (name only — no account required for children).
2. A user can add an activity for a child with title, date/time, location, category, and assignee; the activity is visible to all household members immediately.
3. A user receives a configurable reminder before a child's activity (assignee only).
4. A user can view a unified calendar showing chores and kids activities, in month or week view, with each module in a distinct colour.

**Plans:** 6 plans

Plans:
- [x] 03-01-PLAN.md — Schema + migration (children + kid_activities tables, RLS) — Wave 1
- [x] 03-02-PLAN.md — Server Actions (createChild, createActivity, updateActivity, deleteActivity) — Wave 2
- [x] 03-03-PLAN.md — Inngest jobs (generate-activity-recurrence, send-activity-reminder) — Wave 2
- [x] 03-04-PLAN.md — Kids UI (/kids page, KidsClient, ActivityList, ActivityForm, ChildTabs) — Wave 3
- [x] 03-05-PLAN.md — Calendar types + data layer (CalendarEvent type, /calendar page, parallel queries) — Wave 3
- [x] 03-06-PLAN.md — Calendar UI + dashboard card (UnifiedCalendar, month/week views, KidsDashboardCard) — Wave 4

---

### Phase 4: Tracker Modules

**Goal:** The household can track cars, insurance policies, and electronics — with document uploads, cost logging, key date reminders, and those events integrated into the existing Phase 3 calendar.

**Depends on:** Phase 1 (household, storage, notifications), Phase 3 (calendar component built and extensible).

**Requirements:** CAR-01, CAR-02, CAR-03, CAR-04, CAR-05, CAR-06, INS-01, INS-02, INS-03, INS-04, INS-05, INS-06, ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-06, COST-01, COST-02, COST-03

**Success Criteria:**
1. A user can add multiple cars with service history, set MOT/tax/service reminders, and receive reminders before key dates.
2. A user can add insurance policies with uploaded PDFs, premium cost schedules, and receives reminders before expiry and payment dates.
3. A user can add electronics items with warranty documents, receives a 30-day expiry reminder, and can upload user manuals.
4. A user can view a basic costs dashboard showing costs across car services, insurance premiums, and electronics — broken down by section and period.
5. Car, insurance, and electronics events appear in the existing unified calendar component (orange, purple, teal).

**Plans:** TBD

---

### Phase 5: AI Chatbot & RAG

**Goal:** The household AI chatbot can answer questions about uploaded documents (insurance policies, user manuals) and live household data, and can convert document-extracted procedures into user-editable tasks.

**Depends on:** Phase 1 (Inngest, Supabase), Phase 4 (documents uploaded, electronics and insurance modules with PDFs).

**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, INS-07, INS-08, INS-09, ELEC-05

**Success Criteria:**
1. A user can ask the chatbot a question about an uploaded insurance policy (e.g. "what do I do if my pipe bursts?") and receive an accurate answer drawn from the document — not hallucinated.
2. A user can ask the chatbot a question about an appliance using its uploaded manual (e.g. "how do I reset my Bosch dishwasher?") and receive an accurate answer.
3. The chatbot extracts a step-by-step procedure from a policy document, presents the steps to the user, and creates the selected steps as tasks in the chosen section.
4. The chatbot can answer questions about live household data (e.g. upcoming reminders, warranty expiries).
5. Conversation history persists per household.
6. Documents are processed asynchronously — user is notified when a document is ready for chatbot queries.

**Plans:** TBD

---

### Phase 6: Platform & Polish

**Goal:** The app is genuinely usable on phone browsers, meets PWA standards, and performs reliably under real-world conditions.

**Depends on:** All prior phases (polishes the complete product).

**Requirements:** PLAT-03

**Success Criteria:**
1. All primary flows (managing tasks, viewing calendar, scanning documents, chatting) work on phone browsers without horizontal scrolling or broken layouts.
2. The app meets PWA installability criteria (manifest, service worker) and can be added to a home screen.

**Plans:** TBD

---

## v2 Roadmap (post-MVP)

| Phase | Focus |
|-------|-------|
| v2 Phase 1 | Receipt OCR + expense draft review flow |
| v2 Phase 2 | Bank / Revolut integrations + transaction auto-import |
| v2 Phase 3 | Spending dashboards + spend pattern AI alerts |
| v2 Phase 4 | Model number → auto-fetch user manuals (ELEC-V2-01) |
| v2 Phase 5 | Ambient AI dashboard cards + monthly household summary |
| v2 Phase 6 | Native iOS + Android apps |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| ONBD-01 | Phase 1 | Pending |
| ONBD-02 | Phase 1 | Pending |
| ONBD-03 | Phase 1 | Pending |
| ONBD-04 | Phase 1 | Pending |
| HSLD-01 | Phase 1 | Pending |
| HSLD-02 | Phase 1 | Pending |
| HSLD-03 | Phase 1 | Pending |
| HSLD-04 | Phase 1 | Pending |
| HSLD-05 | Phase 1 | Pending |
| HSLD-06 | Phase 1 | Pending |
| HSLD-07 | Phase 1 | Pending |
| HSLD-08 | Phase 1 | Pending |
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-04 | Phase 1 | Pending |
| PLAT-05 | Phase 1 | Pending |
| CHORE-01 | Phase 2 | Pending |
| CHORE-02 | Phase 2 | Pending |
| CHORE-03 | Phase 2 | Pending |
| CHORE-04 | Phase 2 | Pending |
| CHORE-05 | Phase 2 | Pending |
| CHORE-06 | Phase 2 | Pending |
| CHORE-07 | Phase 2 | Pending |
| CHORE-08 | Phase 2 | Complete |
| CHORE-09 | Phase 2 | Complete |
| CHORE-10 | Phase 2 | Complete |
| KIDS-01 | Phase 3 | Complete |
| KIDS-02 | Phase 3 | Complete |
| KIDS-03 | Phase 3 | Complete |
| KIDS-04 | Phase 3 | Complete |
| KIDS-05 | Phase 3 | Complete |
| KIDS-06 | Phase 3 | Complete |
| KIDS-07 | Phase 3 | Complete |
| KIDS-08 | Phase 3 | Complete |
| CAL-01 | Phase 3 | Complete |
| CAL-02 | Phase 3 | Complete |
| CAL-03 | Phase 3 | Complete |
| CAL-04 | Phase 3 | Complete |
| CAR-01 | Phase 4 | Pending |
| CAR-02 | Phase 4 | Pending |
| CAR-03 | Phase 4 | Pending |
| CAR-04 | Phase 4 | Pending |
| CAR-05 | Phase 4 | Pending |
| CAR-06 | Phase 4 | Pending |
| INS-01 | Phase 4 | Pending |
| INS-02 | Phase 4 | Pending |
| INS-03 | Phase 4 | Pending |
| INS-04 | Phase 4 | Pending |
| INS-05 | Phase 4 | Pending |
| INS-06 | Phase 4 | Pending |
| ELEC-01 | Phase 4 | Pending |
| ELEC-02 | Phase 4 | Pending |
| ELEC-03 | Phase 4 | Pending |
| ELEC-04 | Phase 4 | Pending |
| ELEC-06 | Phase 4 | Pending |
| COST-01 | Phase 4 | Pending |
| COST-02 | Phase 4 | Pending |
| COST-03 | Phase 4 | Pending |
| AI-01 | Phase 5 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| AI-04 | Phase 5 | Pending |
| AI-05 | Phase 5 | Pending |
| AI-06 | Phase 5 | Pending |
| AI-07 | Phase 5 | Pending |
| INS-07 | Phase 5 | Pending |
| INS-08 | Phase 5 | Pending |
| INS-09 | Phase 5 | Pending |
| ELEC-05 | Phase 5 | Pending |
| PLAT-03 | Phase 6 | Pending |

**Total v1 requirements: 75**
**Mapped: 75/75**
**Unmapped: 0**

---

*Roadmap created: 2026-03-24*
*Replaces prior roadmap created 2026-03-19 — full concept revision*
*Phase 1 plans created: 2026-03-24*
*Phase 1 revised: 2026-03-24 — fixed plan checker blockers, split 01-05 into wizard (01-05) + dashboard (01-06), renumbered invite→01-07 and realtime→01-08, total plans 7→8*
*Phase 3 plans created: 2026-04-07 — CAL-01–04 pulled forward from Phase 4 per 03-CONTEXT.md; 6 plans across 4 waves*
