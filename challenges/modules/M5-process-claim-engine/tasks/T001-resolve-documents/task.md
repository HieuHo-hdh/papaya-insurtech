# T001: resolveDocuments

**Module:** M5 · process-claim-engine
**Story:** S1
**Tags:** BE
**Status:** done
**Size:** S

## Description
Implement `be/src/engine/resolveDocuments.ts` — pure function that returns required and optional documents for a given claim type from tenant config.

## Detail

```typescript
// be/src/engine/resolveDocuments.ts
import type { TenantConfig, ClaimType } from '@/shared/types'
import { AppError } from '@/utils/AppError'

export const resolveDocuments = (
  config: TenantConfig,
  claimType: ClaimType,
): { requiredDocuments: string[]; optionalDocuments: string[] } => {
  const claimConfig = config.claimTypes[claimType]

  if (!claimConfig?.enabled) {
    throw new AppError(400, `Claim type ${claimType} is not enabled for this tenant`)
  }

  return {
    requiredDocuments: claimConfig.requiredDocuments,
    optionalDocuments: claimConfig.optionalDocuments,
  }
}
```

**Rules:**
- Pure function — no DB access, no side effects
- Throw `AppError(400)` if the claim type is missing or has `enabled: false`
- Return arrays directly from config — no transformation needed

## Expectation
`resolveDocuments(safeguardConfig, 'OUTPATIENT')` returns `{ requiredDocuments: ['Medical Report', 'Receipt'], optionalDocuments: ['Referral Letter'] }`. `resolveDocuments(safeguardConfig, 'MATERNITY')` throws 400.

## Acceptance Criteria
- [ ] Returns correct `requiredDocuments` and `optionalDocuments` for enabled types
- [ ] Throws `AppError(400)` for disabled or missing claim types
- [ ] Function is pure — no imports of Prisma or any I/O
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none
- Blocks: T007

## References
- Architecture: processClaim Contract (`requiredDocuments: string[]`)
- Standards: Engine — pure functions, zero DB access, fully testable in isolation
