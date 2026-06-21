# T002: resolveApprovalTiers

**Module:** M5 · process-claim-engine
**Story:** S2
**Tags:** BE
**Status:** done
**Size:** M

## Description
Implement `be/src/engine/resolveApprovalTiers.ts` — pure function implementing the 4-step approval resolution logic from architecture.md.

## Detail

```typescript
// be/src/engine/resolveApprovalTiers.ts
import type { TenantConfig } from '@/shared/types'

export const resolveApprovalTiers = (
  config: TenantConfig,
  amount: number,
): { tier: string }[] => {
  const { autoApprovalThreshold, approvalTiers } = config.approvalRules

  // Step 1: auto-approve
  if (amount <= autoApprovalThreshold) return []

  // Step 2: find all tiers where greaterThan < amount <= smallerThan
  const matched = approvalTiers.filter((t) => {
    const aboveFloor = t.greaterThan === undefined || amount > t.greaterThan
    const belowCeiling = t.smallerThan === undefined || amount <= t.smallerThan
    return !t.isPrimary && aboveFloor && belowCeiling
  })

  // Step 3: fallback to isPrimary if no range matched
  if (matched.length === 0) {
    const primary = approvalTiers.find((t) => t.isPrimary)
    return primary ? [{ tier: primary.tier }] : []
  }

  // Step 4: return all matching tiers (multi-approver)
  return matched.map((t) => ({ tier: t.tier }))
}
```

**Approval resolution rules (from architecture.md):**
1. `amount <= autoApprovalThreshold` → return `[]` (auto-approve, no human needed)
2. Find all tiers where `greaterThan < amount <= smallerThan` → return ALL matches
3. Zero range matches → return the `isPrimary` tier (catch-all)
4. Overlapping ranges: all matching tiers returned (multi-approver flow)

**Edge cases to handle:**
- GovHealth: `autoApprovalThreshold = 0` — `amount = 0` → auto-approve; `amount = 1` → committee (isPrimary, no range)
- SafeGuard: `amount = 50000` — is this `assessor` (greaterThan 20000, smallerThan 50000)? No: `amount <= smallerThan` means `50000 <= 50000` = true. Check: `amount > greaterThan` = `50000 > 20000` = true. So assessor matches. `team_lead` requires `amount > 50000` = false. So only assessor.
- `amount = 50001` — assessor: `50001 > 20000` ✅ and `50001 <= 50000` ❌ → no. team_lead: `50001 > 50000` ✅ and `50001 <= 100000` ✅ → matches.

## Expectation
- `resolveApprovalTiers(safeguard, 10000)` → `[]` (auto-approve, ≤ 20000)
- `resolveApprovalTiers(safeguard, 30000)` → `[{ tier: 'assessor' }]`
- `resolveApprovalTiers(safeguard, 150000)` → `[{ tier: 'director' }]` (isPrimary fallback)
- `resolveApprovalTiers(govhealth, 1)` → `[{ tier: 'committee' }]` (threshold = 0, amount > 0)
- `resolveApprovalTiers(govhealth, 0)` → `[]` (amount <= 0, auto-approve)

## Acceptance Criteria
- [ ] Returns `[]` when `amount <= autoApprovalThreshold`
- [ ] Returns all range-matching tiers (multi-approver when ranges overlap)
- [ ] Falls back to `isPrimary` tier when no range matches
- [ ] GovHealth `amount = 0` → auto-approve; `amount = 1` → committee
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none
- Blocks: T007

## References
- Architecture: Approval Resolution Logic (4 steps); Seed Data (SafeGuard 3-tier, HealthFirst 2-tier, GovHealth committee)
- Standards: Engine — pure functions, zero DB access
