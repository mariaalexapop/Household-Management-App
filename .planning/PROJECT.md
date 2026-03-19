# Household Management App

## What This Is

An AI-powered household OS that centralises financial tracking and daily responsibilities, helping households organise bills, expenses, maintenance, warranties, and chores. Built for all household types — families, couples, and flatmates — with full-equality multi-user collaboration and an AI layer that connects the dots between fragmented home data. Web-first, with iOS/Android to follow.

## Core Value

The AI that turns fragmented household data into automated harmony — so nothing gets forgotten, costs stay visible, and maintenance never becomes a crisis.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Financial Tracking**
- [ ] User can snap a photo of a receipt and AI parses it into categorised expenses automatically (OCR + LLM)
- [ ] User can connect a bank/card account for automatic transaction import (open banking — Plaid/TrueLayer)
- [ ] User can manually add expenses with category, amount, date, and member attribution
- [ ] User can view household spending by category, period, and member
- [ ] User gets spend pattern alerts when household is trending over typical spend ("you're £120 over your usual grocery budget")

**Bills & Subscriptions**
- [ ] User can track recurring bills (rent, utilities, subscriptions) with due dates and amounts
- [ ] User receives reminders before bills are due
- [ ] User can mark bills as paid and view payment history

**Maintenance & Warranties**
- [ ] User can snap a photo of a warranty document and AI extracts product, purchase date, expiry, and coverage
- [ ] User can log appliances/items with model numbers and AI retrieves user manuals and useful product info automatically
- [ ] User can schedule maintenance tasks and receive proactive reminders when they're due
- [ ] AI cross-links expiring warranties with a suggestion to schedule a check before lapse

**Chores & Tasks**
- [ ] User can create, assign, and complete household chores and tasks
- [ ] User can set recurring chores with configurable frequency
- [ ] All household members can see and edit all tasks (full equality model)
- [ ] User receives push/in-app reminders for upcoming and overdue tasks

**AI Assistant**
- [ ] Ambient AI surface: smart cards and suggestions appear on the dashboard based on household data
- [ ] Chat assistant: user can ask natural language questions ("how much did we spend on food last month?", "when is the boiler next due?")
- [ ] Document intelligence: upload any document (receipt, warranty, fridge note) and AI auto-categorises and extracts relevant data

**Multi-user & Households**
- [ ] User can create a household and invite members via link or email
- [ ] All members have full equal access (no role hierarchy in v1)
- [ ] Each member has a profile used for task attribution and expense splitting
- [ ] User can view a household activity feed (who did what, when)

**Core Platform**
- [ ] User can register and log in (email/password + OAuth)
- [ ] Household data is synced in real-time across members
- [ ] Mobile-responsive web app suitable for use on phone browsers (camera access for OCR)

### Out of Scope (v1)

- **Native iOS/Android apps** — web-first; mobile apps are a subsequent milestone
- **Role-based permissions (Admin/Member)** — full equality in v1; RBAC adds complexity without clear v1 value
- **Smart home integrations** (Alexa, Google Home, IFTTT) — out of scope for now; AI layer is the differentiator
- **Investment/asset tracking** — household costs only, not personal finance
- **Marketplace / contractor booking** — no external service integrations in v1

## Context

- **Competitor reference**: Flatastic is the closest existing product — it handles shared household tasks and costs but has no AI layer. This app's differentiator is the AI that connects the dots (OCR parsing, proactive suggestions, chat assistant, document intelligence).
- **User mental model**: Users are currently duct-taping together Splitwise, Todoist, Apple Notes, and spreadsheets. The pain is fragmentation — nothing talks to anything else.
- **AI interaction model**: Two-surface approach — ambient cards/suggestions on the dashboard (passive) + a chat assistant for on-demand queries (active). AI also auto-processes any document dropped into the platform.
- **Document intelligence specifics**: Snap a grocery receipt → parsed into expense categories. Scan a warranty → product extracted, expiry tracked. Provide a model number → AI fetches the user manual and surfaces useful info.

## Constraints

- **Platform**: Web app first — allows fast iteration and avoids App Store delays. Mobile web must support camera access for OCR flows.
- **AI dependency**: OCR + LLM parsing is a core feature, not an enhancement. Requires reliable third-party AI services (Claude API, OCR provider).
- **Open banking**: Bank sync requires integration with a provider (Plaid for US, TrueLayer for UK/EU). Regulatory and cost implications to research.
- **Real-time sync**: Multi-user collaboration requires real-time data sync across members (websockets or similar).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-first, mobile later | Fastest path to a working product; mobile web handles OCR camera flows | — Pending |
| Full equality model (no roles in v1) | Reduces complexity; most households don't need permission hierarchies initially | — Pending |
| Both OCR + bank sync for financials | OCR covers cash/paper; bank sync covers card transactions — neither alone is sufficient | — Pending |
| Ambient + chat AI surfaces | Ambient reduces friction for passive users; chat serves power users who want to query data | — Pending |

---
*Last updated: 2026-03-19 after initialization*
