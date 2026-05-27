# BUG: Invitation link redirects to /auth/login in incognito

**Date:** 2026-04-06

Invitation link (`/join/<token>`) redirects to `/auth/login` (no query params) in incognito instead of showing the invite landing page or the inline error card.

Root cause unknown — no middleware exists. Inline error rendering was added for invalid/expired tokens but the redirect still occurs for unauthenticated users. Needs investigation into what triggers the bare `/auth/login` redirect.

**To investigate:**
- What issues the redirect before the page renders (not middleware, not the page itself for valid tokens)
- Whether the token being tested was valid at time of testing
- Whether Supabase SSR client setup or cookie handling could be intercepting the request
