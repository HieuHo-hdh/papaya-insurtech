# T002: Logout Endpoint

**Module:** M3 · auth-api
**Story:** S2
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `POST /api/auth/logout` — stateless logout that returns 200. Token invalidation is the client's responsibility (delete from localStorage).

## Detail
No server-side token blacklist. The BE simply returns a success response; the FE discards the token.

### Route — `be/src/modules/auth/auth.routes.ts`
Add to the existing router (after the login route):
```typescript
router.post('/logout', authController.logout)
```

Note: logout does **not** use `validate` middleware (no body expected) and **does** pass through `auth` middleware (the global auth middleware in `app.ts` only excludes `POST /api/auth/login`). A client must send a valid token to call logout — this is intentional.

### Controller — `be/src/modules/auth/auth.controller.ts`
```typescript
export const logout = (_req: Request, res: Response): void => {
  res.json(success(null, 'Logged out'))
}
```

### Response shape
```json
{ "code": 200, "message": "Logged out", "data": null }
```

No service function needed — pure controller response.

## Expectation
`POST /api/auth/logout` with a valid Bearer token returns 200. Without a token it returns 401 (from global `auth` middleware).

## Acceptance Criteria
- [ ] `POST /api/auth/logout` with valid Bearer token returns `{ code: 200, message: 'Logged out' }`
- [ ] `POST /api/auth/logout` without token returns 401 (handled by global auth middleware, not this controller)
- [ ] No DB queries or token storage involved
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T001
- Blocks: none

## References
- Architecture: `POST /api/auth/logout` — stateless, client discards token
- Standards: Controller — thin only; Response helpers — always use success()
