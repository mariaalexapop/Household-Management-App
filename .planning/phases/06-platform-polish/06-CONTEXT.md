---
phase: 6
slug: platform-polish
status: confirmed
created: 2026-04-19
---

# Phase 6 — Context

## Scope (confirmed with user)

1. **Mobile responsiveness** — audit and fix all pages for phone browsers (375px+)
2. **PWA installability** — web manifest, app icons, basic service worker for add-to-home-screen. NO offline mode.
3. **Performance audit** — Lighthouse audit, bundle size optimization, LCP/CLS fixes.

## Explicitly Out of Scope

- Offline mode / offline-first architecture
- Camera capture UX for document uploads
- Swipe gestures
- Native mobile apps

## User Context

- User has not tested on mobile yet — systematic audit needed
- No known pain points reported

## Current State

- Responsive patterns GOOD: Tailwind sm/md/lg breakpoints used consistently
- Navigation GOOD: AppHeader + HamburgerMenu with mobile hamburger
- **Viewport meta: MISSING** (critical — no viewport export in layout.tsx)
- **PWA: NOTHING exists** (no manifest, service worker, icons)
- **App icons: MISSING** (no favicon, no apple-touch-icon)
- Tables: GOOD (overflow-x-auto)
- Chatbot: GOOD (responsive dock with mobile backdrop)
- Font scaling: could benefit from responsive typography

## Requirements

- PLAT-03: App is mobile-responsive and usable on phone browsers

## Success Criteria (from ROADMAP)

1. All primary flows (managing tasks, viewing calendar, scanning documents, chatting) work on phone browsers without horizontal scrolling or broken layouts.
2. The app meets PWA installability criteria (manifest, service worker) and can be added to a home screen.
