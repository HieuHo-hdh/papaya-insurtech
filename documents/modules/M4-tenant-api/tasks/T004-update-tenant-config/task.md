# T004: Update Tenant Config

**Module:** M4 · tenant-api
**Story:** S4
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Implement `PUT /api/tenants/:id` — validate the new config, auto-increment version, deactivate the current active version, create a new active version. Returns the updated tenant.

## Detail

### Request body shape
```typescript
{ config: TenantConfig }
```

Add `UpdateTenantSchema` to `be/src/shared/schemas.ts`:
```typescript
export const UpdateTenantSchema = z.object({
  config: TenantConfigSchema,
})
```

### Service
```typescript
export const update = async (id: string, config: TenantConfig) => {
  const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  return prisma.$transaction(async (tx) => {
    // get next version number
    const latest = await tx.tenantConfig.findFirst({
      where: { tenantId: id },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    // deactivate current active
    await tx.tenantConfig.updateMany({
      where: { tenantId: id, isActive: true },
      data: { isActive: false },
    })

    // create new active version
    await tx.tenantConfig.create({
      data: { tenantId: id, version: nextVersion, config: config as object, isActive: true },
    })

    return tx.tenant.findFirst({
      where: { id },
      include: { configs: { where: { isActive: true }, take: 1 } },
    })
  })
}
```

### Controller + Route
```typescript
// controller
export const update = async (req: Request, res: Response): Promise<void> => {
  const tenant = await tenantService.update(req.params.id, req.body.config)
  res.json(success(tenant))
}

// route
router.put('/:id', validate(UpdateTenantSchema), asyncHandler(updateController))
```

**Rules:**
- Verify tenant exists and is not deleted **before** opening the transaction
- `updateMany` to deactivate (not `update`) — safer if data somehow has multiple active rows
- `nextVersion = (latestVersion ?? 0) + 1` — always monotonically increasing
- Linear history is always preserved — rollback (T008) also uses this pattern by copying an old config as a new version

## Expectation
`PUT /api/tenants/tenant-safeguard` with a modified config creates version 2, deactivates version 1, returns the tenant with the new active config. Calling it again creates version 3.

## Acceptance Criteria
- [ ] Returns 200 with updated tenant + new active config
- [ ] Previous version's `isActive` is set to `false`
- [ ] New version number is `max(existing) + 1`
- [ ] Only one `isActive: true` per tenant after the call
- [ ] Returns 404 for unknown or deleted tenant
- [ ] Invalid config returns 400 with field errors
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T003
- Blocks: T006, T007, T008

## References
- Architecture: `PUT /api/tenants/:id` — auto-creates new version; Rollback Behavior (linear history)
- Standards: Service — `$transaction`; Error handling — AppError
