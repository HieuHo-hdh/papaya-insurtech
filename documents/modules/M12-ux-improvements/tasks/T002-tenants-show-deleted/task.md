# T002: FE+BE — TenantsPage: Show Deleted Tenants

**Module:** M12 · ux-improvements
**Story:** S2
**Tags:** FE+BE
**Status:** pending
**Size:** M

## Description
Add a toggle to TenantsPage to include soft-deleted tenants in the list, with a visual "Deleted" indicator column, backed by a BE query param.

## Detail

### BE — `source/be/src/modules/tenants/tenants.service.ts`

Add `showDeleted?: boolean` to `list()`:
```typescript
export const list = async (page: number, pageSize: number, showDeleted = false) => {
  const where = showDeleted ? {} : { deletedAt: null }
  ...
}
```

### BE — `source/be/src/modules/tenants/tenants.controller.ts`

Parse `showDeleted` query param and pass to service:
```typescript
const showDeleted = req.query.showDeleted === 'true'
const result = await tenantsService.list(page, pageSize, showDeleted)
```

### BE — `source/be/src/shared/types.ts` + `source/fe/shared/types.ts`

Add `deletedAt` to `TenantRow` shape:
```typescript
// BE response now includes deletedAt
```

### FE — `source/fe/lib/api/tenants.ts`

Update `TenantRow` to include `deletedAt?: string | null`.

Update `tenantsApi.list`:
```typescript
list: (page = 1, pageSize = 20, showDeleted = false) =>
  apiClient.get<PaginatedTenants>(`/tenants?page=${page}&pageSize=${pageSize}&showDeleted=${showDeleted}`)
```

### FE — `source/fe/pages/tenants/TenantsPage.tsx`

- Add `showDeleted` boolean state (default `false`)
- Add toggle `<Switch>` in toolbar: "Show deleted"
- Pass `showDeleted` to `tenantsApi.list` and `loadTenants`
- Add "Status" column showing `<Tag color="red">Deleted</Tag>` when `record.deletedAt` is set, `<Tag color="green">Active</Tag>` otherwise
- Deleted rows: render with `opacity: 0.5` via `onRow` style or `rowClassName`
- Deleted rows: disable Edit and Delete action buttons (no actions on already-deleted tenants)

## Expectation
- Toggle off (default): list behaves identically to current
- Toggle on: deleted tenants appear with red "Deleted" tag and dimmed row
- Edit/Delete buttons disabled for deleted rows

## Acceptance Criteria
- [ ] BE `GET /tenants?showDeleted=true` returns deleted + active tenants
- [ ] BE `GET /tenants` (no param) returns only active — existing behaviour unchanged
- [ ] `TenantRow` type includes `deletedAt?: string | null`
- [ ] TenantsPage has "Show deleted" switch in toolbar
- [ ] Deleted tenants rendered with red tag + dimmed row
- [ ] Edit and Delete buttons disabled on deleted rows
- [ ] `tsc --noEmit` passes on both BE and FE

## Dependencies
- Depends on: T001
- Blocks: none

## References
- Architecture: Soft delete — `deletedAt` field on Tenant model
- Standards: BE: no business logic in controllers
