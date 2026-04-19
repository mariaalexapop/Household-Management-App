---
phase: 6
slug: platform-polish
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-19
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + Playwright 1.58.2 |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `vitest run tests/unit/pwa/ --passWithNoTests` |
| **Full suite command** | `vitest run && npx playwright test tests/e2e/pwa.spec.ts tests/e2e/mobile-responsive.spec.ts` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run tests/unit/pwa/ --passWithNoTests`
- **Per wave merge:** Run full suite including e2e
- **Phase gate:** Full suite green before `/gsd:verify-work`

---

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-03-viewport | Viewport export contains width, initialScale, viewportFit | unit | `vitest run tests/unit/pwa/viewport.test.ts` | No — Wave 0 |
| PLAT-03-manifest | Manifest returns name, icons (192+512), display:standalone, start_url | unit | `vitest run tests/unit/pwa/manifest.test.ts` | No — Wave 0 |
| PLAT-03-sw | Service worker file exists and contains install/activate/fetch handlers | unit | `vitest run tests/unit/pwa/sw.test.ts` | No — Wave 0 |
| PLAT-03-mobile | No horizontal scroll at 375px on dashboard, chores, calendar | e2e | `npx playwright test tests/e2e/mobile-responsive.spec.ts` | No — Wave 0 |

---

## Wave 0 Gaps

- [ ] `tests/unit/pwa/viewport.test.ts` — verify viewport export has required fields
- [ ] `tests/unit/pwa/manifest.test.ts` — verify manifest returns installability fields
- [ ] `tests/unit/pwa/sw.test.ts` — verify sw.js exists with required event listeners
- [ ] `tests/e2e/mobile-responsive.spec.ts` — viewport 375px, no horizontal overflow on key pages
