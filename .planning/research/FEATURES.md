# Feature Landscape

**Domain:** Family household command centre with AI chatbot and RAG
**Researched:** 2026-03-19
**Last updated:** 2026-03-24 — revised for new concept (5 modules, modular onboarding, RAG v1, OCR/banking v2)
**Confidence note:** Competitive analysis drawn from training knowledge (cutoff August 2025). Confidence is MEDIUM for competitive comparisons; HIGH for feature categorisation derived from product structure and direct user input.

---

## Target Audience

This product targets **families with children and multiple assets** (cars, home, electronics) who need to track obligations across multiple life domains in one place. Secondary audiences: couples, flatmates. The key pain is fragmentation — families currently use a combination of Google Calendar, spreadsheets, phone reminders, physical files, and memory to manage things that should live in one place.

---

## Competitive Reference Map

| App | Primary Strength | What's Missing |
|-----|-----------------|----------------|
| Flatastic | Shared chores + shared expenses, household-first UX | No car maintenance, no insurance, no kids activities, no AI chatbot |
| OurHome | Chore gamification, rewards for kids, family focus | No maintenance, no insurance, no AI, limited to tasks/chores |
| Cozi | Family calendar + shopping lists, deeply established | No expense tracking, no insurance management, no AI, very calendar-centric |
| Splitwise | Expense splitting/settling between people | No chores, no maintenance, no insurance, no AI, not household-first |
| Centriq / Homebook | Home inventory, appliance records, warranty storage | No chores, no insurance management, no AI chat, no reminders |
| Tody | Chore scheduling with frequency logic | No financials, no insurance, no AI, no multi-domain |

**Gap this app fills:** No existing product combines home chores + car maintenance + insurance management + electronics/warranty tracking + kids activity planning in one place, with an AI chatbot that understands your specific household's documents. Users currently stitch together Google Calendar + Cozi + spreadsheets + physical folders + memory. The fragmentation and document inaccessibility are the core pain points.

---

## Table Stakes

Features users expect from any household management app. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-user household with invite | Core promise — "household" means more than one person | Med | Admin creates, invites by email or link |
| Household admin model | Someone needs to manage membership | Low | Admin for membership only; full content equality |
| Personalised onboarding | Different households have different needs | Med | Type selection + module selection → custom dashboard |
| Shared task / chore list | Foundational household coordination | Low | CRUD + assignment + recurring |
| Due date reminders for tasks | Chores not completed without prompting | Med | In-app + push |
| Car maintenance tracking | Families with cars need MOT/service reminders | Med | Multiple cars; service history; key dates |
| Insurance document storage | Policies get lost; procedures inaccessible in emergencies | Med | PDF upload + basic metadata |
| Insurance renewal reminders | Lapses are catastrophic; forgetting is common | Med | Configurable days-before alerts |
| Kids activity planning | Families with kids need a shared activity calendar | Med | Child profiles (no accounts); per-activity reminders |
| Electronics/warranty tracking | Warranties expire silently; manuals get lost | Low-Med | Registry + expiry reminders + manual upload |
| Unified calendar | All date-tied items in one view | Med | Multi-module aggregation; colour-coded by module |
| Basic costs dashboard | Cross-module cost visibility | Med | Service costs, insurance premiums, electronics spend |
| Activity feed | "Who did what" is expected in shared apps | Low-Med | Simple event log per household |
| User profiles per member | Task attribution requires identity | Low | Name, avatar |
| Auth (email + OAuth) | Table stakes for any web app | Low | Email/password + Google OAuth |
| Real-time sync | Multi-user apps feel broken without live updates | High | Supabase Realtime WebSocket |
| Mobile-responsive web | Household tasks happen on phone | Low-Med | Camera access needed for Phase 5 document uploads |

---

## Differentiators

### AI-Powered Differentiators (v1)

| Feature | Value Proposition | Complexity | Confidence | Phase |
|---------|-------------------|------------|-----------|-------|
| AI chatbot over uploaded documents (RAG) | "What do I do if my boiler floods?" → answers from your actual insurance policy | High | HIGH | Phase 5 |
| Procedure extraction → task creation | Chatbot reads your insurance document and turns "what to do after a flood" into a checklist of tasks you can approve | High | HIGH | Phase 5 |
| Document-grounded answers | Answers cite the specific section of your uploaded document — no hallucination | High | HIGH | Phase 5 |
| Household data queries | "When is my car's next MOT?" answered from your actual car records — tool-calling, not LLM recall | Med | HIGH | Phase 5 |

### AI-Powered Differentiators (v2)

| Feature | Value Proposition | Complexity | Confidence | Phase |
|---------|-------------------|------------|-----------|-------|
| Receipt OCR + AI parsing | Snap a photo → expense created automatically | High | HIGH | v2 Phase 1 |
| Model number → user manual retrieval | Enter model number → AI fetches the manual | High | MEDIUM | v2 Phase 4 |
| Ambient AI dashboard cards | Passive suggestions without user action | Med | HIGH | v2 Phase 5 |
| Spend pattern anomaly alerts | "£120 over usual grocery spend" | Med-High | HIGH | v2 Phase 3 |

### Non-AI Differentiators

| Feature | Value Proposition | Confidence |
|---------|-------------------|------------|
| Modular personalised dashboard | Only see what's relevant to your household; not a generic app | HIGH |
| 5 integrated modules | Car + insurance + electronics + chores + kids in one place with a shared calendar | HIGH |
| Document accessibility in emergencies | Upload your home insurance policy; ask the chatbot "what do I do if my pipe bursts?" | HIGH |
| Full equality multi-user model | Both parents have equal access; no admin/member hierarchy for content | HIGH |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Receipt scanning in v1 | Adds OCR pipeline complexity before core tracking value is proven | Manual cost tracking + v2 OCR |
| Bank / card sync in v1 | Regulatory overhead; validate demand first | Manual cost fields + v2 bank integration |
| Expense splitting / debt tracking | Splitwise does this better | Out of scope permanently |
| Gamification (points, badges) | This targets adult families, not kids | Task completion visibility is sufficient |
| Native iOS / Android app in v1 | App Store cycles, separate codebase | Mobile-responsive PWA |
| Role-based content permissions | Full equality in v1 | Admin is membership-only |
| Smart home integrations | Low v1 demand | AI chatbot covers use cases without integration |
| Investment / asset tracking | Distinct domain | Out of scope permanently |
| Contractor / marketplace booking | Third-party complexity | Maintenance scheduling without booking |
| Multi-household per user | Data model complexity | Single active household per user in v1 |
| Grocery lists | Commoditised feature | Out of scope |
| Budget creation and forecasting | Complex UX; tracking is sufficient v1 value | v2 consideration |

---

## Feature Dependencies

```
Auth + User profiles
  → Household creation + member invite (admin model)
    → Onboarding (household type + module selection)
      → Personalised dashboard
        → All modules (only activated ones render)

Home Chores module
  → Task CRUD + recurring + assignments
    → Notification infrastructure (in-app + push)
      → All other reminder features depend on this

Kids Activities module
  → Child profiles (name, DOB — no accounts)
    → Activity CRUD + recurring + per-activity reminders
      → Kids calendar view

Car Maintenance module
  → Car profiles (multiple per household)
    → Service history records (optional cost field)
      → Key date reminders (MOT, tax, service)

Insurance Management module
  → Policy metadata (type, insurer, expiry, contact)
    → PDF document upload (Supabase Storage)
      → Premium cost tracking + payment schedule reminders
        → Document embeddings for RAG (Phase 5 dependency)

Electronics Management module
  → Item registry (name, brand, model, purchase date)
    → Warranty document upload + expiry reminders
      → User manual PDF upload
        → Document embeddings for RAG (Phase 5 dependency)

Unified Calendar (Phase 4)
  → Aggregates: chore due dates, car key dates, insurance expiry/payment dates,
    electronics warranty expiries, kids activities
  → Requires all modules to be implemented before calendar is fully populated

Costs Dashboard (Phase 4)
  → Aggregates: car service costs, insurance premiums, electronics item costs
  → Optional cost fields on relevant records from each module

AI Chatbot & RAG (Phase 5)
  → Document embeddings (insurance docs + user manuals → pgvector)
    → Chatbot answers questions from documents (RAG)
      → Chatbot extracts procedures → creates tasks
  → Tool-calling for live household data queries
  → Depends on: Phases 1-4 (documents uploaded, modules populated)

Notification Infrastructure (Phase 2)
  → All reminder features: chore due dates, car key dates, insurance expiry,
    insurance payments, electronics warranty expiries, kids activities
```

---

## MVP Recommendation (v1)

The MVP proves: (1) the household coordination modules work reliably, and (2) the AI chatbot delivers tangible value by making uploaded documents queryable and actionable.

**Build order:**

1. **Foundation & Onboarding** — auth, household, admin+invite, modular onboarding, dashboard skeleton, real-time, GDPR
2. **Home Chores** — fastest to deliver; validates daily engagement; proves notification infrastructure
3. **Kids Activities** — high value for target audience; relatively simple; builds on notification infra
4. **Tracker Modules & Calendar** — car + insurance + electronics + costs + unified calendar; delivers the tracking core
5. **AI Chatbot & RAG** — the differentiator; requires documents uploaded in Phase 4; makes the product "wow"
6. **Platform & Polish** — mobile responsiveness, PWA, performance

**Defer to v2:**

| Feature | Reason for Deferral |
|---------|---------------------|
| Receipt OCR | Core tracking value must be proven first; OCR adds pipeline complexity |
| Bank / Revolut integration | Regulatory overhead; validate demand via manual tracking |
| Spending dashboards from transactions | Depends on bank integration |
| Model number → auto-fetch user manuals | Feasibility risk; manual PDF upload covers v1 need |
| Ambient AI dashboard cards | Requires data baseline from v1; adds to AI costs |

---

## Phase-Specific Feature Map

| Phase | Features | Research Needed? |
|-------|---------|-----------------|
| 1. Foundation & Onboarding | Auth, household, admin+invite, modular onboarding, real-time sync | No — standard patterns |
| 2. Home Chores | Task CRUD, recurring, assignments, due date reminders | No — standard patterns |
| 3. Kids Activities | Child profiles, activity CRUD, calendar, reminders | No — standard patterns |
| 4. Tracker Modules & Calendar | Car, insurance, electronics (base), costs dashboard, unified calendar | No — standard patterns; PDF upload is standard Supabase Storage |
| 5. AI Chatbot & RAG | Document embedding pipeline, pgvector RAG, chatbot, task creation from chat | YES — PDF parsing, chunking strategy, RAG prompt engineering, cost modelling |
| 6. Platform & Polish | Mobile responsiveness, PWA, camera UX (for v2 OCR readiness), performance | No — standard patterns |

---

## Sources

- Competitor feature analysis: training knowledge (Flatastic, OurHome, Cozi, Splitwise, Centriq — as of August 2025 knowledge cutoff). Confidence: MEDIUM.
- Feature categorisation derived from project requirements in `.planning/REQUIREMENTS.md` and direct user input (2026-03-24). Confidence: HIGH.
- AI feature feasibility based on Phase 1 research (01-RESEARCH.md, 2026-03-24). Confidence: HIGH for RAG architecture.
