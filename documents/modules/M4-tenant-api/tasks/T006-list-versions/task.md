# T006: List Version History

**Module:** M4 · tenant-api
**Story:** S6
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `GET /api/tenants/:id/versions` — paginated list of all config versions for a tenant, newest first.

## Detail
This route lives in the **versions module** (`src/modules/versions/`), not tenants. In `app.ts`, it is already mounted at `/api/tenants/:tenantId/versions` with `mergeParams: true`, so `req.params.tenantId` is available.

### Service — `be/src/modules/versions/versions.service.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import { AppError } from '@/utils/AppError'

const prisma = new PrismaClient()

export const listVersions = async (tenantId: string, page = 1, pageSize = 20) => {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  const where = { tenantId }
  const [versions, total] = await Promise.all([
    prisma.tenantConfig.findMany({
      where,
      orderBy: { version: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenantConfig.count({ where }),
  ])
  return { versions, total, page, pageSize }
}
```

### Controller — `be/src/modules/versions/versions.controller.ts`
```typescript
export const listVersions = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 20
  const result = await versionsService.listVersions(req.params.tenantId, page, pageSize)
  res.json(paginated(result.versions, result.total, result.page, result.pageSize))
}
```

### Route — `be/src/modules/versions/versions.routes.ts`
```typescript
import { Router } from 'express'
import { asyncHandler } from '@/utils/asyncHandler'
import * as versionsController from './versions.controller'

const router = Router({ mergeParams: true })

router.get('/', asyncHandler(versionsController.listVersions))
export default router
```

**Rules:**
- Always verify tenant exists (and is not deleted) before querying its versions
- `mergeParams: true` is already set on the router stub from M1 — do not remove it
- Order by `version: 'desc'` — newest first

## Expectation
`GET /api/tenants/tenant-safeguard/versions` returns page 1 of SafeGuard's version history (1 version after seed, more after T004 updates).

## Acceptance Criteria
- [ ] Returns paginated list of `tenant_configs` rows for the tenant
- [ ] Ordered newest version first
- [ ] Returns 404 if tenant not found or deleted
- [ ] `req.params.tenantId` correctly resolved (mergeParams works)
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T003, T004
- Blocks: T007, T008

## References
- Architecture: `GET /api/tenants/:id/versions` — paginated version history
- Standards: Controller — thin; `paginated()` helper
