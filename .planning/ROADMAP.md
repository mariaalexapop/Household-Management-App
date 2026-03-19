# Roadmap: Household Management App

**Project:** AI-powered household OS
**Core Value:** The AI that turns fragmented household data into automated harmony — so nothing gets forgotten, costs stay visible, and maintenance never becomes a crisis.
**Created:** 2026-03-19
**Granularity:** Standard (7 phases)
**Coverage:** 59/59 v1 requirements mapped

---

## Phases

- [ ] **Phase 1: Foundation** - Auth, household membership, real-time infrastructure, and GDPR data isolation
- [ ] **Phase 2: Tasks & Chores** - Full task and chore management with recurring schedules and notifications
- [ ] **Phase 3: Financials Core** - Manual expense logging, bill tracking, and spending dashboards
- [ ] **Phase 4: AI Document Intelligence** - Receipt OCR, warranty scanning, and async document processing pipeline
- [ ] **Phase 5: AI Assistant** - Chat assistant with tool-calling and ambient dashboard intelligence
- [ ] **Phase 6: Maintenance & Warranties** - Appliance registry, maintenance scheduling, and AI cross-linking
- [ ] **Phase 7: Platform & Polish** - Mobile responsiveness, camera UX, PWA, and performance audit

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Tasks & Chores | 0/TBD | Not started | - |
| 3. Financials Core | 0/TBD | Not started | - |
| 4. AI Document Intelligence | 0/TBD | Not started | - |
| 5. AI Assistant | 0/TBD | Not started | - |
| 6. Maintenance & Warranties | 0/TBD | Not started | - |
| 7. Platform & Polish | 0/TBD | Not started | - |

---

## Phase Details

### Phase 1: Foundation

**Goal**: Household members can securely create accounts, form a household, and all data is isolated by household with real-time sync in place and GDPR-compliant infrastructure from day one.

**Depends on**: Nothing — this is the prerequisite for every subsequent phase.

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, HSLD-01, HSLD-02, HSLD-03, HSLD-04, HSLD-05, HSLD-06, HSLD-07, PLAT-01, PLAT-02, PLAT-04, PLAT-05

**Success Criteria** (what must be TRUE when this phase completes):
  1. A new user can sign up with email/password or Google/Apple OAuth, verify their email, reset a forgotten password, and stay logged in across browser refresh.
  2. A user can create a household, invite another person via a shareable link or email, and the invited person can join — both then see each other listed as members.
  3. When any household member makes a change, all other members see it update in their browser within seconds without refreshing the page.
  4. The app displays a "reconnecting" indicator when the real-time connection drops, and resumes normal sync when reconnected.
  5. All data is stored in EU infrastructure; a user can request deletion of their personal data and it is removed.

**Plans**: TBD

---

### Phase 2: Tasks & Chores

**Goal**: Any household member can create, assign, and complete shared tasks and chores — including recurring ones — and receive timely notifications so nothing gets forgotten.

**Depends on**: Phase 1 (household membership, Realtime, Inngest worker infrastructure).

**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10

**Success Criteria** (what must be TRUE when this phase completes):
  1. A user can create a task with title, description, assignee, due date, and category — and all household members immediately see it without refreshing.
  2. A user can mark a task complete; if it is recurring, the next occurrence appears automatically at the correct interval.
  3. A user assigned a task receives an in-app notification and a push notification when it is upcoming or overdue — without being asked for push permission on first load.
  4. Any household member can view, edit, and delete any task regardless of who created it.

**Plans**: TBD

---

### Phase 3: Financials Core

**Goal**: The household has a shared, accurate picture of all expenses and upcoming bills — entered manually — with a spending dashboard that shows where money goes.

**Depends on**: Phase 1 (RLS, household context), Phase 2 (Inngest proven for bill reminder jobs).

**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-05, EXPN-06

**Success Criteria** (what must be TRUE when this phase completes):
  1. A user can manually log an expense with amount, category, date, merchant, and payer — and all household members see it immediately.
  2. A user can add a recurring bill with a due date; they receive an in-app and push reminder a configurable number of days before it is due, and can mark it paid to build a payment history.
  3. A user can view all household expenses filtered by category, date range, and member — and a dashboard shows total spend by category and month-on-month trends.
  4. A user can create and manage custom expense categories that persist across all household members (stored in DB, not hardcoded).

**Plans**: TBD

---

### Phase 4: AI Document Intelligence

**Goal**: A user can photograph a receipt or warranty document and the AI extracts structured data asynchronously — always requiring user review before saving.

**Depends on**: Phase 1 (RLS, Supabase Storage, Inngest), Phase 2 (notification infrastructure), Phase 3 (expenses table, categories).

**Requirements**: AIDOC-01, AIDOC-02, AIDOC-03, AIDOC-04, AIDOC-05, AIDOC-06

**Success Criteria** (what must be TRUE when this phase completes):
  1. A user can photograph a receipt; the app immediately returns a "processing" state and sends a notification when parsing is complete — the user never waits on the camera screen.
  2. After OCR completes, the user sees a structured draft (merchant, date, total, line items) and must confirm before the expense is saved — it is never auto-saved.
  3. A user can upload a warranty document (photo or PDF) and AI extracts product name, purchase date, expiry date, and coverage summary into a reviewable draft.
  4. A user can upload any household document and AI categorises it and extracts relevant fields — following the same async review flow.
  5. When AI extraction confidence is low, the user sees the raw extracted text alongside the fields and is prompted to fill gaps manually.

**Plans**: TBD

---

### Phase 5: AI Assistant

**Goal**: The household has two AI surfaces: a chat assistant that answers accurate questions by querying real data, and ambient dashboard cards that surface proactive insights without user action.

**Depends on**: Phase 1–4 (full data model populated; spend anomaly detection requires financial baseline from Phase 3).

**Requirements**: AICH-01, AICH-02, AICH-03, AICH-04, AIAMB-01, AIAMB-02, AIAMB-03, AIAMB-04

**Success Criteria** (what must be TRUE when this phase completes):
  1. A user can ask "how much did we spend on food last month?" and receive an accurate answer drawn from the database — never a hallucinated figure.
  2. A user can instruct the chat assistant via natural language to create a task or log an expense, and it executes the action.
  3. Conversation history persists per household so users can refer back to prior exchanges.
  4. The dashboard displays AI-generated suggestion cards (e.g. "Your boiler was last serviced 11 months ago") that were generated as a background job — not computed on page load.
  5. The dashboard shows a spend pattern alert when the household is significantly over typical spend for a category; users can dismiss individual cards.

**Plans**: TBD

---

### Phase 6: Maintenance & Warranties

**Goal**: The household has a complete appliance registry with expiry-tracked warranties, scheduled maintenance tasks, and AI that connects expiring warranties to maintenance actions before it is too late.

**Depends on**: Phase 4 (warranty document pipeline already built and reusable).

**Requirements**: MAINT-01, MAINT-02, MAINT-03, MAINT-04, MAINT-05, MAINT-06

**Success Criteria** (what must be TRUE when this phase completes):
  1. A user can add an appliance to a household registry with name, brand, model number, and purchase date.
  2. When a warranty document is scanned via OCR, it automatically populates the corresponding appliance in the registry — no duplicate data entry.
  3. A user receives a reminder 30 days before a warranty expires.
  4. A user can create a recurring maintenance task for an appliance (e.g. "Annual boiler service") and receives a reminder when it is due.
  5. When a warranty is approaching expiry, the AI suggests scheduling a maintenance check — surfaced as an ambient dashboard card.

**Plans**: TBD

---

### Phase 7: Platform & Polish

**Goal**: The app is genuinely usable on phone browsers with camera support, meets PWA standards, and performs reliably under real-world conditions.

**Depends on**: All prior phases (polishes the complete product).

**Requirements**: PLAT-03

**Success Criteria** (what must be TRUE when this phase completes):
  1. The app is usable on phone browsers at all screen sizes — all primary flows (logging expenses, completing tasks, scanning receipts) work without horizontal scrolling or broken layouts.
  2. The camera flow for receipt and warranty OCR works on both iOS Safari and Android Chrome browsers without requiring a native app.
  3. The app meets PWA installability criteria (manifest, service worker) and can be added to a home screen.

**Plans**: TBD

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| HSLD-01 | Phase 1 | Pending |
| HSLD-02 | Phase 1 | Pending |
| HSLD-03 | Phase 1 | Pending |
| HSLD-04 | Phase 1 | Pending |
| HSLD-05 | Phase 1 | Pending |
| HSLD-06 | Phase 1 | Pending |
| HSLD-07 | Phase 1 | Pending |
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-04 | Phase 1 | Pending |
| PLAT-05 | Phase 1 | Pending |
| TASK-01 | Phase 2 | Pending |
| TASK-02 | Phase 2 | Pending |
| TASK-03 | Phase 2 | Pending |
| TASK-04 | Phase 2 | Pending |
| TASK-05 | Phase 2 | Pending |
| TASK-06 | Phase 2 | Pending |
| TASK-07 | Phase 2 | Pending |
| TASK-08 | Phase 2 | Pending |
| TASK-09 | Phase 2 | Pending |
| TASK-10 | Phase 2 | Pending |
| BILL-01 | Phase 3 | Pending |
| BILL-02 | Phase 3 | Pending |
| BILL-03 | Phase 3 | Pending |
| BILL-04 | Phase 3 | Pending |
| BILL-05 | Phase 3 | Pending |
| EXPN-01 | Phase 3 | Pending |
| EXPN-02 | Phase 3 | Pending |
| EXPN-03 | Phase 3 | Pending |
| EXPN-04 | Phase 3 | Pending |
| EXPN-05 | Phase 3 | Pending |
| EXPN-06 | Phase 3 | Pending |
| AIDOC-01 | Phase 4 | Pending |
| AIDOC-02 | Phase 4 | Pending |
| AIDOC-03 | Phase 4 | Pending |
| AIDOC-04 | Phase 4 | Pending |
| AIDOC-05 | Phase 4 | Pending |
| AIDOC-06 | Phase 4 | Pending |
| AICH-01 | Phase 5 | Pending |
| AICH-02 | Phase 5 | Pending |
| AICH-03 | Phase 5 | Pending |
| AICH-04 | Phase 5 | Pending |
| AIAMB-01 | Phase 5 | Pending |
| AIAMB-02 | Phase 5 | Pending |
| AIAMB-03 | Phase 5 | Pending |
| AIAMB-04 | Phase 5 | Pending |
| MAINT-01 | Phase 6 | Pending |
| MAINT-02 | Phase 6 | Pending |
| MAINT-03 | Phase 6 | Pending |
| MAINT-04 | Phase 6 | Pending |
| MAINT-05 | Phase 6 | Pending |
| MAINT-06 | Phase 6 | Pending |
| PLAT-03 | Phase 7 | Pending |

**Total v1 requirements: 59**
**Mapped: 59/59**
**Unmapped: 0**

---

*Roadmap created: 2026-03-19*
