# T004: FE — SLA perClaimType: Only Show Enabled Claim Types

**Module:** M12 · ux-improvements
**Story:** S4
**Tags:** FE
**Status:** pending
**Size:** S

## Description
The SLA "Days Per Claim Type" section currently renders all 5 claim type inputs unconditionally. Filter it to only show inputs for claim types that are currently enabled in the form.

## Detail

**File:** `source/fe/components/tenants/TenantForm.tsx`

### Current behaviour
The SLA section maps over `ALL_CLAIM_TYPES` (all 5) to render `InputNumber` fields regardless of which claim types are enabled.

### Fix

Use `Form.useWatch` to observe all five `enabled` flags reactively, then filter:

```typescript
// Inside TenantForm component body (below existing form instance)
const claimTypeEnabledMap = Form.useWatch(
  ALL_CLAIM_TYPES.map((ct) => ['claimTypes', ct, 'enabled']),
  form,
) as (boolean | undefined)[]

const enabledClaimTypes = ALL_CLAIM_TYPES.filter(
  (_, i) => claimTypeEnabledMap?.[i],
)
```

In the SLA section, replace `{ALL_CLAIM_TYPES.map(...)}` with `{enabledClaimTypes.map(...)}`.

If no claim types are enabled yet (e.g. on a fresh form before any toggle), show a hint:
```tsx
{enabledClaimTypes.length === 0 && (
  <Typography.Text type="secondary">Enable claim types above to configure SLA days.</Typography.Text>
)}
```

### assembleConfig impact
`assembleConfig` already filters `perClaimType` entries via `.filter(([, v]) => v != null)`. When a claim type is disabled and its SLA field is removed from the DOM, the form field value becomes `undefined` and is filtered out naturally — no change needed to `assembleConfig`.

## Expectation
- Toggling a claim type on → its SLA day input appears in real time
- Toggling a claim type off → its SLA day input disappears
- Existing saved values for enabled claim types load correctly
- `assembleConfig` still only includes non-null perClaimType values

## Acceptance Criteria
- [ ] SLA inputs only rendered for enabled claim types
- [ ] Toggling claim type on/off reactively shows/hides its SLA input
- [ ] Hint text shown when no claim types are enabled
- [ ] Existing initialValues (edit mode) populate correctly
- [ ] `assembleConfig` output unchanged — perClaimType only contains enabled types' values

## Dependencies
- Depends on: none
- Blocks: none

## References
- Standards: `documents/planning/coding-standards.md` — FE: form reactivity via Form.useWatch
