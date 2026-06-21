# T005: resolveCustomFields

**Module:** M5 · process-claim-engine
**Story:** S5
**Tags:** BE
**Status:** done
**Size:** S

## Description
Implement `be/src/engine/resolveCustomFields.ts` — returns all custom field definitions from tenant config.

## Detail

```typescript
// be/src/engine/resolveCustomFields.ts
import type { TenantConfig, CustomField } from '@/shared/types'

export const resolveCustomFields = (config: TenantConfig): CustomField[] =>
  config.customFields
```

This is intentionally simple — it returns the full `CustomField[]` array as-is. The purpose is to keep the engine consistent (all resolution logic goes through named pure functions) and to give the FE the complete field definitions including type metadata (`type`, `maxLength`, `min`, `max`, `options`) so it can render the correct input controls dynamically.

**Rules:**
- Return all custom fields regardless of `required` — the caller (FE claim tester, M8) uses the returned definitions to render inputs and the `required` flag to mark mandatory fields
- No filtering — `processClaim` returns all definitions so the FE can render the full dynamic form

## Expectation
- `resolveCustomFields(safeguardConfig)` → `[{ name: 'employee_id', label: 'Employee ID', required: true, type: 'text', maxLength: 20 }]`
- `resolveCustomFields(healthfirstConfig)` → `[]`
- `resolveCustomFields(govhealthConfig)` → `[{ name: 'department', ... }, { name: 'budget_code', ... }]`

## Acceptance Criteria
- [ ] Returns full `CustomField[]` from config
- [ ] Returns `[]` for tenants with no custom fields
- [ ] Preserves all field metadata (type, maxLength, options, etc.)
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none
- Blocks: T007

## References
- Architecture: processClaim Contract (`customFieldsRequired: CustomField[]`)
- Standards: Engine — pure functions
