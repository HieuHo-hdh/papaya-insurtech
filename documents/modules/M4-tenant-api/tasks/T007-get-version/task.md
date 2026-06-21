# T007: Get Specific Version

**Module:** M4 · tenant-api
**Story:** S7
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `GET /api/tenants/:id/versions/:versionId` — return a single config version by its `tenant_configs.id`.

## Detail

### Service
```typescript
export const getVersion = async (tenantId: string, versionId: string) => {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  const version = await prisma.tenantConfig.findFirst({
    where: { id: versionId, tenantId },
  })
  if (!version) throw new AppError(404, 'Version not found')

  return version
}
```

### Controller + Route
```typescript
// controller
export const getVersion = async (req: Request, res: Response): Promise<void> => {
  const version = await versionsService.getVersion(req.params.tenantId, req.params.versionId)
  res.json(success(version))
}

// route (add to versions.routes.ts)
router.get('/:versionId', asyncHandler(versionsController.getVersion))
```

**Rules:**
- `versionId` is the `tenant_configs.id` (UUID), not the `version` integer — it's in the URL as `:versionId`
- Always check tenant exists first, then the version belongs to that tenant (`where: { id: versionId, tenantId }`) — prevents cross-tenant data leakage
- Two separate 404 messages: `'Tenant not found'` and `'Version not found'`

## Expectation
`GET /api/tenants/tenant-safeguard/versions/<config-uuid>` returns that specific config row. Using a version UUID from a different tenant returns 404.

## Acceptance Criteria
- [ ] Returns 200 with the specific `tenant_configs` row
- [ ] Returns 404 if tenant not found
- [ ] Returns 404 if version not found or belongs to a different tenant
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T006
- Blocks: T008

## References
- Architecture: `GET /api/tenants/:id/versions/:vId`
- Standards: Error handling — AppError; thin controller
