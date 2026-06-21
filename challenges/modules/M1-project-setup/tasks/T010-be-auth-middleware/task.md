# T010: BE Auth Middleware

**Module:** M1 · project-setup
**Story:** S10
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `be/src/middleware/auth.ts` — JWT verification middleware that attaches `req.user` and protects all routes except `POST /api/auth/login`.

## Detail
Extend Express `Request` type to include `user`. Create `challenges/be/src/types/express.d.ts`:
```typescript
declare namespace Express {
  interface Request {
    user?: { id: string; email: string }
  }
}
```

Create `challenges/be/src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '@/config/env'
import { AppError } from '@/utils/AppError'

export const auth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Unauthorized')
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string }
    req.user = payload
    next()
  } catch {
    throw new AppError(401, 'Invalid or expired token')
  }
}
```

Register in `app.ts` as a global middleware with an exclusion for the login path:
```typescript
app.use((req, res, next) => {
  if (req.path === '/api/auth/login' && req.method === 'POST') return next()
  auth(req, res, next)
})
```

JWT payload shape for reference (M3 will produce these): `{ id: string, email: string, iat: number, exp: number }`.

Token lifetime is 24h (set when signing in M3 — auth middleware only verifies, doesn't sign).

## Expectation
A request to any protected endpoint without a valid `Authorization: Bearer <token>` header returns `401 { code: 401, message: 'Unauthorized' }`. A valid token sets `req.user` and calls `next()`.

## Acceptance Criteria
- [ ] `be/src/middleware/auth.ts` exports `auth` middleware
- [ ] Missing or malformed Authorization header returns 401
- [ ] Expired or invalid JWT returns 401
- [ ] Valid JWT sets `req.user` with `id` and `email`
- [ ] `POST /api/auth/login` bypasses auth middleware
- [ ] `Express.Request` is augmented with `user` in `types/express.d.ts`

## Dependencies
- Depends on: T002, T005, T008
- Blocks: none (M3 service will use JWT signing; this handles verification)

## References
- Architecture: Auth endpoints, Seeded admin credentials
- Standards: Auth middleware — protect all routes except login
