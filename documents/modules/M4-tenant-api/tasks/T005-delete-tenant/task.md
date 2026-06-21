# T005: Soft-Delete Tenant

**Module:** M4 · tenant-api
**Story:** S5
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `DELETE /api/tenants/:id` — soft-delete by setting `deletedAt = now()`. The tenant and all its config versions remain in the DB but are hidden from all queries.

## Detail

### Service
```typescript
export const remove = async (id: string): Promise<void> => {
  const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  await prisma.tenant.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
```

### Controller + Route
```typescript
// controller
export const remove = async (req: Request, res: Response): Promise<void> => {
  await tenantService.remove(req.params.id)
  res.json(success(null, 'Tenant deleted'))
}

// route
router.delete('/:id', asyncHandler(removeController))
```

**Rules:**
- Check `deletedAt: null` before deleting — return 404 if already deleted or not found (same message)
- Do **not** physically delete the row or any `tenant_configs` rows — all history must be preserved
- After deletion, `GET /api/tenants/:id` and `GET /api/tenants` must not return this tenant

## Expectation
`DELETE /api/tenants/:id` on a live tenant sets `deleted_at` in the DB and returns 200. Subsequent `GET /api/tenants/:id` returns 404. `GET /api/tenants` list does not include the deleted tenant.

## Acceptance Criteria
- [ ] Returns 200 `{ data: null, message: 'Tenant deleted' }`
- [ ] `tenants.deletedAt` is set to a non-null timestamp in DB
- [ ] `tenant_configs` rows are untouched
- [ ] After deletion, `GET /api/tenants/:id` returns 404
- [ ] After deletion, tenant does not appear in `GET /api/tenants`
- [ ] Deleting an already-deleted tenant returns 404
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T003
- Blocks: none

## References
- Architecture: `DELETE /api/tenants/:id` — soft-delete; Database Schema — `deleted_at` nullable
- Standards: Error handling — AppError(404)
