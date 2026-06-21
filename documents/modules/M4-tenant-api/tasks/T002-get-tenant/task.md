# T002: Get Tenant

**Module:** M4 · tenant-api
**Story:** S2
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `GET /api/tenants/:id` — return a single non-deleted tenant with its active config.

## Detail

### Service
```typescript
export const getById = async (id: string) => {
  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    include: {
      configs: {
        where: { isActive: true },
        take: 1,
      },
    },
  })
  if (!tenant) throw new AppError(404, 'Tenant not found')
  return tenant
}
```

### Controller
```typescript
export const getById = async (req: Request, res: Response): Promise<void> => {
  const tenant = await tenantService.getById(req.params.id)
  res.json(success(tenant))
}
```

### Route
```typescript
router.get('/:id', asyncHandler(getByIdController))
```

**Rules:**
- Use `findFirst` with both `id` and `deletedAt: null` — a soft-deleted tenant must return 404, not 200
- Throw `AppError(404, 'Tenant not found')` for both missing and deleted tenants (same message — no enumeration)

## Expectation
`GET /api/tenants/tenant-safeguard` returns SafeGuard with its active config. `GET /api/tenants/nonexistent` returns 404. `GET /api/tenants/<deleted-id>` returns 404.

## Acceptance Criteria
- [ ] Returns 200 with tenant + active config on valid ID
- [ ] Returns 404 for unknown ID
- [ ] Returns 404 for soft-deleted tenant
- [ ] Response uses `success()` helper
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T001
- Blocks: T003, T004, T005

## References
- Architecture: `GET /api/tenants/:id` — tenant + active config; Database Schema — `deletedAt IS NULL`
- Standards: Error handling — throw AppError
