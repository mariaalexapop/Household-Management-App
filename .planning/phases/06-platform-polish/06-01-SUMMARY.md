---
phase: 06-platform-polish
plan: 01
subsystem: pwa-infrastructure
tags: [viewport, pwa, manifest, service-worker, icons, mobile]
dependency_graph:
  requires: []
  provides: [viewport-meta, pwa-manifest, service-worker, app-icons, safe-area-css]
  affects: [src/app/layout.tsx, src/app/globals.css]
tech_stack:
  added: []
  patterns: [next-viewport-export, next-manifest-convention, minimal-service-worker, programmatic-png-generation]
key_files:
  created:
    - src/app/manifest.ts
    - src/components/ServiceWorkerRegistration.tsx
    - public/sw.js
    - public/icons/icon-192x192.png
    - public/icons/icon-512x512.png
    - public/icons/icon-maskable.png
    - public/icons/apple-touch-icon.png
    - public/icons/favicon.ico
    - public/favicon.ico
    - tests/unit/pwa/viewport.test.ts
    - tests/unit/pwa/manifest.test.ts
    - tests/unit/pwa/sw.test.ts
  modified:
    - src/app/layout.tsx
    - src/app/globals.css
decisions:
  - "Viewport export with maximumScale 1 to prevent iOS input auto-zoom (inputs already 16px+)"
  - "Manual service worker (no Serwist/next-pwa) since offline mode is out of scope"
  - "Production-only SW registration to avoid caching issues during development"
  - "Pure Node.js PNG generation (no external deps) for placeholder K icons"
metrics:
  duration_seconds: 187
  completed: "2026-04-19T20:28:44Z"
  tasks: 3
  files: 14
---

# Phase 6 Plan 1: Viewport Meta, PWA Manifest, Service Worker & App Icons Summary

Viewport export fixes mobile rendering (device-width instead of 980px default), PWA manifest + minimal service worker enable add-to-home-screen installability, and placeholder "K" icons provide all required icon sizes.

## What Was Done

### Task 1: Viewport export + PWA metadata + safe area CSS + service worker infrastructure

- Added `export const viewport: Viewport` to layout.tsx with width device-width, initialScale 1, maximumScale 1, viewportFit cover, themeColor #5b76fe
- Updated metadata export with applicationName, appleWebApp config, formatDetection, and icon paths
- Created `src/app/manifest.ts` using Next.js file convention (auto-served at /manifest.webmanifest)
- Created `src/components/ServiceWorkerRegistration.tsx` client component (production-only registration)
- Created `public/sw.js` minimal service worker with install, activate, fetch handlers (network-only)
- Added safe area CSS utilities (.safe-area-bottom, .safe-area-top) and body env(safe-area-inset-bottom) padding
- Added 16px font-size rule for input/select/textarea to prevent iOS auto-zoom

### Task 2: Generate PWA app icons and favicon

- Generated all icons programmatically using pure Node.js (no canvas/sharp/ImageMagick dependencies needed)
- Created icon-192x192.png (192x192), icon-512x512.png (512x512), icon-maskable.png (512x512), apple-touch-icon.png (180x180)
- Generated favicon.ico (32x32 + 16x16 multi-size ICO)
- All icons are blue (#5b76fe) background with white "K" letter -- placeholder for designed icon later
- Cleaned up generation script after use

### Task 3: Wave 0 unit tests

- viewport.test.ts: 4 tests verifying width, initialScale, viewportFit, themeColor
- manifest.test.ts: 6 tests verifying name, short_name, display, start_url, icon sizes, maskable icon
- sw.test.ts: 4 tests verifying file existence and install/activate/fetch event listeners
- All 14 tests passing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mocked next/font/google in viewport test**
- **Found during:** Task 3
- **Issue:** Importing layout.tsx in vitest triggers Space_Grotesk() which fails because next/font/google is not available in test environment
- **Fix:** Added vi.mock('next/font/google') at top of viewport.test.ts to return dummy font objects
- **Files modified:** tests/unit/pwa/viewport.test.ts
- **Commit:** f0c7e5f

## Verification Results

- All 14 unit tests pass (vitest run tests/unit/pwa/)
- next build succeeds with 0 errors, 0 warnings
- All icon files are valid PNGs (verified with `file` command)
- favicon.ico is valid MS Windows icon resource with 32x32 and 16x16 sizes

## Commits

| Hash | Message |
|------|---------|
| f0c7e5f | feat(06-01): viewport meta, PWA manifest, service worker, app icons, Wave 0 tests |
