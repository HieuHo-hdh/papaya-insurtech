# T008: BE AppError Class

**Module:** M1 · project-setup
**Story:** S8
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `be/src/utils/AppError.ts` — the custom error class thrown by services and caught by `errorHandler` middleware.

## Detail
Create `source/be/src/utils/AppError.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

Also implement `be/src/middleware/errorHandler.ts` which catches all thrown errors (both `AppError` and unexpected `Error`):
```typescript
import { Request, Response, NextFunction } from 'express'
import { AppError } from '@/utils/AppError'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      ...(err.details && { details: err.details }),
    })
  }
  console.error(err)
  res.status(500).json({ code: 500, message: 'Internal server error' })
}
```

Register `errorHandler` as the last middleware in `app.ts` (`app.use(errorHandler)`).

Usage in services (for reference — actual usage is in M3+):
```typescript
throw new AppError(404, 'Tenant not found')
throw new AppError(400, 'Validation failed', { amount: ['must be ≥ 0'] })
```

## Expectation
Throwing `new AppError(404, 'Not found')` in any route returns `{ code: 404, message: 'Not found' }`. Unhandled errors return `{ code: 500, message: 'Internal server error' }`.

## Acceptance Criteria
- [ ] `be/src/utils/AppError.ts` exports `AppError` with `statusCode`, `message`, `details`
- [ ] `be/src/middleware/errorHandler.ts` catches `AppError` and returns correct HTTP status
- [ ] Unhandled `Error` returns 500 without leaking stack traces
- [ ] `errorHandler` is registered as the last `app.use()` in `app.ts`
- [ ] TypeScript passes with no errors

## Dependencies
- Depends on: T002
- Blocks: T009, T010

## References
- Architecture: API Response Shapes (error shape)
- Standards: Error handling — throw AppError, errorHandler middleware catches it
