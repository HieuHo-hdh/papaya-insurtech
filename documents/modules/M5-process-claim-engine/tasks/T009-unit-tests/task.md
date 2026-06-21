# T009: Unit Tests — Engine Functions + processClaim

**Module:** M5 · process-claim-engine
**Story:** S9
**Tags:** BE
**Status:** done
**Size:** M

## Description
Write unit tests covering all engine pure functions and the key invariant: same claim input against all 3 tenants produces different outputs.

## Detail

Test file: `be/src/engine/__tests__/engine.test.ts`

Use the 3 seed configs as test fixtures — import them directly as TypeScript objects (don't hit the DB in unit tests):

```typescript
// be/src/engine/__tests__/fixtures.ts
import type { TenantConfig } from '@/shared/types'

export const safeguardConfig: TenantConfig = { /* copy from seed.ts */ }
export const healthfirstConfig: TenantConfig = { /* copy from seed.ts */ }
export const govhealthConfig: TenantConfig = { /* copy from seed.ts */ }
```

### Test suites to write:

#### resolveDocuments
- `OUTPATIENT` on SafeGuard → correct required/optional docs
- `MATERNITY` on SafeGuard (disabled) → throws AppError 400
- `MATERNITY` on HealthFirst (enabled) → docs returned

#### resolveApprovalTiers
- SafeGuard `amount = 0` → `[]` (auto-approve, ≤ 20000)
- SafeGuard `amount = 20000` → `[]` (at threshold, still auto-approve)
- SafeGuard `amount = 20001` → `[{ tier: 'assessor' }]`
- SafeGuard `amount = 50000` → `[{ tier: 'assessor' }]` (boundary: ≤ smallerThan)
- SafeGuard `amount = 50001` → `[{ tier: 'team_lead' }]`
- SafeGuard `amount = 150000` → `[{ tier: 'director' }]` (isPrimary fallback)
- GovHealth `amount = 0` → `[]` (autoApprovalThreshold = 0, amount ≤ 0)
- GovHealth `amount = 1` → `[{ tier: 'committee' }]` (above threshold, no range, isPrimary)
- HealthFirst `amount = 5000` → `[]` (at threshold)
- HealthFirst `amount = 5001` → `[{ tier: 'assessor' }]`

#### resolveNotifications
- SafeGuard `claim_submitted` → 1 entry, channel `email`
- HealthFirst `approved` → 2 entries (email + sms)
- GovHealth `approved` → 2 entries (email + webhook with template)
- Template interpolation: `{{tenant_name}}` replaced correctly
- Unknown event → `[]`

#### calculateSlaDeadline
- SafeGuard OUTPATIENT (5 days, Mon–Fri): submitted Monday → deadline Monday +7 calendar days
- GovHealth OUTPATIENT (15 days, Mon–Fri): submitted Monday → 3 weeks later
- Holiday exclusion: if holiday falls in window, add extra day
- Missing `perClaimType` entry → throws AppError 400
- Returns string (ISO format)

#### resolveCustomFields
- SafeGuard → 1 field (employee_id)
- HealthFirst → 0 fields
- GovHealth → 2 fields (department + budget_code)

#### validateCustomFieldValues (re-export from shared)
- Required field missing → error
- Text maxLength exceeded → error
- Number out of range → error
- Invalid select option → error
- Valid values → `{}` (no errors)

#### Key invariant — different outputs per tenant
```typescript
it('same claim input produces different results for all 3 tenants', () => {
  const claim = { claimType: 'OUTPATIENT' as ClaimType, amount: 30000, customFields: {} }
  const sg = { docs: resolveDocuments(safeguardConfig, 'OUTPATIENT'), tiers: resolveApprovalTiers(safeguardConfig, 30000) }
  const hf = { docs: resolveDocuments(healthfirstConfig, 'OUTPATIENT'), tiers: resolveApprovalTiers(healthfirstConfig, 30000) }
  const gh = { docs: resolveDocuments(govhealthConfig, 'OUTPATIENT'), tiers: resolveApprovalTiers(govhealthConfig, 30000) }

  // SafeGuard: assessor tier; HealthFirst: assessor tier; GovHealth: committee tier
  expect(sg.tiers[0].tier).toBe('assessor')
  expect(hf.tiers[0].tier).toBe('assessor')
  expect(gh.tiers[0].tier).toBe('committee')

  // Docs differ between tenants
  expect(sg.docs.requiredDocuments).not.toEqual(gh.docs.requiredDocuments)
})
```

## Expectation
`npm test` runs all engine tests with zero failures. Coverage includes happy paths, boundary values, and error cases for all 5 pure functions.

## Acceptance Criteria
- [ ] `resolveDocuments` — at least 3 tests (enabled, disabled, cross-tenant)
- [ ] `resolveApprovalTiers` — at least 8 tests (all boundary cases from Detail above)
- [ ] `resolveNotifications` — at least 4 tests (single channel, multi-channel, template, unknown event)
- [ ] `calculateSlaDeadline` — at least 3 tests (basic weekday skip, holiday skip, missing config)
- [ ] `resolveCustomFields` — at least 3 tests (1 field, 0 fields, 2 fields)
- [ ] Invariant test: all 3 tenants produce different approval tiers for `amount = 30000`
- [ ] No DB calls in any test (pure function tests use fixture configs)
- [ ] `npm test` passes

## Dependencies
- Depends on: T001–T008
- Blocks: none

## References
- Architecture: Key Architectural Constraint (zero code branches, data-driven); Seed Data table
- Standards: Engine — fully testable in isolation
