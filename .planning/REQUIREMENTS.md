# Requirements: Household Management App

**Defined:** 2026-03-19
**Core Value:** The AI that turns fragmented household data into automated harmony — so nothing gets forgotten, costs stay visible, and maintenance never becomes a crisis.

---

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User can sign up and log in with Google OAuth
- [ ] **AUTH-05**: User can sign up and log in with Apple OAuth
- [ ] **AUTH-06**: User session persists across browser refresh

### Household

- [ ] **HSLD-01**: User can create a household with a name
- [ ] **HSLD-02**: User can invite other members via shareable link
- [ ] **HSLD-03**: User can invite other members via email
- [ ] **HSLD-04**: Invited user can join a household by accepting an invitation
- [ ] **HSLD-05**: User can view all members of their household
- [ ] **HSLD-06**: User can set and update their display name and avatar
- [ ] **HSLD-07**: User can view a household activity feed (who did what, when)

### Tasks & Chores

- [ ] **TASK-01**: User can create a task with title, description, assignee, and due date
- [ ] **TASK-02**: User can assign a task to any household member (including themselves)
- [ ] **TASK-03**: User can mark a task as complete
- [ ] **TASK-04**: User can edit and delete tasks they created
- [ ] **TASK-05**: User can create recurring tasks with daily/weekly/monthly/custom frequency
- [ ] **TASK-06**: Recurring tasks automatically regenerate on completion
- [ ] **TASK-07**: User can organise tasks into categories (e.g. Cleaning, Garden, Admin)
- [ ] **TASK-08**: User receives in-app notifications for tasks assigned to them
- [ ] **TASK-09**: User receives push notifications for upcoming and overdue tasks
- [ ] **TASK-10**: All household members can see and edit all tasks (full equality)

### Bills & Subscriptions

- [ ] **BILL-01**: User can add a bill with name, amount, due date, and recurrence
- [ ] **BILL-02**: User can mark a bill as paid and view payment history
- [ ] **BILL-03**: User receives in-app and push reminders before a bill is due (configurable days ahead)
- [ ] **BILL-04**: User can view all upcoming bills sorted by due date
- [ ] **BILL-05**: User can edit and delete bills

### Expenses

- [ ] **EXPN-01**: User can manually add an expense with amount, category, date, merchant, and payer
- [ ] **EXPN-02**: User can edit and delete expenses they created
- [ ] **EXPN-03**: User can view household expenses filtered by category, date range, and member
- [ ] **EXPN-04**: User can create and manage expense categories (presets + custom)
- [ ] **EXPN-05**: User can view a household spending dashboard (total by category and by period)
- [ ] **EXPN-06**: User can view spending trends over time (month-on-month comparison)

### AI — Document Intelligence

- [ ] **AIDOC-01**: User can photograph a receipt and AI extracts merchant, date, total, and line items into a structured expense draft
- [ ] **AIDOC-02**: User reviews and confirms the AI-parsed expense before it is saved (never auto-saved)
- [ ] **AIDOC-03**: User can upload a warranty document (photo or PDF) and AI extracts product name, purchase date, expiry date, and coverage summary
- [ ] **AIDOC-04**: User can upload any household document and AI auto-categorises it and extracts relevant data
- [ ] **AIDOC-05**: OCR processing is asynchronous — user receives a notification when parsing is complete (not blocked waiting)
- [ ] **AIDOC-06**: If AI extraction confidence is low, user is shown the raw extracted text and prompted to fill fields manually

### AI — Chat Assistant

- [ ] **AICH-01**: User can ask natural language questions about their household data (e.g. "how much did we spend on food last month?")
- [ ] **AICH-02**: Chat assistant queries the database for all financial figures — never relies on model memory
- [ ] **AICH-03**: User can ask the chat assistant to create tasks or log expenses via natural language
- [ ] **AICH-04**: Conversation history is persisted per household

### AI — Ambient Intelligence

- [ ] **AIAMB-01**: Dashboard displays AI-generated suggestion cards (e.g. "Your boiler was last serviced 11 months ago")
- [ ] **AIAMB-02**: AI suggestions are generated as a background job — not computed per page load
- [ ] **AIAMB-03**: User can dismiss individual AI suggestion cards
- [ ] **AIAMB-04**: AI generates spend pattern alerts when household spending significantly exceeds typical patterns

### Maintenance & Warranties

- [ ] **MAINT-01**: User can add appliances/items to a household registry (name, brand, model number, purchase date)
- [ ] **MAINT-02**: Warranty documents scanned via AIDOC-03 automatically populate the appliance registry
- [ ] **MAINT-03**: User receives a reminder 30 days before a warranty expires
- [ ] **MAINT-04**: User can create maintenance tasks for appliances (e.g. "Annual boiler service") with a recurrence schedule
- [ ] **MAINT-05**: User receives reminders when scheduled maintenance is due
- [ ] **MAINT-06**: AI suggests scheduling a maintenance check when a warranty is approaching expiry (cross-linking)

### Platform & Real-Time

- [ ] **PLAT-01**: All household data syncs in real-time across all members without page refresh
- [ ] **PLAT-02**: App shows a reconnecting indicator when real-time connection drops
- [ ] **PLAT-03**: App is mobile-responsive and usable on phone browsers (including camera access for OCR)
- [ ] **PLAT-04**: User data is stored in EU infrastructure (GDPR compliance)
- [ ] **PLAT-05**: User can request deletion of their personal data (right to erasure)

---

## v2 Requirements

### Open Banking

- **BANK-01**: User can connect a bank/card account via TrueLayer (UK/EU) or Plaid (US)
- **BANK-02**: Transactions are automatically imported and categorised from connected accounts
- **BANK-03**: User receives notification when bank re-authentication is required
- **BANK-04**: User can view bank connection health and reconnect broken connections
- **BANK-05**: Manual CSV import from bank statements as fallback

### Advanced AI

- **AIEXT-01**: User can enter a model number and AI retrieves the user manual and product information
- **AIEXT-02**: AI detects anomalous individual expenses (e.g. unexpected duplicate charge)
- **AIEXT-03**: AI generates monthly household summary report

### Mobile Apps

- **MOB-01**: Native iOS app
- **MOB-02**: Native Android app

### Advanced Household Management

- **ADV-01**: User can set a household budget per category and track against it
- **ADV-02**: User can view an annual maintenance calendar for all appliances
- **ADV-03**: User can export household expense history as CSV

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Role-based permissions (Admin/Member) | Full equality in v1; RBAC adds complexity without clear v1 value. Revisit in v2 if user research demands it. |
| Expense settlement / debt tracking | Splitwise does this well; building a worse version adds no value over recommending Splitwise |
| Grocery list with retailer integration | Without smart integration, shopping lists are commoditised; focus on financials and maintenance |
| Smart home integrations (Alexa, Google Home, IFTTT) | Deep integration work, low v1 demand; AI layer covers the use cases without integration |
| Investment / asset tracking | Distinct domain from household ops; out of scope permanently |
| Contractor / marketplace booking | Third-party complexity; maintenance scheduling without booking covers the need |
| Budget creation and forecasting | Anomaly detection on actuals is more useful than budget planning; revisit in v2 |
| Multi-household per user | Adds data model complexity; single active household per user; v2 for property managers |
| Gamification (points, badges, rewards) | OurHome targets families with kids; this product targets adults |
| Native mobile apps | Web-first; mobile apps are a subsequent milestone (v2) |

---

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 – AUTH-06 | Phase 1 | Pending |
| HSLD-01 – HSLD-07 | Phase 1 | Pending |
| TASK-01 – TASK-10 | Phase 2 | Pending |
| BILL-01 – BILL-05 | Phase 3 | Pending |
| EXPN-01 – EXPN-06 | Phase 3 | Pending |
| PLAT-01 – PLAT-05 | Phase 1 | Pending |
| AIDOC-01 – AIDOC-06 | Phase 4 | Pending |
| AICH-01 – AICH-04 | Phase 5 | Pending |
| AIAMB-01 – AIAMB-04 | Phase 5 | Pending |
| MAINT-01 – MAINT-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---

*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
