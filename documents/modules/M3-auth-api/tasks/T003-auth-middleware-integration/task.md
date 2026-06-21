# T003: Auth Middleware Integration

**Module:** M3 · auth-api
**Story:** S3
**Tags:** BE
**Status:** done
**Size:** S

## Description
Auth middleware applied to all routes except `POST /api/auth/login`.

## Detail
**This task is already complete from M1 (T010).**

What was implemented in M1:
- `be/src/middleware/auth.ts` — verifies Bearer JWT, attaches `req.user = { id, email }`, throws `AppError(401)` on missing/invalid token
- `be/src/types/express.d.ts` — augments `Express.Request` with `user?: { id, email }`
- `be/src/app.ts` — registers auth globally with login bypass:
  ```typescript
  app.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/api/auth/login') return next()
    return auth(req, res, next)
  })
  ```

No further work required. Verify during T001/T002 testing that protected routes return 401 without a token.

## Expectation
Any endpoint other than `POST /api/auth/login` returns 401 when called without a valid Bearer token.

## Acceptance Criteria
- [x] `be/src/middleware/auth.ts` exists and verifies JWT
- [x] `POST /api/auth/login` bypasses auth middleware
- [x] All other routes protected — missing/invalid token → 401
- [x] `req.user` is set for downstream controllers on valid token
- [x] `tsc --noEmit` passes

## Dependencies
- Depends on: none (done in M1)
- Blocks: none

## References
- Architecture: Auth endpoints
- Standards: Auth middleware — protect all routes except login
