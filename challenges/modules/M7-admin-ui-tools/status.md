# M7 · admin-ui-tools — Status

**Status:** done
**Completed:** 2026-06-21

## Summary

All 4 tasks implemented. `next build` passes with zero errors.

- **T001** `lib/api/diff.ts` + `lib/api/claims.ts` — typed API wrappers
- **T002** `components/tenants/VersionHistory.tsx` — version Table with "current" Badge, Popconfirm rollback; `onRollback` reloads tenant data in-place
- **T003** `(admin)/diff/page.tsx` — two tenant Selects, Compare button (disabled when same selected), diff Table with type-aware cell rendering (Tag/code/Empty)
- **T004** `components/claims/ClaimTester.tsx` — enabled-types Select, dynamic custom field inputs by type, ProcessClaimResult shown in Descriptions (SLA, approval, docs, notifications)

## Integration

`tenants/[id]/page.tsx` now renders three sections below the loading spinner:
1. `TenantForm` — edit config
2. `VersionHistory` — paginated version table with rollback
3. `ClaimTester` — live claim processing against the tenant's active config

## Build

```
✓ Compiled successfully
All 8 routes present and correct
```
