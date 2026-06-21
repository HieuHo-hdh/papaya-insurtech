# T008: process-claim Endpoint

**Module:** M5 · process-claim-engine
**Story:** S8
**Tags:** BE
**Status:** done
**Size:** S

## Description
Implement `POST /api/tenants/:id/process-claim` — thin controller/route that calls `processClaim()` and returns the result.

## Detail

The route is already mounted in `app.ts` (M1):
```typescript
app.use('/api/tenants/:tenantId/process-claim', claimRoutes)
```

### Controller — `be/src/modules/claims/claims.controller.ts`
```typescript
import type { Request, Response } from 'express'
import { processClaim } from '@/engine/processClaim'
import { success } from '@/utils/response'

export const processClaimHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await processClaim(req.params.tenantId, req.body)
  res.json(success(result))
}
```

### Route — `be/src/modules/claims/claims.routes.ts`
```typescript
import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { asyncHandler } from '@/utils/asyncHandler'
import { ClaimDataSchema } from '@/shared/schemas'
import * as claimsController from './claims.controller'

const router = Router({ mergeParams: true })

router.post('/', validate(ClaimDataSchema), asyncHandler(claimsController.processClaimHandler))

export default router
```

**Mount note:** `app.ts` mounts this at `/api/tenants/:tenantId/process-claim`. The route inside the router is `POST /`, so the full path is:
```
POST /api/tenants/:tenantId/process-claim
```
This matches architecture.md `POST /api/tenants/:id/process-claim`. ✅

**Validation:** `ClaimDataSchema` validates `{ claimType, amount, customFields }` — already defined in `shared/schemas.ts`. The `submittedAt` is NOT part of the request body (auto-set by `processClaim`).

## Expectation
`POST /api/tenants/tenant-safeguard/process-claim` with `{ "claimType": "OUTPATIENT", "amount": 30000, "customFields": { "employee_id": "E123" } }` returns 200 with the full `ProcessClaimResult`.

## Acceptance Criteria
- [ ] `POST /api/tenants/:id/process-claim` returns 200 with `ProcessClaimResult`
- [ ] Invalid `claimType` or negative `amount` → 400 from `validate` middleware
- [ ] Missing required custom fields → 400 from `processClaim`
- [ ] Disabled claim type → 400
- [ ] Unknown tenant → 404
- [ ] No DB write happens (pure computation)
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T007
- Blocks: T009

## References
- Architecture: `POST /api/tenants/:id/process-claim`; ClaimData Input (no submittedAt from client)
- Standards: Controller — thin; asyncHandler for async controllers
