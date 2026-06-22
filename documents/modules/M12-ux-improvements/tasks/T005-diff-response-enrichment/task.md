# T005: BE+FE — Diff Response: Tenant Identity + Section Field (Option C)

**Module:** M12 · ux-improvements
**Story:** S5
**Tags:** FE+BE
**Status:** pending
**Size:** M

## Description
Enrich the diff API response so it is self-contained: include tenant name/id on each side, and tag each diff entry with its top-level config section.

## Detail

### BE — `source/be/src/shared/types.ts`

Update `DiffEntry` and `DiffResponse`:

```typescript
export type ConfigSection = 'branding' | 'claimTypes' | 'approvalRules' | 'notifications' | 'sla' | 'customFields'

export interface DiffEntry {
  section: ConfigSection
  path: string
  valueA: unknown
  valueB: unknown
}

export interface DiffResponse {
  tenantA: { id: string; name: string; config: TenantConfig }
  tenantB: { id: string; name: string; config: TenantConfig }
  diffs: DiffEntry[]
}
```

### BE — `source/be/src/modules/diff/diff.service.ts`

1. Query tenant rows (name + id) alongside config — change from `tenantConfig.findFirst` to joining with tenant:

```typescript
const [rowA, rowB] = await Promise.all([
  prisma.tenantConfig.findFirst({
    where: { tenantId: idA, isActive: true },
    include: { tenant: true },
  }),
  prisma.tenantConfig.findFirst({
    where: { tenantId: idB, isActive: true },
    include: { tenant: true },
  }),
])
```

2. In `flatDiff`, derive `section` from the root-level key of the path:

```typescript
function flatDiff(a: unknown, b: unknown, prefix = '', section = ''): DiffEntry[] {
  // section is the first path segment (set on first recursive call)
  const currentSection = section || prefix
  ...
  diffs.push({ section: currentSection as ConfigSection, path: prefix, valueA: a, valueB: b })
}
```

3. Return enriched response:

```typescript
return {
  tenantA: { id: idA, name: rowA.tenant.name, config: configA },
  tenantB: { id: idB, name: rowB.tenant.name, config: configB },
  diffs: flatDiff(configA, configB),
}
```

### FE — `source/fe/shared/types.ts`

Sync with BE types — same `ConfigSection`, `DiffEntry` with `section`, `DiffResponse` with identity objects.

### FE — `source/fe/lib/api/diff.ts`

Return type already `DiffResponse` — no change needed once types are updated.

### FE — `source/fe/pages/DiffPage.tsx`

- Column headers: use `res.data.tenantA.name` / `res.data.tenantB.name` instead of joining from local `tenants` state
- Section filter: use `d.section` instead of `d.path.split('.')[0]` for cleaner grouping
- Summary cards: still use `tenants` local state for branding (already works)
- Store `diffResult` state (`DiffResponse | null`) instead of just `diffs: DiffEntry[]`

## Expectation
- `GET /api/diff?a=X&b=Y` returns `{ tenantA: { id, name, config }, tenantB: { id, name, config }, diffs: [{ section, path, valueA, valueB }] }`
- DiffPage table column headers use names from the response directly
- Section filter categories derived from `d.section` (no more string splitting)

## Acceptance Criteria
- [ ] BE `DiffResponse` includes `tenantA.name`, `tenantB.name`, `tenantA.id`, `tenantB.id`
- [ ] Each `DiffEntry` has `section` field matching the top-level config key
- [ ] FE `DiffEntry` and `DiffResponse` types updated to match
- [ ] DiffPage column headers sourced from diff response (not local tenant list)
- [ ] Section filter uses `d.section` not `d.path.split('.')[0]`
- [ ] `tsc --noEmit` passes on both BE and FE

## Dependencies
- Depends on: none (T002 independent)
- Blocks: none

## References
- Architecture: `documents/planning/architecture.md` — Diff page, config comparison
- Standards: BE: no business logic in controllers
