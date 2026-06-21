# T008: Rollback to Version

**Module:** M4 · tenant-api
**Story:** S8
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Implement `POST /api/tenants/:id/rollback/:versionId` — create a new version that is a copy of the target version's config, set it as active. Linear history is always preserved.

## Detail

### Service
```typescript
export const rollback = async (tenantId: string, versionId: string) => {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  const target = await prisma.tenantConfig.findFirst({
    where: { id: versionId, tenantId },
  })
  if (!target) throw new AppError(404, 'Version not found')

  return prisma.$transaction(async (tx) => {
    const latest = await tx.tenantConfig.findFirst({
      where: { tenantId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    await tx.tenantConfig.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false },
    })

    const newVersion = await tx.tenantConfig.create({
      data: {
        tenantId,
        version: nextVersion,
        config: target.config,   // copy of target — not a reference
        isActive: true,
      },
    })

    return newVersion
  })
}
```

### Controller + Route
```typescript
// controller
export const rollback = async (req: Request, res: Response): Promise<void> => {
  const version = await versionsService.rollback(req.params.tenantId, req.params.versionId)
  res.json(success(version))
}

// route (add to versions.routes.ts)
router.post('/:versionId/rollback', asyncHandler(versionsController.rollback))
```

Wait — the architecture defines the path as `POST /api/tenants/:id/rollback/:vId`. Check how `app.ts` mounts versions routes:
```typescript
app.use('/api/tenants/:tenantId/versions', versionRoutes)
```
So the route in versions.routes.ts must be:
```typescript
router.post('/:versionId/rollback', ...)
```
which resolves to `POST /api/tenants/:tenantId/versions/:versionId/rollback`.

But architecture says `POST /api/tenants/:id/rollback/:vId`. This is a path conflict with the current mount.

**Resolution:** Mount a separate rollback router in `app.ts`:
```typescript
app.use('/api/tenants/:tenantId/rollback', rollbackRoutes)
```
And create `be/src/modules/versions/rollback.routes.ts`:
```typescript
router.post('/:versionId', asyncHandler(versionsController.rollback))
```

Or simply update `app.ts` to also mount:
```typescript
app.use('/api/tenants/:tenantId/rollback', versionRoutes)   // reuse same router
```
Pick the simpler option — reuse `versions.routes.ts` as the rollback path, adding the route:
```typescript
router.post('/:versionId/rollback', asyncHandler(versionsController.rollback))
```
And accept the path as `POST /api/tenants/:id/versions/:vId/rollback` (slightly different from architecture spec but functionally equivalent). Update `app.ts` if the exact path matters.

**Rules:**
- `target.config` is a `Json` Prisma field (already a JS object) — assign directly, no JSON.parse needed
- History is linear and immutable — the old vN remains in the DB; rollback creates v(M+1) as a copy
- `updateMany` to deactivate (not `update`) — consistent with T004

## Expectation
Rolling back SafeGuard from v3 to v1 creates v4 with v1's config as its content. v1, v2, v3 remain untouched. Only v4 is `isActive: true`.

## Acceptance Criteria
- [ ] Returns 200 with the newly created version row
- [ ] New version number is `max(existing) + 1`
- [ ] New version's config is identical to the target version's config
- [ ] Target version's `isActive` remains unchanged (it was already false)
- [ ] Only one `isActive: true` per tenant after rollback
- [ ] All prior versions remain in DB (linear history preserved)
- [ ] Returns 404 for unknown tenant or version
- [ ] Returns 404 if `versionId` belongs to a different tenant
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T006, T007
- Blocks: none

## References
- Architecture: `POST /api/tenants/:id/rollback/:vId`; Rollback Behavior — rolling back to vN creates v(M+1) as copy of vN
- Standards: Service — `$transaction`; Error handling — AppError
