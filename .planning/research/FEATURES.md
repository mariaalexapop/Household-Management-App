# Feature Landscape

**Domain:** AI-powered household management app
**Researched:** 2026-03-19
**Confidence note:** WebSearch and WebFetch were unavailable during research. All competitive analysis drawn from training knowledge (cutoff August 2025) of Flatastic, OurHome, Cozi, Splitwise, and home inventory apps. Confidence is MEDIUM for competitive comparisons; HIGH for feature categorisation logic derived from product structure.

---

## Competitive Reference Map

| App | Primary Strength | Missing |
|-----|-----------------|---------|
| Flatastic | Shared chores + shared expenses, household-first UX | No AI, no warranty/maintenance, no bank sync |
| OurHome | Chore gamification, rewards for kids, family focus | No financials, no AI |
| Cozi | Family calendar + shopping lists, deeply established | No expense tracking, no AI, very calendar-centric |
| Splitwise | Expense splitting/settling between people | No chores, no maintenance, no AI, not household-first |
| Centriq / Homebook | Home inventory, appliance records, manual storage | No financials, no chores, minimal AI (basic) |
| Tody | Chore scheduling with frequency logic | No financials, no AI, no household-shared model |

**Gap this app fills:** No existing product combines financials + chores + maintenance + warranties + AI in one place. Users currently stitch together Splitwise + Todoist + Apple Notes + spreadsheets. The fragmentation is the pain point.

---

## Table Stakes

Features users expect from any household management app. Missing = product feels incomplete or users leave within the first week.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-user household with invite | Core promise — "household" means more than one person | Med | Email + link invite; Flatastic/OurHome both do this |
| Shared task / chore list | Foundational household coordination feature | Low | CRUD + assignment; expected by all competitors |
| Recurring chores with frequency | One-time chores are insufficient; weekly cleaning, etc. | Low-Med | Cron-like scheduling; daily/weekly/monthly/custom |
| Push/in-app reminders for tasks | Chores not completed without prompting | Med | Requires notification infrastructure |
| Expense logging (manual) | Any finance tool needs manual entry as fallback | Low | Amount, category, date, payer — minimum viable |
| Expense categorisation | Raw numbers without categories are useless | Low-Med | Preset categories + custom; grocery/utilities/rent/etc. |
| Household spending summary | Dashboard-level spend visibility | Med | By category and period at minimum |
| Bill / subscription tracking | Recurring bills are universal household pain | Med | Due dates, amounts, paid/unpaid state |
| Bill due reminders | Bills missed without reminders — high anxiety feature | Med | Tied to notification infrastructure |
| Activity feed | "Who did what" is expected in shared apps | Low-Med | Simple event log per household |
| User profiles per member | Task attribution and expense splitting requires identity | Low | Name, avatar; no complex RBAC needed in v1 |
| Auth (email + OAuth) | Table stakes for any web app | Low | Email/password + Google/Apple OAuth |
| Mobile-responsive web | Household tasks happen on phone | Low-Med | PWA patterns; camera access for OCR |
| Real-time sync | Multi-user apps feel broken without live updates | High | Websocket or SSE; latency must be imperceptible |

---

## Differentiators

### AI-Powered Differentiators

| Feature | Value Proposition | Complexity | Confidence | Notes |
|---------|-------------------|------------|-----------|-------|
| Receipt OCR + AI parsing | Snap a photo → expense created automatically; removes the #1 friction of manual entry | High | HIGH | Core differentiator. Uses OCR + LLM to extract merchant, amount, line items, category. No competitor does this. |
| Warranty document scanning | Scan any warranty → product name, purchase date, expiry, coverage extracted | High | HIGH | Huge pain point: warranties get lost. AI extraction + reminder at expiry is novel. |
| Model number → user manual retrieval | Type/scan a model number → AI surfaces the manual and useful product info | High | MEDIUM | Leverages LLM tool-use or RAG over product databases. Novel. Verify feasibility: depends on public manual availability. |
| Proactive AI reminders (contextual) | AI cross-links data (e.g., warranty expiring → schedule a check) vs dumb calendar reminders | High | HIGH | The "ambient intelligence" layer. Turns passive data into action. |
| Chat assistant (natural language queries) | "How much did we spend on food last month?" — no dashboard navigation required | High | HIGH | LLM with household data context. Two modes: query answering + action creation via chat. |
| Ambient AI cards on dashboard | Passive suggestions surface without user prompting ("Your boiler service is overdue") | Med | HIGH | No competitor has this. Low friction — users benefit without learning the UI. |
| Document intelligence (any document) | Drop any document → AI categorises and extracts data automatically | High | HIGH | Generalises receipt/warranty scanning to arbitrary household docs. |
| Spend pattern alerts | "You're £120 over your usual grocery budget" — anomaly detection, not just totals | Med-High | HIGH | Requires historical baseline. Novel vs. competitors. |

### Non-AI Differentiators

| Feature | Value Proposition | Complexity | Confidence | Notes |
|---------|-------------------|------------|-----------|-------|
| Bank/card sync (open banking) | Automatic transaction import eliminates manual entry entirely | High | HIGH | Plaid (US), TrueLayer (UK/EU). Significant regulatory + cost overhead. Strong differentiator vs. Flatastic/OurHome. |
| Maintenance scheduling with history | Log appliances, set service intervals, see full service history | Med | HIGH | Home inventory apps do this in isolation; combined with AI is novel. |
| Warranty + maintenance cross-link | AI links warranty expiry to maintenance schedule | High | HIGH | Pure AI-layer value. Requires both features to exist first. |
| Full equality multi-user model | No admin/member hierarchy — suits couples and flatmates specifically | Low | HIGH | OurHome has parent/child model; Flatastic has creator privileges. This is a deliberate UX differentiator. |
| Unified household OS | Single source of truth for bills + chores + maintenance + warranties | Med | HIGH | The integration is the differentiator, not any individual feature. |

---

## Anti-Features

Features to explicitly NOT build in v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Native iOS / Android app | App Store review cycles, separate codebase, 3-4x scope increase | Mobile-responsive PWA; camera API works in mobile browser for OCR |
| Role-based permissions (Admin/Member/Guest) | Adds UX complexity; most households don't need ACL | Full equality model; revisit in v2 based on user feedback |
| Smart home integrations (Alexa, Google Home, IFTTT) | Deep integration work, versioning fragility, low v1 demand | Manual data entry + AI parsing covers use cases without integration |
| Investment / asset tracking | Distinct domain from household ops; different mental model | Household expenses and bills only |
| Contractor / marketplace booking | Third-party relationships, liability, complex UX | Maintenance scheduling without booking |
| Budget creation and forecasting | Complex UX; spend visibility is the v1 value | Anomaly detection on actuals is more useful than budget planning |
| Expense settlement / debt tracking between members | Splitwise already does this well; building a worse version adds no value | Track who paid; settlement is out of scope |
| Grocery list with retailer integration | Without smart integration, shopping lists are commoditised | v2 consideration; focus on financial and maintenance in v1 |
| Gamification (points, badges, rewards) | OurHome targets families with kids; this targets adults | Task completion visibility is the adult equivalent |
| Multi-household support per user | Adds data model complexity; most users have one household | Single active household per user; v2 for property managers |

---

## Feature Dependencies

```
Auth + User profiles
  → Household creation + member invite
    → Activity feed (needs members)
    → All shared features (tasks, expenses, etc.)

Expense manual entry (category, amount, date, payer)
  → Expense categorisation taxonomy
    → Household spending summary / dashboard
      → Spend pattern alerts (needs historical baseline — 30+ days of data)
        → Bank sync (extends same data model, adds auto-import)

Receipt OCR pipeline (image → text)
  → AI expense parsing (text → structured expense)
    → Document intelligence generalisation (same pipeline, broader input types)

Bill tracking (amount, due date, recurrence)
  → Bill paid/history state
    → Bill due reminders

Chore CRUD (title, assignee, frequency)
  → Recurring chore scheduler
    → Chore reminders (push/in-app)

Appliance / item registry (name, model, purchase date)
  → Warranty document scanning (populates registry via AI)
    → Maintenance scheduling (acts on items in registry)
      → Warranty expiry reminders
        → AI cross-link (warranty + maintenance suggestion)

LLM integration (household data context window)
  → Chat assistant
  → Ambient AI cards
  → Proactive contextual reminders
    (All three share the same underlying AI context layer)

Notification infrastructure (push / in-app)
  → All reminder features (bill, chore, maintenance, warranty, AI proactive)
```

---

## MVP Recommendation

The MVP must prove two things: (1) the household coordination core works reliably, and (2) at least one AI feature delivers visible "wow" value.

**Prioritise in MVP:**

1. Auth + household creation + member invite (prerequisite for everything)
2. Chore CRUD + recurring + reminders (fastest to deliver; validates daily engagement)
3. Expense manual entry + categorisation + household summary (validates financial value)
4. Bill tracking + due date reminders (quick win; high anxiety relief)
5. Receipt OCR + AI parsing (primary AI "wow" — proves the AI layer)
6. Chat assistant with household data context (second AI "wow" — low marginal cost once LLM integration exists)
7. Ambient AI cards on dashboard (passive value; builds on same LLM context layer)

**Defer to Phase 2+:**

| Feature | Reason for Deferral |
|---------|---------------------|
| Bank / card sync (open banking) | Regulatory overhead, provider cost, integration complexity — validate demand with OCR first |
| Warranty document scanning | High value but lower urgency than financial tracking |
| Model number → user manual retrieval | Feasibility risk (depends on public manual databases); needs dedicated feasibility research |
| Maintenance scheduling | Builds on warranty registry — natural Phase 2 addition |
| Spend pattern alerts | Requires 30+ days of data baseline before useful |

---

## Phase-Specific Feature Flags

| Phase | Features | Research Needed? |
|-------|---------|-----------------|
| Foundation | Auth, household, multi-user, real-time sync | No — standard patterns |
| Chores | Task CRUD, recurring, reminders, notification infra | No — standard patterns |
| Financials Core | Manual expense entry, categories, bill tracking, dashboard | No — standard patterns |
| AI Layer 1 | Receipt OCR + parsing, chat assistant, ambient cards | YES — OCR provider selection, LLM prompt engineering, context window design |
| Open Banking | Bank/card sync via Plaid/TrueLayer | YES — provider selection, regulatory (PSD2/UK open banking), cost modelling |
| Maintenance + Warranties | Warranty scanning, appliance registry, maintenance scheduling | YES — OCR reuse, model number lookup feasibility |
| AI Layer 2 | Proactive reminders, spend anomaly detection, cross-linking | YES — ML baseline approach, LLM orchestration |

---

## Sources

- Competitor feature analysis based on training knowledge (Flatastic, OurHome, Cozi, Splitwise, Centriq — as of August 2025 knowledge cutoff). Confidence: MEDIUM.
- Feature categorisation derived from project constraints in `.planning/PROJECT.md`. Confidence: HIGH.
- AI feature feasibility based on established industry patterns as of knowledge cutoff. Confidence: HIGH for feasibility, MEDIUM for specific tooling.
- WebSearch and WebFetch were unavailable. Competitive analysis should be re-verified with live sources before roadmap finalisation.
