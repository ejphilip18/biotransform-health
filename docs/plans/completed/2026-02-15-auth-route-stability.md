# Auth Route Stability (2026-02-15)

## Purpose / Big Picture
Make `/api/auth` reliably reachable so Convex Auth client actions can reach Next.js auth endpoint in this Next.js App Router app.

## Current State
`POST /api/auth` returned 404 because there was no `src/app/api/auth/route.ts` in the repository and the middleware-only approach did not expose an explicit route handler for the Convex Auth action payloads.

## Work Completed
- Added `src/app/api/auth/route.ts` with `POST` handler that proxies `auth:signIn` / `auth:signOut` actions.
- Implemented request validation (`POST` method, CORS check), token/refresh handling, and auth cookie writes/deletes.
- Restored middleware matcher to the standard App Router pattern so auth and page protection still apply.
- Avoided importing `proxyAuthActionToConvex` from `@convex-dev/auth/nextjs/server` (not exported by installed `0.0.90` package entry points).

## Validation
- `POST /api/auth` now returns JSON response instead of `404`.
- `GET /api/auth` returns `405`.
- `POST /api/auth` with malformed sign-in arguments returns `400` with structured error output.
- `POST /api/auth` with sign-out clears auth cookies and returns `200`.

## Decision Log
- 2026-02-15: Implemented explicit route handler instead of relying solely on middleware-level proxying to remove 404 failure mode in this runtime setup.

## Outcome
`POST /api/auth` requests are no longer resolved as app pages, fixing the repeated 404 behavior.
