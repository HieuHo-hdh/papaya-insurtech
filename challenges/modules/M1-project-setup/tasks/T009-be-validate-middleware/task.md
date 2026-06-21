# T009: BE Validate Middleware

**Module:** M1 · project-setup
**Story:** S9
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `be/src/middleware/validate.ts` — a Zod request body validation middleware applied at route level.

## Detail
Create `challenges/be/src/middleware/validate.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from '@/utils/AppError'

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      throw new AppError(
        400,
        'Validation failed',
        result.error.flatten().fieldErrors as Record<string, string[]>,
      )
    }
    req.body = result.data
    next()
  }
```

Usage at route level (for reference — actual usage in M3+):
```typescript
router.post('/login', validate(LoginSchema), authController.login)
router.post('/tenants', validate(TenantConfigSchema), tenantsController.create)
```

The middleware replaces `req.body` with the parsed (type-safe) Zod output, so downstream controllers get the validated data directly.

## Expectation
A request with an invalid body (e.g. missing required field) returns `400 { code: 400, message: 'Validation failed', details: { fieldName: ['error msg'] } }` without reaching the controller.

## Acceptance Criteria
- [ ] `be/src/middleware/validate.ts` exports `validate(schema)` returning Express middleware
- [ ] Invalid body returns 400 with `details` field errors matching Zod's `flatten().fieldErrors`
- [ ] Valid body sets `req.body` to the Zod-parsed output (coerced types applied)
- [ ] Middleware uses `AppError` — not a direct `res.json` call
- [ ] TypeScript passes with no errors

## Dependencies
- Depends on: T002, T004, T008
- Blocks: none (M3+ routes will use this)

## References
- Architecture: API Endpoints (validation at POST /api/tenants, POST /api/auth/login)
- Standards: Validation middleware — Zod, applied at route level
