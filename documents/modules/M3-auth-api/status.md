# M3 · auth-api — Status

**Status:** done
**Completed:** 2026-06-21

---

## Summary

All 3 tasks for M3 are complete. Login and logout endpoints are live and verified. A foundational `asyncHandler` util was added to propagate async service errors to Express errorHandler (needed for all future modules too).

---

## What was done

### T001 · Login Endpoint
- `auth.service.ts` — `login(email, password)`: queries DB via Prisma, bcrypt-compares password, signs 24h JWT with `{ id, email }` payload; always returns same `'Invalid credentials'` message on failure (no enumeration)
- `auth.controller.ts` — thin `login()` controller: delegates to service, returns `success({ token })`
- `auth.routes.ts` — `POST /login` with `validate(LoginSchema)` + `asyncHandler`
- Added `LoginSchema` to `be/src/shared/schemas.ts` (and synced to `source/shared/` + `fe/shared/`)

### T002 · Logout Endpoint
- `auth.controller.ts` — `logout()`: returns `success(null, 'Logged out')`, no DB access
- `auth.routes.ts` — `POST /logout` (no validate, passes through global auth middleware so requires Bearer token)

### T003 · Auth Middleware Integration
- Pre-complete from M1 — no work needed

### Fix · asyncHandler utility
- Created `be/src/utils/asyncHandler.ts` — wraps async RequestHandlers and calls `next(err)` on rejection, bridging Express 4's lack of native async error handling
- Applied to all async controllers via `asyncHandler(controller.fn)` in route files
- **This util must be used for every async controller in M4–M6**

---

## Verification (live smoke test)

| Scenario | Expected | Result |
|----------|----------|--------|
| `POST /login` valid creds | 200 `{ token }` | ✅ |
| `POST /login` wrong password | 401 `Invalid credentials` | ✅ |
| `POST /login` missing field | 400 `Validation failed` + field errors | ✅ |
| `POST /logout` with valid token | 200 `Logged out` | ✅ |
| `POST /logout` without token | 401 `Unauthorized` | ✅ |
| `tsc --noEmit` | 0 errors | ✅ |

---

## Next

**M4 · tenant-api** — CRUD endpoints for tenants + version history + rollback (depends on M2 ✅, M3 ✅)
