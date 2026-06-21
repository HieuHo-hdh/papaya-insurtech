# T001: API Clients — Diff + Claims

**Module:** M7 · admin-ui-tools
**Story:** S1 (prerequisite)
**Tags:** FE
**Status:** done
**Size:** S

## Description
Implement `lib/api/diff.ts` and `lib/api/claims.ts` — typed wrappers used by the diff page and claim tester panel.

## Detail

### `fe/lib/api/diff.ts`

```typescript
import { apiClient } from './client'
import type { DiffResponse } from '@/shared/types'

export const diffApi = {
  compare: (tenantIdA: string, tenantIdB: string) =>
    apiClient.get<DiffResponse>(`/diff?a=${tenantIdA}&b=${tenantIdB}`),
}
```

---

### `fe/lib/api/claims.ts`

```typescript
import { apiClient } from './client'
import type { ProcessClaimResult, ClaimData } from '@/shared/types'

export const claimsApi = {
  process: (tenantId: string, claimData: ClaimData) =>
    apiClient.post<ProcessClaimResult>(`/tenants/${tenantId}/process-claim`, claimData),
}
```

**Types already defined in `shared/types.ts`:**
- `DiffResponse` → `{ tenantA: TenantConfig, tenantB: TenantConfig, diffs: DiffEntry[] }`
- `DiffEntry` → `{ path: string, valueA: unknown, valueB: unknown }`
- `ProcessClaimResult` → `{ requiredDocuments, approvalTiers, notifications, slaDeadline, customFieldsRequired }`
- `ClaimData` → `{ claimType: ClaimType, amount: number, customFields: Record<string, string> }`

## Expectation
`diffApi.compare('tenant-safeguard', 'tenant-govhealth')` returns typed `ApiResponse<DiffResponse>`.
`claimsApi.process('tenant-safeguard', { claimType: 'OUTPATIENT', amount: 30000, customFields: {} })` returns typed `ApiResponse<ProcessClaimResult>`.

## Acceptance Criteria
- [ ] `lib/api/diff.ts` exports `diffApi` with `compare` method
- [ ] `lib/api/claims.ts` exports `claimsApi` with `process` method
- [ ] No `any` types — all fully typed via shared types
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: M6 T001 (apiClient already implemented)
- Blocks: T002, T003, T004

## References
- Architecture: `GET /api/diff?a=:id&b=:id`; `POST /api/tenants/:id/process-claim`
- Standards: All API calls through `lib/api/client.ts`
