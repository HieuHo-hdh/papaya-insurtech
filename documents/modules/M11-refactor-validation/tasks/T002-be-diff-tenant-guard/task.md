# T002: BE — diff.service: Add requireTenant Guards

**Module:** M11 · refactor-validation
**Story:** S2
**Tags:** BE
**Status:** done
**Size:** S

## Description
Add soft-delete tenant existence guards to `diff.service.ts` so that a deleted tenant cannot participate in a diff, returning a clear 404 instead of the misleading "No active config" error.

## Detail

**File:** `source/be/src/modules/diff/diff.service.ts`

### Root cause
`diffConfigs` queries `tenantConfig` directly without first verifying the tenant itself exists and is not soft-deleted. If a tenant is deleted but still has config rows, the diff runs against a ghost tenant. `versions.service.ts` already has the correct pattern via `requireTenant`.

### Fix
Add a `requireTenant` helper (identical to the one in `versions.service.ts`) and call it for both `idA` and `idB` before querying active configs:

```
requireTenant(idA)  →  404 "Tenant not found" if deletedAt != null
requireTenant(idB)  →  404 "Tenant not found" if deletedAt != null
then: query active configs as before
```

Error priority:
1. `requireTenant(idA)` — returns 404 if tenant A is missing/deleted
2. `requireTenant(idB)` — returns 404 if tenant B is missing/deleted
3. `!rowA` — returns 404 "No active config for tenant {idA}"
4. `!rowB` — returns 404 "No active config for tenant {idB}"

Do **not** extract `requireTenant` into a shared utility — keep it local to the service, same as `versions.service.ts`.

## Expectation
- `GET /api/diff?a=<deleted-tenant-id>&b=<valid-id>` returns `404 { message: "Tenant not found" }`
- `GET /api/diff?a=<valid-id>&b=<valid-id>` with both having active configs returns `200` unchanged
- `tsc --noEmit` in BE passes

## Acceptance Criteria
- [ ] Deleted tenant A → 404 "Tenant not found" (not "No active config")
- [ ] Deleted tenant B → 404 "Tenant not found"
- [ ] Valid diff request unaffected — still returns diffs correctly
- [ ] No shared utility extracted — guard stays local to diff.service

## Dependencies
- Depends on: T001 (done)
- Blocks: none

## References
- Architecture: `documents/planning/architecture.md` — Soft delete, tenant lifecycle
- Standards: `documents/planning/coding-standards.md` — BE: no business logic in controllers

## Questions

## QA Report
