# T001: FE — 401 Auto-Redirect to Login

**Module:** M12 · ux-improvements
**Story:** S1
**Tags:** FE
**Status:** pending
**Size:** S

## Description
When any API call returns HTTP 401, clear the token and redirect to `/login` automatically instead of silently returning a 401 response that pages must handle individually.

## Detail

**File:** `source/fe/lib/api/client.ts`

In the `request()` function, check `res.status` before parsing JSON. On 401:
1. Remove token from localStorage
2. Redirect via `window.location.href = '/login'`
3. Return a typed sentinel `{ code: 401, message: 'Unauthorized' }` so TypeScript is satisfied

```
fetch() → res.status === 401 → removeItem('token') → window.location.href = '/login'
                             → return { code: 401, message: 'Unauthorized' }
fetch() → res.status !== 401 → res.json() (existing behaviour)
```

Individual pages currently guard with `if (!hasToken()) navigate('/login')` in `useEffect`. Those guards remain — they protect against rendering with no token on load. The new client-level guard handles expiry mid-session.

## Expectation
- Any authenticated page where the token expires mid-session redirects to `/login` on the next API call
- No silent 401 responses bubble up to page-level error handlers
- Login page itself is unaffected (it posts to `/auth/login` which never returns 401)

## Acceptance Criteria
- [ ] `request()` checks `res.status === 401` before calling `res.json()`
- [ ] Token removed from localStorage on 401
- [ ] `window.location.href = '/login'` triggered on 401
- [ ] All other responses unchanged
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none
- Blocks: none

## References
- Standards: `documents/planning/coding-standards.md` — FE API client pattern
