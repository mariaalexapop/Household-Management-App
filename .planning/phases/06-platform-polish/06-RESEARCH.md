# Phase 6: Platform & Polish - Research

**Researched:** 2026-04-19
**Domain:** Mobile responsiveness, PWA installability, performance optimization
**Confidence:** HIGH

## Summary

Phase 6 polishes the completed Kinship app for production readiness across three areas: mobile responsiveness on phone browsers (375px+), PWA installability (manifest + service worker for add-to-home-screen), and Lighthouse performance optimization.

The app already uses Tailwind mobile-first patterns with sm/md/lg breakpoints, a responsive HamburgerMenu navigation, and overflow-x-auto on tables. The critical gap is a **missing viewport meta tag** in layout.tsx -- without this, mobile browsers render the page at desktop width and scale it down, making ALL mobile styling ineffective. This is the single highest-impact fix.

For PWA, the recommended approach is the **manual setup** documented in the official Next.js PWA guide (no Serwist needed since offline mode is explicitly out of scope). A static `app/manifest.ts`, a minimal `public/sw.js`, and generated app icons are sufficient for installability. Serwist adds unnecessary complexity when offline caching is not required.

**Primary recommendation:** Fix viewport meta tag first, then add PWA manifest + minimal service worker, then run Lighthouse and fix specific issues.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAT-03 | App is mobile-responsive and usable on phone browsers | Viewport meta tag fix, mobile audit patterns, Tailwind responsive utilities, safe area insets, touch target sizing |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 (installed) / 16.2.4 (latest) | Framework | Already in use; provides manifest file convention + viewport metadata API |
| tailwindcss | 4.x | Responsive styling | Already in use; mobile-first breakpoints, container queries |
| react | 19.2.4 | UI | Already in use |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @next/bundle-analyzer | 16.2.4 | Bundle visualization | Performance audit; wraps next config to generate treemap |
| sharp | (latest) | Image optimization | Next.js Image component uses this for production image optimization; may already be installed by Vercel |

### NOT Needed
| Library | Reason Not Needed |
|---------|------------------|
| @serwist/next / serwist | Overkill -- no offline mode needed. Manual SW per Next.js official guide is simpler |
| next-pwa / @ducanh2912/next-pwa | Deprecated in favor of Serwist; also overkill for this scope |
| web-push | Push notifications already handled by Inngest; not in Phase 6 scope |
| workbox | Serwist wraps this; not needed without offline caching |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual SW | Serwist | Serwist adds offline caching, precaching, runtime strategies. Only worthwhile if offline mode is added later (v2). Manual SW is ~15 lines for installability. |
| @next/bundle-analyzer | source-map-explorer | bundle-analyzer integrates with Next.js config natively; source-map-explorer requires manual source map extraction |

**Installation:**
```bash
npm install -D @next/bundle-analyzer
```

No other new packages needed. The PWA setup is entirely custom files.

## Architecture Patterns

### Viewport Meta Tag (CRITICAL -- Fix First)

Next.js App Router manages viewport through the `viewport` export, NOT manual `<meta>` tags. The current `layout.tsx` is missing this entirely.

**Pattern: Static viewport export in root layout**
```typescript
// src/app/layout.tsx
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,        // Prevents zoom on input focus (iOS)
  viewportFit: 'cover',   // Enables safe-area-inset-* for notched phones
  themeColor: '#5b76fe',  // Kinship primary color
}
```
**Source:** [Next.js generateViewport docs](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)

**Why `maximumScale: 1`:** Prevents the jarring zoom-on-focus behavior on iOS when tapping input fields. The app already has properly sized inputs (16px+ font), so pinch-to-zoom is not needed for accessibility.

**Why `viewportFit: 'cover'`:** Required for `env(safe-area-inset-*)` CSS variables to work on notched iPhones.

### PWA File Structure
```
src/app/
  manifest.ts          # Dynamic manifest (Next.js file convention)
  layout.tsx           # Add viewport export + manifest link via metadata
public/
  sw.js                # Minimal service worker (static file)
  icons/
    icon-192x192.png   # Required for installability
    icon-512x512.png   # Required for installability
    icon-maskable.png  # Maskable icon for Android adaptive icons
    apple-touch-icon.png  # 180x180 for iOS home screen
    favicon.ico        # Browser tab favicon
```

### Manifest Pattern (Next.js File Convention)
```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kinship - One place for your household',
    short_name: 'Kinship',
    description: 'Track everything your family owns, owes, and needs to do.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#5b76fe',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```
**Source:** [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

### Minimal Service Worker (No Offline)
```javascript
// public/sw.js
// Minimal service worker for PWA installability.
// No caching strategy -- app requires network connectivity.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Required: fetch handler (even if passthrough) for some browsers
self.addEventListener('fetch', (event) => {
  // Network-only: no caching, no offline support
  // This handler satisfies older browser installability checks
})
```
**Source:** [MDN PWA Installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

### Service Worker Registration
```typescript
// Register in root layout or a client component loaded on every page
// src/components/ServiceWorkerRegistration.tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
    }
  }, [])
  return null
}
```

### Metadata Export for PWA
```typescript
// Add to src/app/layout.tsx metadata export
export const metadata: Metadata = {
  title: 'Kinship - One place for your household',
  description: 'Kinship helps families track everything they own, owe, and need to do.',
  applicationName: 'Kinship',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kinship',
  },
  formatDetection: {
    telephone: false,  // Prevent phone number auto-detection
  },
}
```

### Mobile Responsiveness Patterns

**Safe area insets for notched phones:**
```css
/* Add to globals.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Touch target minimum (48x48px):**
```html
<!-- All interactive elements should have min-h-12 min-w-12 or p-3 -->
<button className="min-h-12 min-w-12 flex items-center justify-center">
```

**Input font size (prevent iOS zoom):**
```css
/* Inputs must be 16px+ to prevent iOS auto-zoom */
input, select, textarea {
  font-size: 16px; /* or use text-base in Tailwind */
}
```

**Responsive form layout:**
```html
<!-- Stack on mobile, side-by-side on desktop -->
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <input ... />
  <input ... />
</div>
```

**Modal/dialog mobile pattern:**
```html
<!-- Full-screen on mobile, centered on desktop -->
<div className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-xl">
```

### Bundle Analyzer Setup
```typescript
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer'

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = { /* existing config */ }

export default withAnalyzer(nextConfig)
```

```bash
# Run analysis
ANALYZE=true npm run build
```

### Anti-Patterns to Avoid
- **Adding Serwist for installability only:** Massive overkill. Serwist's value is offline caching + precaching. A 15-line manual SW achieves installability.
- **Using `<meta name="viewport">` in layout JSX:** Next.js App Router manages viewport through the `viewport` export. Manual meta tags will conflict.
- **Setting `maximumScale: 5` or omitting it:** On iOS, inputs with `font-size < 16px` trigger auto-zoom. Either enforce 16px+ inputs OR set `maximumScale: 1`.
- **Putting sw.js in src/app/:** Service workers must be in `/public/` for the correct scope. The `app/sw.ts` pattern is for Serwist only (it compiles to public/).
- **Ignoring apple-touch-icon:** Safari on iOS ignores the PWA manifest for home screen icons and uses `<link rel="apple-touch-icon">` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon generation | Manual resizing in Photoshop | [RealFaviconGenerator](https://realfavicongenerator.net/) or [Maskable.app](https://maskable.app/) | Handles all sizes, formats, maskable safe zones, favicon.ico |
| Bundle analysis | Custom webpack stats parsing | @next/bundle-analyzer | Generates interactive treemap, integrates with Next.js config |
| Lighthouse CI | Manual audits | `npx lighthouse` CLI or Chrome DevTools | Automated, reproducible, can run in CI |
| Image optimization | Manual image compression | Next.js `<Image>` component | Automatic format conversion (WebP/AVIF), lazy loading, size optimization |
| Font loading | Manual `@font-face` | `next/font` (already in use) | Automatic font optimization, no layout shift, self-hosted |

**Key insight:** The app already uses next/font correctly with Space_Grotesk and Noto_Sans. No font optimization work needed -- just verify font-display behavior.

## Common Pitfalls

### Pitfall 1: Missing Viewport Tag Makes All Mobile CSS Useless
**What goes wrong:** Without `<meta name="viewport" content="width=device-width">`, mobile browsers render pages at ~980px width and scale down. All Tailwind responsive breakpoints (sm:, md:) fire at desktop widths.
**Why it happens:** Next.js App Router does NOT add a default viewport meta tag. It must be explicitly exported.
**How to avoid:** Add `export const viewport: Viewport` to `src/app/layout.tsx` FIRST, before any other mobile work.
**Warning signs:** App looks tiny on phones; pinch-to-zoom reveals desktop layout.

### Pitfall 2: iOS Input Auto-Zoom
**What goes wrong:** When a user taps an input field on iOS Safari, the browser zooms in if the input font-size is less than 16px.
**Why it happens:** iOS Safari auto-zooms to make small text readable in inputs. This is by design.
**How to avoid:** Ensure all `<input>`, `<select>`, `<textarea>` elements use `text-base` (16px) or larger. Alternatively, set `maximumScale: 1` in viewport (trade-off: disables pinch-to-zoom entirely).
**Warning signs:** Page zooms in when tapping form fields; user must manually zoom out.

### Pitfall 3: PWA Manifest Missing Required Fields
**What goes wrong:** Browser does not show install prompt despite having a manifest.
**Why it happens:** Missing required fields: `name` OR `short_name`, `start_url`, `display` (must be standalone/fullscreen/minimal-ui), icons at 192px AND 512px.
**How to avoid:** Use the exact manifest structure from the Architecture Patterns section. Test with Chrome DevTools > Application > Manifest panel.
**Warning signs:** Lighthouse PWA audit fails with "Web app manifest does not meet installability requirements."

### Pitfall 4: Service Worker Caching in Development
**What goes wrong:** During development, the service worker caches pages and serves stale content. Hot reload stops working.
**Why it happens:** Even a minimal SW with a fetch handler can interfere if it returns cached responses.
**How to avoid:** The network-only SW pattern (empty fetch handler) avoids this. Additionally, only register SW in production: `if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator)`.
**Warning signs:** Changes not appearing after save; need to hard-refresh or clear site data.

### Pitfall 5: Safe Area Insets Not Applying
**What goes wrong:** Content overlaps the notch/home indicator on modern iPhones.
**Why it happens:** `env(safe-area-inset-*)` only works when `viewport-fit=cover` is set in the viewport meta tag.
**How to avoid:** Include `viewportFit: 'cover'` in the viewport export. Then use `env(safe-area-inset-bottom)` for bottom navigation/FAB elements.
**Warning signs:** Chatbot FAB hidden behind iPhone home indicator; header behind notch.

### Pitfall 6: Large Client Bundle from Icon Libraries
**What goes wrong:** Lighthouse reports large JavaScript bundle; TTI is slow.
**Why it happens:** Importing from `lucide-react` without tree-shaking, or importing entire utility libraries.
**How to avoid:** The project already uses named imports from lucide-react (good). Run bundle analyzer to identify any other large imports. Common culprits: date-fns locale bundles, zod full bundle.
**Warning signs:** Bundle analyzer shows large chunks from a single library.

## Code Examples

### Complete Root Layout with Viewport + PWA Metadata
```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Noto_Sans } from 'next/font/google'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600'],
})

const notoSans = Noto_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#5b76fe',
}

export const metadata: Metadata = {
  title: 'Kinship - One place for your household',
  description: 'Kinship helps families track everything they own, owe, and need to do.',
  applicationName: 'Kinship',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kinship',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
```
**Source:** [Next.js generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport), [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

### Safe Area CSS for Notched Phones
```css
/* globals.css addition */
/* Safe area padding for notched devices (iPhone X+) */
.safe-area-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.safe-area-top {
  padding-top: max(0px, env(safe-area-inset-top));
}
```

### Mobile Audit Checklist Pattern
```
For each page, verify:
1. No horizontal scroll at 375px width
2. All text readable without zooming
3. All buttons/links have 44px+ touch targets
4. Forms stack vertically on mobile
5. Modals/dialogs are full-screen or near-full on mobile
6. Date pickers are usable on touch (not tiny calendar grids)
7. Tables scroll horizontally within container (not page)
8. Images don't overflow container
9. Navigation is accessible via hamburger menu
10. Chatbot FAB doesn't overlap critical content
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-pwa (webpack plugin) | Manual SW or Serwist | 2024 | next-pwa deprecated; Serwist is successor but manual is fine without offline |
| `<meta name="viewport">` in _document.js | `export const viewport` in layout.tsx | Next.js 14+ (App Router) | Type-safe, no manual HTML, managed by framework |
| SW required for installability | SW optional (Chromium) | Chrome 2024 update | Manifest alone triggers install prompt in Chrome/Edge; SW still recommended |
| FID (First Input Delay) | INP (Interaction to Next Paint) | March 2024 | Core Web Vitals responsiveness metric changed; measures all interactions |
| Manual font loading | next/font | Next.js 13+ | Zero-CLS font loading, self-hosted, no external requests |

**Deprecated/outdated:**
- `next-pwa` npm package: Use Serwist or manual approach instead
- `<meta name="viewport">` in `_document.js` or layout JSX: Use `viewport` export
- FID metric in Lighthouse: Replaced by INP in March 2024

## Open Questions

1. **App icon source image**
   - What we know: Need 192px, 512px, maskable, and apple-touch-icon versions
   - What's unclear: Does the project have a source logo/SVG to generate icons from?
   - Recommendation: Create a placeholder icon (letter "K" in Kinship primary color #5b76fe on white). Replace with designed icon when available. Use RealFaviconGenerator to produce all sizes from one 512px+ source.

2. **Specific pages with mobile issues**
   - What we know: User identified cars (complex forms with date pickers), costs (data table), and chatbot dock as areas needing audit
   - What's unclear: Exact breakpoints where layouts break; specific components that overflow
   - Recommendation: Systematic audit at 375px (iPhone SE) and 390px (iPhone 14) widths in Chrome DevTools. Fix issues per page.

3. **react-day-picker mobile behavior**
   - What we know: App uses react-day-picker v9.14.0 for date picking
   - What's unclear: How well it handles touch on small screens; whether custom styling is needed
   - Recommendation: Test at 375px width. If calendar grid is too small, consider using native `<input type="date">` on mobile as a fallback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + Playwright 1.58.2 |
| Config file | vitest.config.ts, playwright.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-03-viewport | Viewport meta tag rendered correctly | unit | `npx vitest run tests/unit/viewport.test.ts -x` | No -- Wave 0 |
| PLAT-03-manifest | Manifest returns required PWA fields | unit | `npx vitest run tests/unit/manifest.test.ts -x` | No -- Wave 0 |
| PLAT-03-sw | Service worker registers successfully | e2e | `npx playwright test tests/e2e/pwa.spec.ts` | No -- Wave 0 |
| PLAT-03-mobile | No horizontal scroll at 375px on key pages | e2e | `npx playwright test tests/e2e/mobile-responsive.spec.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/viewport.test.ts` -- verify viewport export contains required fields
- [ ] `tests/unit/manifest.test.ts` -- verify manifest returns name, icons, display, start_url
- [ ] `tests/e2e/pwa.spec.ts` -- verify SW registration and manifest link in HTML
- [ ] `tests/e2e/mobile-responsive.spec.ts` -- viewport width 375px, no horizontal overflow on dashboard/chores/calendar

## Sources

### Primary (HIGH confidence)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official PWA setup for App Router (v16.2.4, updated 2026-04-15)
- [Next.js generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) - Viewport metadata API
- [MDN PWA Installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) - Installability criteria per browser
- [Chrome Lighthouse PWA Audit](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest) - Manifest requirements for Lighthouse

### Secondary (MEDIUM confidence)
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Serwist setup (not recommended for this phase, but documented for reference)
- [Next.js Performance Guide](https://justinmalinow.com/blog/nextjs-performance-optimization-guide) - LCP/CLS optimization patterns
- [Core Web Vitals Guide](https://eastondev.com/blog/en/posts/dev/20251219-nextjs-core-web-vitals/) - INP/LCP/CLS targets and fixes

### Tertiary (LOW confidence)
- PWA icon sizes checklist (dev.to, hashnode) - Community-sourced icon size recommendations; cross-verified with MDN

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing stack + official Next.js APIs; no new libraries needed except optional bundle-analyzer
- Architecture: HIGH - Patterns from official Next.js docs (updated April 2026) and MDN; verified against actual codebase
- Pitfalls: HIGH - Viewport issue confirmed by codebase inspection; iOS auto-zoom is well-documented; SW caching issues are universal
- PWA: HIGH - Installability criteria verified across MDN, Chrome docs, and Next.js official guide

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (stable domain; PWA criteria change rarely)
