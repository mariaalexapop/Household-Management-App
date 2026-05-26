# Handoff: Kinship — Household Management App

## Overview

**Kinship** is a household management web app for families to keep their domestic life organised in one place: chores, kids' activities, calendar, car maintenance, insurance policies, and home electronics — with an AI assistant ("Ask Kinship") on top for help with renewals, paperwork, and admin extraction.

The demo household is **The Harpers** (Manchester, UK) — Ava + Noah, kids Iris (9) and Finn (6), one Ford Focus + one VW Polo, four insurance policies, five appliances.

The deliverable in this handoff is a clickable hi-fi prototype with:

- 22 desktop screens (1440 × 900) covering the public site, auth, onboarding, dashboard, every module, and supporting flows
- 2 mobile screens (390 × 780) for the dashboard and chores views
- A design-canvas overview that shows every screen side-by-side, grouped by section
- Hash-routed deep linking — every screen is reachable at `#<route>` and the URL stays in sync

---

## About the design files

The files in `prototype/` are **design references created in HTML + React (via inline Babel)** — visual + interactive specifications for what the app should look and feel like. They are **not production code to ship as-is**.

Your task is to **recreate these designs in the target codebase's existing environment** (likely React, but Vue / SvelteKit / Next.js / Remix etc. all work) using its established conventions: component primitives, design tokens, routing, state management, and data fetching. If no codebase exists yet, pick the framework that fits the team and implement against it.

The prototype reads from a static `DEMO` object in `tokens.jsx`. In production every list (chores, activities, cars, policies, electronics, members, activity feed) should come from your backend; the structure of that object is a reasonable starting point for the data model.

## Fidelity

**High-fidelity.** Colors, type, spacing, radii, copy and interactions are intentional and final-ish. The developer should match them pixel-for-pixel using the codebase's component primitives (buttons, inputs, modals, etc.). If the codebase already has primitives that do the same job, prefer those over re-implementing — keep behaviour and visual weight equivalent.

A second visual direction (**B · Warm editorial**) exists as tokens in `tokens.jsx` but is **parked**. Build against Direction A only.

---

## Tech notes for the prototype

- **React 18.3.1** loaded via UMD from unpkg, transpiled at runtime by `@babel/standalone`. This is a prototype-only setup — do not replicate.
- **Routing** is plain hash-based (`useHash()` in `app.jsx`). The route map (`ROUTES`) is the spec of which screens exist.
- **All shared scope.** Each `<script type="text/babel">` block is concatenated at runtime; components are global (`window.Avatar`, `window.Sidebar`, etc). In production this should become a normal module graph.
- **Inline styles everywhere.** That's a prototype shortcut so tokens flow through as a `t` prop. Replace with your styling system (Tailwind / CSS modules / styled-components / vanilla-extract / whatever the codebase uses).
- **Icons** are hand-rolled inline SVG (`Ic.*` in `primitives.jsx`) at stroke 1.75, 18×18 viewBox 24×24, lucide-style. Swap for `lucide-react` 1:1 — names match.
- **Fonts** are loaded via Google Fonts CSS. Move to your asset pipeline / self-host as needed.

---

## Design tokens (Direction A — the one we shipped)

All values live in `tokens.jsx` as `TOK.A`. Reproduce them in your token system.

### Type

| Role | Family | Notes |
|---|---|---|
| Display | `Space Grotesk` (400/500/600/700) | Headings, brand, top-bar titles |
| Body | `Noto Sans` (400/500/600/700) | Everything else |
| Mono | `JetBrains Mono` (400/500) | Codes, registration plates, policy numbers, route slugs |

Typical sizes in the prototype: page title 26–32px / 600, card title 15px / 600, body 13–14px, meta 11–12px / 500.

### Color — neutral

| Token | Hex |
|---|---|
| `canvas` | `#ffffff` |
| `surface` | `#f5f5f7` |
| `surface2` | `#f0f0f2` |
| `surface3` | `#e8e8ec` |
| `text` | `#1c1c1e` |
| `textMuted` | `#555a6a` |
| `textFaint` | `#a5a8b5` |
| `border` | `#e0e2e8` |
| `borderStrong` | `#c7cad5` |

### Color — semantic

| Token | Hex | Surface (light bg) |
|---|---|---|
| `primary` | `#5b76fe` | `#eef0ff` |
| `primaryPressed` | `#2a41b6` | — |
| `success` | `#00b473` | `#d6f5eb` |
| `destructive` | `#e53e3e` | `#fbd4d4` |
| `warn` | `#d97706` | `#fde7c6` |
| `accent` | `#5b76fe` | `#eef0ff` |

### Color — module pastels (light bg + dark text + dot)

Each module owns a hue. Use the `light` value behind module surfaces, `dark` for headings on top of `light`, and `dot` for badges / status pips.

| Module | Light | Dark | Dot |
|---|---|---|---|
| Chores | `#c3faf5` | `#187574` | `#187574` |
| Kids | `#ffc6c6` | `#600000` | `#e05252` |
| Car | `#ffe6cd` | `#7a4000` | `#c67d2a` |
| Insurance | `#d9d4ff` | `#3d2a8a` | `#6a55d9` |
| Electronics | `#d4f5c3` | `#1f5c1f` | `#3f9b3f` |
| Calendar | `#ffd8f4` | `#7a1060` | `#b34a9c` |

### Elevation & ring

```
ring        : 0 0 0 1px #e0e2e8                                // hairline border (no shadow)
ringFocus   : 0 0 0 1px #e0e2e8, 0 0 0 3px #5b76fe              // focused input / button
float       : 0 20px 40px rgba(28,28,30,0.06), 0 0 0 1px #e0e2e8 // modal / popover / sidebar
```

### Radius

| Token | px |
|---|---|
| `radiusCard` | 12 |
| `radiusLg` | 16 |
| `radiusHero` | 40 (marketing hero only) |
| Pills / buttons | 999 (fully rounded) |
| Mono chips | 4 |
| Module chips | 8 |

### Spacing

The prototype uses an ad-hoc 4-px grid (4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 56). Common card padding: `16px 20px` for headers, `12px 20px` for rows. Sidebar gutter: 24px. Page gutter: 32px.

---

## Information architecture

```
Public
├─ Marketing landing          /#marketing
├─ Sign in                    /#auth
├─ Reset password             /#reset
├─ Onboarding (4 steps)       /#onboarding
└─ "You're all set"           /#welcome

Main app
├─ Dashboard                  /#dash
├─ Notifications              /#notifications
├─ Calendar                   /#calendar
└─ Ask Kinship (chat)         /#chat

Modules
├─ Home Chores                /#chores
│   └─ New task               /#chores/new
├─ Kids Activities            /#kids
│   └─ New activity           /#kids/new
├─ Car Maintenance            /#car
│   └─ Log service            /#car/service
├─ Insurance                  /#insurance
│   └─ Policy detail          /#insurance/policy
└─ Electronics                /#electronics

Account
├─ Settings                   /#settings
└─ Invite member              /#invite

Mobile (separate viewport)
├─ Mobile dash                /#mobile
└─ Mobile chores              /#mobile/chores
```

All routes are listed in `ROUTES` at the top of `app.jsx`.

---

## Screen-by-screen spec

> For each screen, the prototype source file is the source of truth for layout details, exact copy, and inline styles. The summaries below are what to look for and what each screen is *for*.

### Public

**Marketing landing** — `screens-intro.jsx → Marketing`
Above-the-fold pitch + module grid + footer CTA. Hero uses `radiusHero` (40 px) on a tinted-canvas block. Six module tiles using the module pastels above. CTA → `/#auth`.

**Sign in** — `screens-intro.jsx → Auth`
Centered card, email + password, "Sign in with Google" / "with Apple" rows. Links: forgot → `/#reset`, sign up → `/#onboarding`.

**Reset password** — `screens-support.jsx → Reset`
Single-field email reset. Success state shows confirmation copy.

**Onboarding** — `screens-intro.jsx → Onboarding`
4-step wizard: Household → Type → Modules → Members. Step header is a row of pills with the active step highlighted in `primary`. "Continue" advances → final step posts to `/#welcome`.

**You're all set (Welcome)** — `screens-support.jsx → Welcome`
Confetti-free success page with a single CTA to `/#dash` and a row of recommended next actions.

### Main app

**Dashboard** — `screens-dashboard.jsx → DashA`
The most layout-dense screen. Structure:

- Left: `Sidebar` (sticky, 240 px, lists every module + account)
- Top: `TopBar` (title `The Harper Household`, search input, bell → `/#notifications`, member avatars)
- Body: 12-col grid of `ModuleCardA` blocks, one per module + a wider chores card. Each card has a coloured header (module pastel), title row, "See all →" link to the module page, and 3–4 preview rows. The AI floating bubble (`AiFab`) sits bottom-right and links to `/#chat`.

**Notifications** — `screens-support.jsx → Notifications`
List of grouped alerts ("Today", "Earlier this week"). Each row has a leading module dot, title, time, and an inline action button where relevant ("Renew", "Mark done", "Review").

**Calendar** — `screens-core.jsx → Calendar`
Weekly grid (Mon–Sun). Each event is a coloured pill using the activity category's module hue. Hover reveals child + location + assigned parent.

**Ask Kinship (chat)** — `screens-extras.jsx → Chat`
Full-page conversation. Left rail with prior threads, right column with the active conversation. User bubble is `primarySurface` with `primary` text; assistant bubble is plain `canvas` with `border`. Input pinned to bottom with file-attach + send.

### Modules

**Home Chores** — `screens-core.jsx → Chores`
Sticky header with filter pills (All / Today / This week / By room). Table of chores: title, area chip, due, assignee avatar, status (todo / progress / done) as a coloured badge. Recurring chores show a small loop glyph. "New task" button → `/#chores/new`.

**New task / New activity** — `screens-support.jsx → AddTask`
Right-side drawer (sheet). Fields: title, area/category, due date, assignee (avatar select), recurrence dropdown, attach photo. Primary CTA "Add task".

**Kids Activities** — `screens-core.jsx → Kids`
Two child columns side by side (Iris / Finn). Each column is a vertical timeline of upcoming activities with category-coloured dots and an assigned parent avatar on the right.

**Car Maintenance** — `screens-modules.jsx → Car`
Two car cards (Ford Focus, VW Polo). Each shows reg plate (mono chip), mileage, three countdown chips (MOT / Tax / Service), and a service-history table below. MOT chip turns `warn` when within 60 days. "Log service" → `/#car/service`.

**Log service** — `screens-support.jsx → CarService`
Modal-style form: car selector, date, mileage at service, type (full / interim / MOT / repair), cost, garage, notes, attach receipt.

**Insurance** — `screens-modules.jsx → Insurance`
Policy table: type, insurer, policy number (mono), renewal date, premium, billing cycle. Rows due within 60 days show a `warn`-coloured pip and "Renew" inline action. Click row → `/#insurance/policy`.

**Policy detail** — `screens-support.jsx → PolicyDetail`
Header with insurer logo placeholder, policy meta in a key-value grid, "Coverage" section, "Renewal steps" list (4 steps extracted by Kinship AI), "Documents" with PDF placeholder thumbnails.

**Electronics** — `screens-modules.jsx → Electronics`
Grid of appliance cards: image placeholder, name, brand, room chip, warranty expiry, receipt date, status pip (`expiring` if warranty < 6 months out, `ok` otherwise).

### Account

**Settings** — `screens-extras.jsx → Settings`
Left sub-nav (Profile / Household / Members / Notifications / Billing / Security). Right pane shows the active section. Members table lists everyone with avatar, role, permission level, and a row menu (`Ic.more`).

**Invite member** — `screens-support.jsx → Invite`
Form with email + role select (Admin / Member / View only) + a copy-link block with a token. Success state shows "Invite sent to <email>".

### Mobile

**Mobile dash** — `screens-mobile.jsx → MobileDash`
390 × 780 phone frame. Tabs at the bottom (Home / Chores / Calendar / Chat / Settings). Body is a vertical stack of compact module cards mirroring the desktop dashboard.

**Mobile chores** — `screens-mobile.jsx → MobileChores`
Same chore list as desktop, single-column, with sticky filter pills and a FAB for "New task".

---

## Interactions & behaviour

- **Routing.** Every clickable affordance updates `location.hash`. In production, replace with your framework's router (Next.js `useRouter`, React Router, TanStack Router…). Route names are stable — treat the strings in `ROUTES` as the URL contract.
- **Sidebar.** Active item is highlighted with `primarySurface` background, `primary` text, and a left edge bar. Hover state is `surface2`.
- **Buttons** (`Btn` in `primitives.jsx`). Variants: `primary` (solid `primary`), `secondary` (canvas + border), `ghost` (transparent), `destructive`. Sizes: `sm` (28 px) / `md` (36 px). All buttons round to 999 (pill).
- **Pills / badges** (`Badge`). Default `surface2` + `textMuted`. Pass `bg/fg` to recolour for module hues or status.
- **Inputs.** 36 px tall, `canvas` background, `border`, 8 px radius. Focus ring uses `ringFocus`.
- **Modal / drawer.** Drawer slides in from the right at 480 px wide on desktop, full-screen sheet on mobile. Backdrop is `rgba(28,28,30,0.32)`.
- **AI floating bubble** (`AiFab`). 56 px circle, `primary` bg, sparkle icon. Sits 24 px from bottom-right. On hover expands to show a hint label.
- **Status badges.** `todo` → `surface2 / textMuted`. `progress` → `warnSurface / warn`. `done` → `successSurface / success`.
- **MOT / renewal warnings.** Within 60 days, the chip is `warnSurface` + `warn`. Past due is `destructiveSurface` + `destructive`.

### Animations & motion

The prototype is mostly static. Reasonable additions when building:

- Route transitions: 120 ms cross-fade.
- Drawer / modal: 180 ms slide + 120 ms backdrop fade.
- Status changes (chore mark-done, etc): 200 ms ease-out.
- AI bubble hover: 150 ms.

Keep motion subtle — the design is calm and informational, not playful.

---

## State management (notes for implementation)

| Domain | Shape | Where used |
|---|---|---|
| `household` | `{ id, name, plan, createdAt }` | TopBar title, Settings |
| `members` | `[{ id, name, initials, role, perm, color, avatarUrl? }]` | TopBar avatars, Sidebar bottom, Settings → Members |
| `kids` | same shape as members, role: 'Child' | Kids screen |
| `chores` | `[{ id, title, area, dueAt, assigneeId, status, recur, recurRule? }]` | Chores, Dashboard preview, Mobile chores |
| `activities` | `[{ id, childId, title, startAt, cat, parentId, location }]` | Kids, Calendar, Dashboard preview |
| `cars` | `[{ id, name, reg, mileage, motDue, taxDue, serviceDue, history:[{when,what,cost}] }]` | Car page, Dashboard preview |
| `policies` | `[{ id, type, insurer, number, expiry, premium, billing }]` | Insurance, Dashboard preview, Policy detail |
| `electronics` | `[{ id, name, brand, room, warrantyUntil, receiptDate, status, receiptUrl? }]` | Electronics |
| `activityFeed` | `[{ id, actor, verb, target, when }]` | Notifications |

The current static demo data lives in `DEMO` at the bottom of `tokens.jsx` — reuse it as fixtures during the build.

---

## Assets

- **Fonts:** Google Fonts — Space Grotesk, Noto Sans, JetBrains Mono. Self-host or use the team's font pipeline.
- **Icons:** Inline SVG in `primitives.jsx` (`Ic.*`). Drop-in replace with `lucide-react`; names align with Lucide.
- **Images:** None real yet. The prototype uses the `Placeholder` component (striped panel + monospace label) wherever a photo, PDF thumbnail, or appliance image should appear. Replace with the team's image component + actual user-uploaded media.
- **Brand mark:** A simple "K" square in `primary` at 22 px and 32 px is used as a placeholder logo. Design hasn't shipped a final mark.

---

## Files in this handoff

```
prototype/
  Kinship Household App.html   # entry — loads React + all jsx files in order
  app.jsx                      # routing + Overview canvas + Proto shell
  tokens.jsx                   # TOK.A / TOK.B token sets + DEMO data
  primitives.jsx               # Avatar, Badge, Btn, Placeholder, ModChip,
                               # Screen, Sidebar, TopBar, AiFab, Ic.*
  design-canvas.jsx            # DesignCanvas / DCSection / DCArtboard / DCPostIt
  screens-intro.jsx            # Marketing, Auth, Onboarding
  screens-support.jsx          # Notifications, Invite, AddTask, PolicyDetail,
                               # CarService, Reset, Welcome
  screens-dashboard.jsx        # DashA + ModuleCardA + SeeAll
  screens-core.jsx             # Chores, Kids, Calendar
  screens-modules.jsx          # Car, Insurance, Electronics
  screens-extras.jsx           # Chat, Settings
  screens-mobile.jsx           # Phone, MobileTab, MobileDash, MobileChores
```

To run the prototype as-is: open `Kinship Household App.html` in a browser. Navigate via the on-canvas overview, the URL hash, or the in-app sidebar.

---

## Recommended build order

1. **Tokens + primitives first.** Stand up the color / type / radius / shadow tokens. Build `Avatar`, `Badge`, `Btn`, `Pill`, `Card`, `Input`, `Drawer`, icons. Get the dashboard module-card pastels matching.
2. **App shell.** Sidebar + TopBar + routing. Aim to land on a blank dashboard with the chrome correct.
3. **Dashboard.** Lay out the grid with empty `ModuleCard` shells. Wire each "See all →" to the module route.
4. **Modules one at a time** in this order: Chores → Kids → Car → Insurance → Electronics. Each module is dashboard-card → list page → detail/add screens.
5. **Supporting flows.** Notifications, Calendar, Chat, Settings, Invite.
6. **Public side.** Marketing, Auth, Reset, Onboarding, Welcome.
7. **Mobile.** Reuse desktop primitives at the smaller breakpoint; the mobile screens here are just confirming the responsive bottom-tab pattern.

---

## Open questions for product / design

- Permissions model: the prototype has Admin / Member / View only — confirm the actual capability matrix per module.
- AI scope: "Kinship AI" appears in the activity feed (PDF extraction), the chat screen, and as the floating FAB. Confirm which surfaces ship in v1.
- Notifications: are renewal warnings push, email, in-app, or all three?
- Real brand assets (logo, marketing imagery, appliance photos) are still placeholders.
- Direction B was parked — confirm it stays parked before deleting from the token file.
