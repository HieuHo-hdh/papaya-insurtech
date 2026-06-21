# T001: Login Endpoint

**Module:** M3 · auth-api
**Story:** S1
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Implement `POST /api/auth/login` — validate email + password against DB, sign a 24h JWT, return it to the client.

## Detail

### Service — `be/src/modules/auth/auth.service.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '@/config/env'
import { AppError } from '@/utils/AppError'

const prisma = new PrismaClient()

export const login = async (email: string, password: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AppError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Invalid credentials')

  return jwt.sign(
    { id: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '24h' },
  )
}
```

**Always use the same error message** (`'Invalid credentials'`) for both "user not found" and "wrong password" — no enumeration.

### Controller — `be/src/modules/auth/auth.controller.ts`
```typescript
import type { Request, Response } from 'express'
import * as authService from './auth.service'
import { success } from '@/utils/response'

export const login = async (req: Request, res: Response): Promise<void> => {
  const token = await authService.login(req.body.email, req.body.password)
  res.json(success({ token }))
}
```

### Route — `be/src/modules/auth/auth.routes.ts`
```typescript
import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { LoginSchema } from '@/shared/schemas'
import * as authController from './auth.controller'

const router = Router()
router.post('/login', validate(LoginSchema), authController.login)
export default router
```

`LoginSchema` is already defined in `be/src/shared/schemas.ts`:
```typescript
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
```
If it's not there, add it.

### Response shape
```json
{ "code": 200, "message": "OK", "data": { "token": "<jwt>" } }
```

Error on bad credentials:
```json
{ "code": 401, "message": "Invalid credentials" }
```

## Expectation
`POST /api/auth/login` with `{ "email": "admin@papaya.dev", "password": "Admin@1234" }` returns a 200 with a JWT. Wrong credentials return 401.

## Acceptance Criteria
- [ ] `POST /api/auth/login` with correct credentials returns `{ data: { token } }` with a valid 24h JWT
- [ ] Wrong password returns 401 `'Invalid credentials'` (same message regardless of which field is wrong)
- [ ] Missing `email` or `password` returns 400 via `validate` middleware
- [ ] JWT payload contains `{ id, email }` and is verifiable with `env.JWT_SECRET`
- [ ] Controller is thin — no bcrypt/jwt logic inside it
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none (M2 ✅ — DB seeded with admin user)
- Blocks: T002

## References
- Architecture: Auth endpoints; Seeded admin `admin@papaya.dev / Admin@1234`; API Response Shapes
- Standards: Controller — thin only; Service — all business logic; Error handling — throw AppError
