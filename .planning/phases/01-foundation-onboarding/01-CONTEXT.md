---
phase: 1
title: "Foundation & Onboarding — Implementation Context"
created: 2026-03-24
source: discuss-phase session
---

# Phase 1 Context: Foundation & Onboarding

Implementation decisions for the executor agent. These supplement the PLAN.md files — they answer questions the plans left open.

---

## App Identity

- **Code name:** Kinship
- Use "Kinship" in UI copy, page titles, email subjects, and brand references throughout Phase 1.
- Sidebar brand label (from stitch): "Kinship" above nav items.

---

## Design System

Sourced from `/stitch/DESIGN.md` and `screen.png` / `screen 2.png`.

### Colour tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0053dc` | CTAs, active nav, selected state |
| `surface` | `#f7f9fb` | Page canvas / background |
| `surface-container` | `#eaeef1` | Broad functional area backgrounds |
| `surface-container-lowest` | `#ffffff` | Cards, modals |
| `on-surface` | `#2d3337` | All body text — never pure black |
| `outline-variant` | `#acb3b7` | Ghost borders at 15% opacity only (accessibility fallback) |

**No-Line Rule:** Never use 1px solid borders to separate sections. Use background colour shifts instead.

### Typography
- **Headlines / display:** Plus Jakarta Sans
- **Body / labels:** Public Sans
- Pair heavy headline weight with lighter body weight ("Editorial Gap")

### Elevation
- Tonal layering preferred over shadows
- Float shadow (dragging, popovers): `box-shadow: 0 20px 40px rgba(45, 51, 55, 0.06)`
- Ghost border fallback: `outline-variant` at 15% opacity

### Components
- **Cards:** `rounded-lg` (1rem radius) — no smaller radii
- **Primary buttons:** `rounded-full` pill shape, `#0053dc`, subtle `shadow-sm`
- **Module accent buttons:** adopt module colour (e.g. Kids = `#006b62` teal, Car = blue gradient)
- **Inputs:** on focus → background shifts to `surface-container-lowest` + 2px `primary` ghost-border
- **Nav sidebar:** glassmorphism — semi-transparent with `backdrop-blur`

### Dashboard layout
Asymmetric 2-column layout with **varying card heights** (not a uniform grid). Left column: primary content modules (Chores, Recent Activity). Right column: secondary modules (Kids, Car, Electronics). Cards can span different heights to create editorial rhythm.

---

## A. Post-Auth Redirect Flows

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Email/password signup | `/auth/verify-email` | Dedicated page showing the user's email address with "Check your inbox" message |
| Protected page access (unverified email) | `/auth/login` | With query param / message: "Please verify your email before continuing" |
| Google OAuth — first-time user (no household) | `/dashboard` | Dashboard detects no household → triggers onboarding from there |
| Google OAuth — returning user | `/dashboard` | Direct |
| Email/password login | `/dashboard` | Via middleware; redirect to `/onboarding` if no household found |
| Password reset completed | Auto sign-in → `/onboarding` (no household) or `/dashboard` | Never land on `/auth/login` after a successful reset |
| Email verification link clicked | Auto sign-in → `/onboarding` (no household) or `/dashboard` | |

**Middleware logic:** Protected routes check `getUser()`. If no household in `household_members`, redirect to `/onboarding/step-1`. If no verified session, redirect to `/auth/login`.

---

## B. Dashboard Module Cards

### Empty state (no data in module)
Each activated module card shows:
- Module icon + module name
- One-line description of what the module tracks
- Single CTA button: "Add your first [item] →" (e.g. "Add your first chore →", "Add your first car →")

### Populated state (Phase 1 placeholder)
Build the populated card layout now with stubbed/hardcoded content. Phase 2+ plans will replace stubs with real data. This avoids a Phase 2 full layout rewrite.

Populated card structure (stub):
- Module icon + name + "VIEW ALL" link (top right)
- 2–3 placeholder content rows (hardcoded, labelled with `// TODO: Phase N — wire real data`)
- Module-specific accent colour on header

### Non-activated modules
Do **not** appear in the main dashboard grid. Instead, show a small **"Add a module"** section at the bottom of the dashboard with compact cards for each inactive module — each has an "Activate" button that goes to `/settings` (modules section).

### Grid
Asymmetric 2-column layout, varying heights. Responsive: 1 col on mobile, 2 col on tablet+.

---

## C. Settings Page

**Single scrollable page at `/settings`** — all sections on one page, no sub-routes.

### Sections (in order)
1. **Profile** — Display name, avatar upload/change
2. **Household** — Household name, household type (editable)
3. **Modules** — Toggle active modules on/off (ONBD-04); shows module icon, name, current status
4. **Members** — List all household members; admin sees "Remove" action per member (HSLD-07); all members see the list (HSLD-05)
5. **Notifications** — Placeholder section in Phase 1 (actual notification preferences wired in Phase 2+); show "Coming soon" or a disabled toggle UI
6. **Data & Privacy** — GDPR data deletion request button; confirmation modal before action

### Avatar editing
Available in **two places**:
- Inside `/settings` → Profile section (primary edit location)
- Inline on the dashboard → clicking the user's avatar opens a small edit popover (display name + avatar change)

### Admin-only actions
"Remove member" button is only visible to the household admin. Regular members see the members list but no action buttons.

---

## D. Activity Feed

### Phase 1 events (what gets logged)
| Event | Copy template |
|-------|--------------|
| Household created | "[Name] created the [Household Name] household" |
| Member invited | "[Admin name] invited [email] to join" |
| Member joined | "[Name] joined the household" |
| Member removed | "[Admin name] removed [Name] from the household" |
| Module activated | "[Name] activated the [Module Name] module" |
| Module deactivated | "[Name] deactivated the [Module Name] module" |

### Seed entry
On household creation, insert a seed entry: **"You created the [Household Name] household"** — so the feed is never empty on first visit.

### Links
**No hyperlinks in Phase 1 entries** — plain text only. Deep links to module items are added in Phase 2+ when module pages exist.

### Dashboard card
Show **5 most recent entries** on the dashboard "Recent Activity" card. Include a "View all" link that goes to a full `/activity` page (or `/settings` activity section — Phase 1 can use a simple full-page list at `/activity`).

### Display format
- Actor name (bold) + action text
- Time-ago format: "15 minutes ago", "Yesterday at 6:45 PM"
- Actor avatar (small, 24px) as leading icon

---

## code_context

```
stitch/screen.png      — dashboard reference (module cards, sidebar, activity feed, chat FAB)
stitch/screen 2.png    — onboarding reference (Kinship brand, step sidebar, household type cards)
stitch/screen 3.png    — marketing/landing page concept (not Phase 1 scope)
stitch/DESIGN.md       — full design system (colours, typography, elevation, components)
```

No application code exists yet — fresh repo, no scaffold.

---

*Created: 2026-03-24 — discuss-phase session*
