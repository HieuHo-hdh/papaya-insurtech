# T001: List Tenants

**Module:** M4 · tenant-api
**Story:** S1
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `GET /api/tenants` — paginated list of non-deleted tenants with their active config.

## Detail

### Service — `be/src/modules/tenants/tenants.service.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import { paginated } from '@/utils/response'

const prisma = new PrismaClient()

export const list = async (page = 1, pageSize = 20) => {
  const where = { deletedAt: null }
  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        configs: {
          where: { isActive: true },
          take: 1,
        },
      },
    }),
    prisma.tenant.count({ where }),
  ])
  return { tenants, total, page, pageSize }
}
```

### Controller — `be/src/modules/tenants/tenants.controller.ts`
```typescript
export const list = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 20
  const result = await tenantService.list(page, pageSize)
  res.json(paginated(result.tenants, result.total, result.page, result.pageSize))
}
```

### Route — `be/src/modules/tenants/tenants.routes.ts`
```typescript
router.get('/', asyncHandler(listController))
```

Response shape (from `paginated()` helper):
```json
{
  "code": 200, "message": "OK",
  "data": {
    "data": [{ "id": "...", "name": "SafeGuard", "configs": [{ "isActive": true, "config": {...} }] }],
    "total": 3, "page": 1, "pageSize": 20
  }
}
```

**Rules:**
- `deletedAt: null` filter is mandatory — never return soft-deleted tenants
- Include only the active config (`isActive: true`) per tenant
- Default page=1, pageSize=20; both must be positive integers (coerce from query string)

## Expectation
`GET /api/tenants` returns paginated list of 3 tenants (from seed) each with their active config embedded.

## Acceptance Criteria
- [ ] Returns 200 with paginated shape (`data`, `total`, `page`, `pageSize`)
- [ ] Soft-deleted tenants do not appear
- [ ] Each tenant object includes the active `configs[0]`
- [ ] `?page=2&pageSize=1` returns 1 tenant on page 2
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none (M2 ✅ — 3 tenants seeded)
- Blocks: T002, T003, T004, T005

## References
- Architecture: `GET /api/tenants` — paginated, active tenants only; API Response Shapes (paginated)
- Standards: Controller — thin; Service — all DB logic; `paginated()` helper always used
