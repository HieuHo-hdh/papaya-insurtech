# T004: Define Shared TypeScript Types + Zod Schemas

**Module:** M1 · project-setup
**Story:** S4
**Tags:** FE+BE
**Status:** pending
**Size:** M

## Description
Define all shared TypeScript types and Zod 4 schemas in `challenges/shared/`, then copy them to `be/src/shared/` and `fe/shared/`.

## Detail
Create the following files in `challenges/shared/`:

### `challenges/shared/types.ts`
Export all TypeScript types used across BE and FE:
- `ClaimType` enum: `'OUTPATIENT' | 'INPATIENT' | 'DENTAL' | 'MATERNITY' | 'OPTICAL'`
- `Weekday` enum: `'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'`
- `NotificationEvent`: `'claim_submitted' | 'approved' | 'rejected' | 'payment_sent'`
- `NotificationChannel`: `'email' | 'sms' | 'webhook'`
- `CustomFieldType`: `'text' | 'text_area' | 'number' | 'date_time' | 'boolean' | 'select'`
- `BrandingConfig`, `ClaimTypeConfig`, `ApprovalTier`, `ApprovalRules`, `NotificationChannel` (object), `NotificationConfig`, `SlaConfig`, `CustomField`, `TenantConfig` — full shapes per architecture.md TenantConfig JSONB section
- `ClaimData`: `{ claimType: ClaimType; amount: number; customFields: Record<string, string> }`
- `ProcessClaimResult`: `{ requiredDocuments: string[]; approvalTiers: { tier: string }[]; notifications: { event: string; channels: string[]; template?: string }[]; slaDeadline: string; customFieldsRequired: CustomField[] }`
- `ApiResponse<T>`: `{ code: number; message: string; data: T }`
- `PaginatedData<T>`: `{ data: T[]; total: number; page: number; pageSize: number }`

### `challenges/shared/schemas.ts`
Export Zod 4 schemas that mirror every type above, named with `Schema` suffix:
- `TenantConfigSchema` — validates the full config object with all rules from architecture.md:
  - `autoApprovalThreshold >= 0`
  - At least 1 claim type enabled (`.refine`)
  - At least 1 `isPrimary` tier (`.refine`)
  - All tier `greaterThan > autoApprovalThreshold` (cross-field refine)
  - `greaterThan < smallerThan` per tier
  - SLA `perClaimType` days `>= 1`
  - `weekdays.length >= 1`
  - `select` custom field: `options.length >= 1`
  - `number` custom field: `min < max` if both defined
- `ClaimDataSchema` — `claimType` enum, `amount >= 0`
- `LoginSchema` — `{ email: z.string().email(), password: z.string().min(1) }`

After creating shared files, copy them verbatim:
- `cp challenges/shared/types.ts challenges/be/src/shared/types.ts`
- `cp challenges/shared/schemas.ts challenges/be/src/shared/schemas.ts`
(FE copy is handled by T013)

The copy step can be scripted as `challenges/shared/sync.sh`:
```bash
#!/bin/bash
cp types.ts ../be/src/shared/types.ts
cp schemas.ts ../be/src/shared/schemas.ts
cp types.ts ../fe/shared/types.ts
cp schemas.ts ../fe/shared/schemas.ts
```

## Expectation
`challenges/shared/types.ts` and `schemas.ts` compile with zero TypeScript errors. `be/src/shared/` and `fe/shared/` contain identical copies.

## Acceptance Criteria
- [ ] `challenges/shared/types.ts` exports all types from architecture.md TenantConfig shape
- [ ] `challenges/shared/schemas.ts` exports `TenantConfigSchema` with all validation rules
- [ ] `TenantConfigSchema.safeParse` correctly rejects: 0 enabled claim types, missing isPrimary tier, negative threshold
- [ ] `be/src/shared/types.ts` and `be/src/shared/schemas.ts` are present and identical to shared/
- [ ] No `any` types — all fields strictly typed
- [ ] `ClaimDataSchema` rejects `amount < 0`

## Dependencies
- Depends on: none
- Blocks: T005, T009, T010, T013

## References
- Architecture: TenantConfig JSONB Shape, ClaimData Input, processClaim Contract, Validation Rules
- Standards: Naming conventions (Types: PascalCase, Schemas: PascalCase + Schema suffix)
