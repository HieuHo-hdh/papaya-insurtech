# T001: Config Diff Endpoint

**Module:** M6 · config-tools-api
**Story:** S1
**Tags:** BE
\*\*Status:\*\* done
**Size:** M

## Description
Implement `GET /api/diff?a=:tenantId&b=:tenantId` — fetches the active config for two tenants and returns a flat list of differing paths with their respective values.

## Detail

### Response shape (from architecture.md)
```json
{
  "tenantA": { /* full TenantConfig */ },
  "tenantB": { /* full TenantConfig */ },
  "diffs": [
    { "path": "approvalRules.autoApprovalThreshold", "valueA": 20000, "valueB": 5000 }
  ]
}
```
No `type` field in diff entries — only `path`, `valueA`, `valueB`.

---

### Service — `be/src/modules/diff/diff.service.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import type { TenantConfig, DiffEntry, DiffResponse } from '@/shared/types'
import { AppError } from '@/utils/AppError'

const prisma = new PrismaClient()

export const diffConfigs = async (idA: string, idB: string): Promise<DiffResponse> => {
  const [rowA, rowB] = await Promise.all([
    prisma.tenantConfig.findFirst({ where: { tenantId: idA, isActive: true } }),
    prisma.tenantConfig.findFirst({ where: { tenantId: idB, isActive: true } }),
  ])
  if (!rowA) throw new AppError(404, `No active config for tenant ${idA}`)
  if (!rowB) throw new AppError(404, `No active config for tenant ${idB}`)

  const configA = rowA.config as unknown as TenantConfig
  const configB = rowB.config as unknown as TenantConfig

  return {
    tenantA: configA,
    tenantB: configB,
    diffs: flatDiff(configA, configB),
  }
}

function flatDiff(a: unknown, b: unknown, prefix = ''): DiffEntry[] {
  const diffs: DiffEntry[] = []

  if (Array.isArray(a) || Array.isArray(b)) {
    const aStr = JSON.stringify(a)
    const bStr = JSON.stringify(b)
    if (aStr !== bStr) {
      diffs.push({ path: prefix, valueA: a, valueB: b })
    }
    return diffs
  }

  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
    for (const key of keys) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      diffs.push(...flatDiff((a as any)[key], (b as any)[key], newPrefix))
    }
    return diffs
  }

  if (a !== b) {
    diffs.push({ path: prefix, valueA: a, valueB: b })
  }
  return diffs
}

const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object' && !Array.isArray(val)
```

**Algorithm rules:**
- Recurse into plain objects, comparing key by key
- Arrays: compare serialized (JSON.stringify) — if different, emit one diff at the array path (do NOT recurse into array elements)
- Primitive leaf (string/number/boolean/null/undefined): emit diff if `a !== b`
- Keys present in A but not B: `valueA = <value>`, `valueB = undefined` (and vice versa)

**Why arrays at top level?** Arrays like `customFields`, `notifications.channels`, `sla.holidays`, `sla.weekdays` change as a unit — diffing by index would produce confusing paths like `notifications.0.channels.0.channel`. Treating the array as an atomic leaf at its parent path is cleaner for the UI to display.

---

### Controller — `be/src/modules/diff/diff.controller.ts`

```typescript
import type { Request, Response } from 'express'
import { diffConfigs } from './diff.service'
import { success } from '@/utils/response'

export const getDiff = async (req: Request, res: Response): Promise<void> => {
  const { a, b } = req.query as { a: string; b: string }
  if (!a || !b) throw new AppError(400, 'Query params a and b are required')
  const result = await diffConfigs(a, b)
  res.json(success(result))
}
```

---

### Route — `be/src/modules/diff/diff.routes.ts`

```typescript
import { Router } from 'express'
import { asyncHandler } from '@/utils/asyncHandler'
import * as diffController from './diff.controller'

const router = Router()

router.get('/', asyncHandler(diffController.getDiff))

export default router
```

The route is already mounted in `app.ts` at `/api/diff`.

---

### Query param validation
No Zod schema needed for query params — validate presence manually in controller (both `a` and `b` required, non-empty strings). Tenant existence is validated implicitly when `findFirst` returns null → `AppError(404)`.

---

### Types
`DiffEntry` and `DiffResponse` are already defined in `challenges/shared/types.ts`:
```typescript
export interface DiffEntry {
  path: string
  valueA: unknown
  valueB: unknown
}

export interface DiffResponse {
  tenantA: TenantConfig
  tenantB: TenantConfig
  diffs: DiffEntry[]
}
```

## Expectation
`GET /api/diff?a=tenant-safeguard&b=tenant-govhealth` returns:
```json
{
  "code": 200,
  "data": {
    "tenantA": { ... },
    "tenantB": { ... },
    "diffs": [
      { "path": "branding.companyName", "valueA": "SafeGuard", "valueB": "GovHealth" },
      { "path": "approvalRules.autoApprovalThreshold", "valueA": 20000, "valueB": 0 },
      { "path": "sla.perClaimType", "valueA": { "OUTPATIENT": 5, ... }, "valueB": { ... } },
      ...
    ]
  }
}
```

## Acceptance Criteria
- [ ] `GET /api/diff?a=:id&b=:id` returns 200 with `{ tenantA, tenantB, diffs[] }`
- [ ] Missing `a` or `b` query param → 400
- [ ] Unknown tenant ID → 404
- [ ] `diffs` contains all paths where values differ (no false positives, no omissions for scalar fields)
- [ ] Array fields (e.g. `customFields`, `sla.weekdays`) compared as atomic values
- [ ] Same tenant compared to itself → `diffs: []`
- [ ] All 3 seed tenants produce non-empty diffs against each other
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: M4 (tenant-api), M5 (process-claim-engine — shared types)
- Blocks: M7, M8 (FE diff page)

## References
- Architecture: Config Diff Response; `GET /api/diff?a=:id&b=:id`
- Standards: Controller — thin; asyncHandler for async controllers; no business logic in routes

## Questions
<!-- Dev fills in before starting -->

## QA Report
<!-- QA fills in after testing -->
