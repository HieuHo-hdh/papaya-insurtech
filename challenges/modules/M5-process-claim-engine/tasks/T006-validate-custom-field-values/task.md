# T006: validateCustomFieldValues

**Module:** M5 · process-claim-engine
**Story:** S6
**Tags:** BE
**Status:** done
**Size:** S

## Description
Type-aware validation of custom field values against their definitions.

## Detail
**This task is already complete.** `validateCustomFieldValues` is implemented in `be/src/shared/schemas.ts` (lines 116–176).

What is implemented:
- Validates each field value against its type (`text`, `text_area`, `number`, `date_time`, `boolean`, `select`)
- Checks `required` fields for presence
- Validates `maxLength`, `min`, `max`, `options` constraints
- Returns `Record<string, string[]>` error map (empty = valid)

For the engine, create a thin re-export in `be/src/engine/validateCustomFieldValues.ts`:

```typescript
// be/src/engine/validateCustomFieldValues.ts
export { validateCustomFieldValues } from '@/shared/schemas'
```

This keeps the engine's public API surface consistent — all resolution functions are importable from `@/engine/*`.

## Expectation
`validateCustomFieldValues({ employee_id: '' }, [{ name: 'employee_id', required: true, type: 'text', ... }])` → `{ employee_id: ['This field is required'] }`.

## Acceptance Criteria
- [x] `validateCustomFieldValues` exists in `be/src/shared/schemas.ts`
- [x] All 6 types validated correctly
- [x] Required field check works
- [ ] `be/src/engine/validateCustomFieldValues.ts` re-exports from shared (thin wrapper)

## Dependencies
- Depends on: none (already done)
- Blocks: T007

## References
- Architecture: Custom Field Value Validation Rules table
- Standards: Engine — pure functions
