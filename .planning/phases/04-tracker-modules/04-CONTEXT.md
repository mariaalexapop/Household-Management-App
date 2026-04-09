# Phase 4: Tracker Modules - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers three new household tracking modules — Cars, Insurance, Electronics — each with CRUD, document uploads (PDF), cost logging, and configurable reminders. It also delivers a costs dashboard aggregating all tracked costs and integrates all new module events into the existing Phase 3 unified calendar.

Requirements: CAR-01–06, INS-01–06, ELEC-01–04, ELEC-06, COST-01–03

</domain>

<decisions>
## Implementation Decisions

### Module Structure & Navigation
- Separate routes per module: `/cars`, `/insurance`, `/electronics`, `/costs`
- Dedicated `/costs` route aggregating all costs with section and period breakdown
- Document uploads via Supabase Storage — drag-and-drop zone, PDFs stored per household, linked to item
- Modules gated by household's `activeModules` setting — reuse existing onboarding pattern, add `cars`, `insurance`, `electronics` as module keys

### Car Module
- Car fields: make, model, year, plate, colour (per CAR-01 — no extras for MVP)
- Service history: timeline list per car, newest first, each entry as a card with date, type, mileage, garage, cost
- 3 key date reminder types: MOT/inspection, road tax, next service — each with configurable days-before reminder
- Module accent colour: orange `#ea580c` (already defined in MODULE_COLOURS)

### Insurance & Electronics
- Insurance policy types: home, car, health, life, travel, other (per INS-01)
- Premium payment schedules: annual, quarterly, monthly — with next-payment-date field and auto-reminder
- Electronics warranty: expiry date + coverage summary text — auto 30-day reminder (per ELEC-03)
- Max file upload size: 10MB per PDF

### Costs Dashboard & Calendar Integration
- Costs breakdown: by section (cars/insurance/electronics) + by month, filterable by year
- Visualization: simple table with totals — no charting library for MVP
- Calendar integration: extend existing `/calendar` page query with car key dates, insurance expiry/payments, electronics warranty expiry as CalendarEvent[]
- Dashboard cards: add CarDashboardCard, InsuranceDashboardCard, ElectronicsDashboardCard to DashboardGrid (same pattern as ChoresDashboardCard)

### Claude's Discretion
- Database schema design (table structure, column types, indexes)
- Form layouts and field ordering within each module
- Inngest function design for reminders
- Supabase Storage bucket naming and path conventions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RecurrenceConfig` — reusable for periodic reminders
- `DatePicker` — shadcn date picker component
- `CalendarEvent` type + `MODULE_COLOURS` map — extend with car/insurance/electronics
- `DashboardGrid` + `ModuleCard` pattern — add new module cards
- `registerChildren` / `childHex` pattern — can inform per-module colour utilities
- `activityFeed` table — reuse for logging tracker module events
- Inngest functions (`generate-activity-recurrence`, `send-activity-reminder`) — pattern for reminder functions

### Established Patterns
- Server Actions in `src/app/actions/` for all mutations
- Drizzle ORM with `src/lib/db/schema.ts` for schema
- Server Components fetch data, Client Components handle interactivity
- `ring-miro` shadow, `rounded-xl` cards, Miro design tokens throughout
- `font-display` (Space Grotesk) for headings, `font-body` (Noto Sans) for body

### Integration Points
- `/calendar` page: add car/insurance/electronics queries alongside existing chores + kids
- Dashboard page: add new module cards to `DashboardGrid`
- App layout: calendar link already in header
- Settings modules page: add new module toggles
- Onboarding step 3: add new module options

</code_context>

<specifics>
## Specific Ideas

- Miro design system must be applied to all new pages (Blue 450 primary, ring-miro cards, Space Grotesk headings)
- Module colours already defined: car = orange `#ea580c`, insurance = purple `#9333ea`, electronics = teal `#0d9488`
- Follow the chores/kids page pattern: page header with module accent strip, Add button top-right, list/detail layout

</specifics>

<deferred>
## Deferred Ideas

- INS-07, INS-08, INS-09 (chatbot integration with insurance docs) → Phase 5
- ELEC-05 (chatbot integration with electronics manuals) → Phase 5
- ELEC-V2-01 (auto-retrieve manual by model number) → v2
- Advanced cost analytics (charts, trends, forecasting) → v2

</deferred>
