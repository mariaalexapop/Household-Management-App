# Requirements: Household Management App

**Defined:** 2026-03-24
**Core Value:** One place for families to track everything they own, owe, and need to do — with an AI chatbot that answers questions and turns documents into actionable tasks.

---

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User can sign up and log in with Google OAuth
- [ ] **AUTH-05**: User session persists across browser refresh

### Onboarding (ONBD)

- [ ] **ONBD-01**: User selects household type during initial setup (couple / family with kids / flatmates / single-living)
- [ ] **ONBD-02**: User selects which modules to activate during setup (multi-select: Home Chores / Car Maintenance / Insurance / Electronics / Kids Activities)
- [ ] **ONBD-03**: Dashboard is generated based on selected modules
- [ ] **ONBD-04**: User can add or remove modules from settings at any time after setup

### Household (HSLD)

- [ ] **HSLD-01**: User who creates a household becomes the household admin
- [ ] **HSLD-02**: Admin can invite members by email
- [ ] **HSLD-03**: Admin can generate a shareable invite link
- [ ] **HSLD-04**: Invited person receives an email and joins by creating an account
- [ ] **HSLD-05**: All members can view all other household members
- [ ] **HSLD-06**: User can set their display name and avatar
- [ ] **HSLD-07**: Admin can remove a member from the household
- [ ] **HSLD-08**: User can view a household activity feed (who did what, when)

### Home Chores (CHORE)

- [ ] **CHORE-01**: User can create a task with title, description, category, assignee, and due date
- [ ] **CHORE-02**: User can assign a task to any household member (including themselves)
- [ ] **CHORE-03**: User can mark a task as complete
- [ ] **CHORE-04**: User can edit and delete tasks
- [ ] **CHORE-05**: User can create recurring tasks (daily / weekly / monthly / custom frequency)
- [ ] **CHORE-06**: Recurring tasks auto-regenerate on completion
- [ ] **CHORE-07**: User can organise tasks into categories (e.g. Cleaning, Garden, Admin)
- [ ] **CHORE-08**: User receives in-app and push notification when a task is assigned to them
- [ ] **CHORE-09**: All household members can view and edit all tasks
- [ ] **CHORE-10**: User receives a configurable reminder before a task's due date (in-app and push)

### Car Maintenance (CAR)

- [ ] **CAR-01**: User can add multiple cars per household (make, model, year, plate, colour)
- [ ] **CAR-02**: User can log a service record per car (date, type, mileage, garage, cost [optional])
- [ ] **CAR-03**: User can set key date reminders per car: MOT/inspection due, road tax renewal, next service due
- [ ] **CAR-04**: User receives a reminder X days before a key date (configurable per reminder)
- [ ] **CAR-05**: User can edit and delete cars and service records
- [ ] **CAR-06**: User can view full service history per car

### Insurance Management (INS)

- [ ] **INS-01**: User can add a policy with type (home / car / health / life / travel / other), insurer, policy number, expiry date, and renewal contact details
- [ ] **INS-02**: User can upload policy documents (PDF)
- [ ] **INS-03**: User can log premium costs with payment schedule (annual / quarterly / monthly) and next payment date
- [ ] **INS-04**: User receives a reminder X days before a policy expires (configurable)
- [ ] **INS-05**: User receives a reminder before a premium payment is due
- [ ] **INS-06**: User can edit and delete policies
- [ ] **INS-07**: Chatbot can answer questions about a policy by querying its uploaded document (RAG)
- [ ] **INS-08**: Chatbot can extract a step-by-step procedure from a policy document and offer to create tasks
- [ ] **INS-09**: User selects which steps to add as tasks, confirms the target section (default: Chores), and tasks appear there for editing

### Electronics Management (ELEC)

- [ ] **ELEC-01**: User can add an item to the electronics registry (name, brand, model number, purchase date, cost [optional])
- [ ] **ELEC-02**: User can upload a warranty document and record expiry date and coverage summary
- [ ] **ELEC-03**: User receives a reminder 30 days before a warranty expires
- [ ] **ELEC-04**: User can upload a user manual (PDF) for any item
- [ ] **ELEC-05**: Chatbot can answer questions about an item using its uploaded manual (RAG)
- [ ] **ELEC-06**: User can edit and delete items and their associated documents

### Kids Activities (KIDS)

- [ ] **KIDS-01**: User can create child profiles (name, date of birth) — no account, parent-managed only
- [ ] **KIDS-02**: User can add multiple children to the household
- [ ] **KIDS-03**: User can add an activity for a child (title, child, date/time, location, category, responsible parent)
- [ ] **KIDS-04**: User can create recurring activities
- [ ] **KIDS-05**: User receives a reminder X hours/days before an activity (configurable)
- [ ] **KIDS-06**: User can view a calendar of all kids activities across all children
- [ ] **KIDS-07**: User can edit and delete activities and child profiles
- [ ] **KIDS-08**: Activity categories: school / medical / sport / hobby / social

### AI Chatbot & RAG (AI)

- [ ] **AI-01**: User can chat with a household assistant accessible from any section of the app
- [ ] **AI-02**: Chatbot queries uploaded documents (insurance policies, user manuals, warranty docs) via RAG (pgvector similarity search)
- [ ] **AI-03**: Documents are processed asynchronously — user is notified when the document is ready for chatbot queries
- [ ] **AI-04**: Chatbot can answer questions about live household data (upcoming reminders, task status, warranty expiries)
- [ ] **AI-05**: Chatbot presents extracted procedure steps from a document and asks if the user wants to create tasks
- [ ] **AI-06**: User selects which steps to add as tasks, picks the target section, and the tasks appear there for editing
- [ ] **AI-07**: Conversation history is persisted per household

### Costs (COST)

- [ ] **COST-01**: Cost is an optional field on: car service records, insurance premium logs, and electronics registry items
- [ ] **COST-02**: User can view a basic costs dashboard aggregating all recorded costs across sections
- [ ] **COST-03**: Costs dashboard shows breakdown by section and by month / year

### Calendar (CAL)

- [ ] **CAL-01**: A unified calendar aggregates all date-tied items across activated modules: chore due dates, car key dates (MOT, tax, service), insurance expiry and payment dates, electronics warranty expiries, and kids activities
- [ ] **CAL-02**: Each module is represented by a distinct colour in the calendar (Chores: blue / Car: orange / Insurance: purple / Electronics: teal / Kids: green)
- [ ] **CAL-03**: User can click any calendar item to navigate directly to it in its source section
- [ ] **CAL-04**: Calendar supports month view and week view

### Platform & Real-Time (PLAT)

- [ ] **PLAT-01**: All household data syncs in real-time across all members without page refresh
- [ ] **PLAT-02**: App shows a reconnecting indicator when the real-time connection drops
- [ ] **PLAT-03**: App is mobile-responsive and usable on phone browsers
- [ ] **PLAT-04**: User data is stored in EU infrastructure (GDPR compliance)
- [ ] **PLAT-05**: User can request deletion of their personal data (right to erasure)

---

## v2 Requirements

### Financial Intelligence

- **FIN-01**: User can photograph a receipt and AI parses it into a categorised expense (OCR + LLM)
- **FIN-02**: User reviews and confirms the AI-parsed expense before it is saved (never auto-saved)
- **FIN-03**: User can connect a bank or card account (Revolut, TrueLayer, Plaid) for automatic transaction import
- **FIN-04**: Transactions are automatically imported and categorised from connected accounts
- **FIN-05**: User can view a household spending dashboard (total by category and by period)
- **FIN-06**: User can view spending trends over time (month-on-month comparison)
- **FIN-07**: AI generates spend pattern alerts when household spending significantly exceeds typical patterns

### Electronics — Extended

- **ELEC-V2-01**: User can enter a model number and AI retrieves the user manual and product information automatically (no manual upload required)

### Advanced AI

- **AI-V2-01**: AI generates a monthly household summary report
- **AI-V2-02**: Ambient AI dashboard cards surface proactive insights as background jobs (e.g. "Your boiler was last serviced 11 months ago")
- **AI-V2-03**: User can dismiss individual AI suggestion cards

### Mobile Apps

- **MOB-01**: Native iOS app
- **MOB-02**: Native Android app

---

## Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Receipt scanning / OCR | Deferred to v2; manual tracking is sufficient for MVP |
| Bank / Revolut integrations | Regulatory and cost implications; validate demand via manual tracking first |
| Spending dashboards from transactions | Depends on bank integrations; deferred to v2 |
| Role-based permissions (beyond admin for household management) | Full content equality in v1; RBAC adds complexity without clear MVP value |
| Expense settlement / debt tracking | Splitwise does this well; out of scope permanently |
| Smart home integrations (Alexa, Google Home) | Low v1 demand; AI chatbot covers use cases without integration |
| Investment / asset tracking | Distinct domain; out of scope permanently |
| Contractor / marketplace booking | Third-party complexity; out of scope permanently |
| Gamification (points, badges) | Out of target user model |
| Native mobile apps | Web-first; mobile apps are a v2 milestone |
| Multi-household per user | Single active household per user in v1; v2 for property managers |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1: Foundation & Onboarding | Pending |
| AUTH-02 | Phase 1: Foundation & Onboarding | Pending |
| AUTH-03 | Phase 1: Foundation & Onboarding | Pending |
| AUTH-04 | Phase 1: Foundation & Onboarding | Pending |
| AUTH-05 | Phase 1: Foundation & Onboarding | Pending |
| ONBD-01 | Phase 1: Foundation & Onboarding | Pending |
| ONBD-02 | Phase 1: Foundation & Onboarding | Pending |
| ONBD-03 | Phase 1: Foundation & Onboarding | Pending |
| ONBD-04 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-01 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-02 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-03 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-04 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-05 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-06 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-07 | Phase 1: Foundation & Onboarding | Pending |
| HSLD-08 | Phase 1: Foundation & Onboarding | Pending |
| PLAT-01 | Phase 1: Foundation & Onboarding | Pending |
| PLAT-02 | Phase 1: Foundation & Onboarding | Pending |
| PLAT-04 | Phase 1: Foundation & Onboarding | Pending |
| PLAT-05 | Phase 1: Foundation & Onboarding | Pending |
| CHORE-01 | Phase 2: Home Chores | Pending |
| CHORE-02 | Phase 2: Home Chores | Pending |
| CHORE-03 | Phase 2: Home Chores | Pending |
| CHORE-04 | Phase 2: Home Chores | Pending |
| CHORE-05 | Phase 2: Home Chores | Pending |
| CHORE-06 | Phase 2: Home Chores | Pending |
| CHORE-07 | Phase 2: Home Chores | Pending |
| CHORE-08 | Phase 2: Home Chores | Pending |
| CHORE-09 | Phase 2: Home Chores | Pending |
| CHORE-10 | Phase 2: Home Chores | Pending |
| KIDS-01 | Phase 3: Kids Activities | Pending |
| KIDS-02 | Phase 3: Kids Activities | Pending |
| KIDS-03 | Phase 3: Kids Activities | Pending |
| KIDS-04 | Phase 3: Kids Activities | Pending |
| KIDS-05 | Phase 3: Kids Activities | Pending |
| KIDS-06 | Phase 3: Kids Activities | Pending |
| KIDS-07 | Phase 3: Kids Activities | Pending |
| KIDS-08 | Phase 3: Kids Activities | Pending |
| CAR-01 | Phase 4: Tracker Modules & Calendar | Pending |
| CAR-02 | Phase 4: Tracker Modules & Calendar | Pending |
| CAR-03 | Phase 4: Tracker Modules & Calendar | Pending |
| CAR-04 | Phase 4: Tracker Modules & Calendar | Pending |
| CAR-05 | Phase 4: Tracker Modules & Calendar | Pending |
| CAR-06 | Phase 4: Tracker Modules & Calendar | Pending |
| INS-01 | Phase 4: Tracker Modules & Calendar | Pending |
| INS-02 | Phase 4: Tracker Modules & Calendar | Pending |
| INS-03 | Phase 4: Tracker Modules & Calendar | Pending |
| INS-04 | Phase 4: Tracker Modules & Calendar | Pending |
| INS-05 | Phase 4: Tracker Modules & Calendar | Pending |
| INS-06 | Phase 4: Tracker Modules & Calendar | Pending |
| ELEC-01 | Phase 4: Tracker Modules & Calendar | Pending |
| ELEC-02 | Phase 4: Tracker Modules & Calendar | Pending |
| ELEC-03 | Phase 4: Tracker Modules & Calendar | Pending |
| ELEC-04 | Phase 4: Tracker Modules & Calendar | Pending |
| ELEC-06 | Phase 4: Tracker Modules & Calendar | Pending |
| COST-01 | Phase 4: Tracker Modules & Calendar | Pending |
| COST-02 | Phase 4: Tracker Modules & Calendar | Pending |
| COST-03 | Phase 4: Tracker Modules & Calendar | Pending |
| CAL-01 | Phase 4: Tracker Modules & Calendar | Pending |
| CAL-02 | Phase 4: Tracker Modules & Calendar | Pending |
| CAL-03 | Phase 4: Tracker Modules & Calendar | Pending |
| CAL-04 | Phase 4: Tracker Modules & Calendar | Pending |
| AI-01 | Phase 5: AI Chatbot & RAG | Pending |
| AI-02 | Phase 5: AI Chatbot & RAG | Pending |
| AI-03 | Phase 5: AI Chatbot & RAG | Pending |
| AI-04 | Phase 5: AI Chatbot & RAG | Pending |
| AI-05 | Phase 5: AI Chatbot & RAG | Pending |
| AI-06 | Phase 5: AI Chatbot & RAG | Pending |
| AI-07 | Phase 5: AI Chatbot & RAG | Pending |
| INS-07 | Phase 5: AI Chatbot & RAG | Pending |
| INS-08 | Phase 5: AI Chatbot & RAG | Pending |
| INS-09 | Phase 5: AI Chatbot & RAG | Pending |
| ELEC-05 | Phase 5: AI Chatbot & RAG | Pending |
| PLAT-03 | Phase 6: Platform & Polish | Pending |

**Total v1 requirements: 75**
**Mapped to phases: 75**
**Unmapped: 0**

---

*Requirements defined: 2026-03-24*
*Replaces prior requirements defined 2026-03-19 — full concept revision*
