# Deferred Items — Phase 04

## Pre-existing (out of scope)

- `src/app/(app)/cars/page.tsx` imports `./CarsClient` which does not exist on disk.
  - Discovered during: 04-08 execution (tsc run)
  - Status: pre-existing, unrelated to electronics module
  - Suggested owner: 04-06 (cars UI plan) if that plan delivered incomplete state
