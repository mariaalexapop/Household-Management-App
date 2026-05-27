# TODO & Future Ideas

## Modular Dashboard Layout

**Priority:** Low
**Context:** Currently the dashboard has a fixed two-column layout (task list left, cards right). Cards in the right sidebar are draggable, but you can't move elements between columns or rearrange the overall structure.

### Explore

- Unified sortable grid where all dashboard sections (weekly tasks, cards, chart) are equal blocks that can be placed anywhere
- Allow users to choose which blocks are visible and where they sit
- Possibly a 2-column or 3-column flexible grid where blocks can span columns
- Persist layout per user in the database (not just localStorage)

---

## AI Write Tools — Add data via chat

**Priority:** Medium
**Context:** The AI assistant currently has read-only tools. Users expect to add data through chat (e.g., "add tennis practice for Victor").

### What to build

Add write tools to `src/lib/ai/tools.ts`:

- `add_chore` — create a task (title, startsAt, notes, ownerId)
- `add_kid_activity` — create a kid activity (title, childId, category, startsAt, location, notes)
- `add_car` — register a car (make, model, year, plate)
- `add_electronics` — register an appliance (name, brand, modelNumber, purchaseDate)
- `add_insurance_policy` — add a policy (insurer, policyType, policyNumber, expiryDate)
- `update_chore_status` — mark a chore done/in-progress (taskId, status)
- `get_children` — read tool needed so AI can resolve child names to childId

### Also needed

- Update system prompt in `src/lib/ai/system-prompt.ts` to describe write capabilities
- All write tools use `ctx.householdId` and `ctx.userId` for scoping and `createdBy`

---

## v2 Smart Dashboard Ideas

Candidates for making the dashboard genuinely useful — grouped by theme. Pick the best 3–4 for v2.

### 1. Proactive Radar — things it spots before you do

- **Renewal price drift.** "Aviva home is +18% vs last year. 3 like-for-like quotes range £412–£468." Today's card just announces the renewal; the smart version brings the decision to you.
- **Weather-aware nudges.** "Storm Thursday → bring the trampoline in; water plants Wednesday instead of Friday."
- **Pattern noticing.** "You've added 'buy cat food' five times, every ~22 days. Make it recurring?"
- **Anomaly flags.** Heating ran 4h longer than normal yesterday; broadband bill £6 higher than the 6-month avg.

### 2. Cross-module stitching — where Kinship beats a to-do list

- **Receipt → warranty + return.** Photo a receipt, it lands in Electronics with warranty end, return deadline, and the manual link.
- **Document inbox / forward-by-email.** Forward an MOT cert, school letter, or vet invoice to `ava@kinship.box` → it routes to the right module and extracts dates.
- **Event fan-out.** "Iris swim Tue 6pm" auto-adds: pack kit reminder at 5:30, conflicts with Finn's piano (suggest swap), dinner pushed to 7.
- **Service memory.** "A plumber visited June 2024 for this same boiler code — same number, last invoice £140."

### 3. Household fairness — the bit no other app does

- **Load balance.** Quiet, non-judgy: "Ava is holding 74% of recurring decisions this month. 3 things Nick could own." This is the real reason couples download household apps.
- **On-call mode.** "Nick has the week" → notifications, school pickup alerts, and chore nags route to him.
- **Kid view.** Iris (10) gets a read-only chore list on her tablet, can tick things off, earns whatever you've agreed.

### 4. The "Today Brief" — single answer, not a dashboard

Replace the hero strip with one sentence the household actually reads: "Bins out tonight, Finn needs PE kit, MOT booking due this week, and Aviva renewal decision is the big one." Then the module grid sits below as the explore layer. Most household apps fail because they're 12 cards of "stuff" — the brief is the antidote.

### 5. Cost-of-living rollup

Per-car, per-child, per-pet annual cost, surfacing where the money actually goes. End-of-year review email people forward to their partner.
