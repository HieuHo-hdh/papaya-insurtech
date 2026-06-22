# T001: Update Validation Schemas — BE + FE Tenant Config Rules

**Module:** M11 · refactor-validation
**Story:** S1
**Tags:** FE+BE
**Status:** done
**Size:** L

## Description
Refactor and harden the tenant config validation layer on both BE (Zod schemas) and FE (Ant Design form rules), aligning them to a consistent ruleset and eliminating the `UpdateTenantSchema` bug where Zod v4 required all five claimType enum keys.

## Detail

### BE — `source/be/src/shared/schemas.ts`

**`BrandingSchema`**
- `primaryColor` and `secondaryColor` are now `.optional()` — not required on create or update

**`ClaimTypeConfigSchema`**
- `enabled` defaults to `false`
- `requiredDocuments` has no static `.min(1)` — instead a `.superRefine()` adds the "at least one required document" error only when `enabled === true`

**`NotificationConfigSchema`**
- `channels` changed from `z.array(...)` to `z.array(...).min(1, 'At least one channel required')`

**`SlaConfigSchema`**
- `holidays`: `.optional().default([])` — field may be omitted
- `escalationContacts`: `.default([])` — field may be omitted

**`TenantConfigSchema`**
- `claimTypes`: `z.record(ClaimTypeEnum, ClaimTypeConfigSchema)` — accepts any non-empty subset of the five enum keys (not all five required at runtime), plus two `.refine()` guards:
  - At least one key must be present
  - At least one must have `enabled: true`
- Cross-field `.superRefine()`: every key in `sla.perClaimType` must exist in `claimTypes`
- `customFields`: `.optional().default([])`

**`UpdateTenantSchema`**
- `z.object({ config: TenantConfigSchema })` — full config replacement (PUT semantics). Partial record is handled inside `TenantConfigSchema` itself, so no `.extend()` override needed.

### FE — `source/fe/shared/schemas.ts`
Synced identically with the BE schema changes above.

### FE — `source/fe/components/tenants/TenantForm.tsx`

All validation uses **Ant Design `Form.Item` rules** — no `safeParse` in `handleSubmit`.

**External form instance prop**
- Added `form?: FormInstance` prop; component falls back to an internal `Form.useForm()` instance if not provided

**Branding section**
- `logoUrl`: async validator using `new URL(value)` — rejects non-URL strings, allows empty

**Claim Types section**
- `_vClaimTypes` sentinel `Form.Item` (hidden input) placed after the claim type rows:
  - `dependencies`: all five `['claimTypes', ct, 'enabled']` paths
  - Validator: throws if no claim type has `enabled: true`
- Per-claim-type `_vReqDocs[claimType]` sentinel `Form.Item` (hidden input, `style={{ marginBottom: 0 }}`), rendered only when that claim type is enabled:
  - `dependencies`: `['claimTypes', ct, 'requiredDocuments']`
  - Validator: throws if `requiredDocuments` has no non-empty trimmed entries
- Each individual required/optional doc input inside `DocList` has `rules: [{ required: true, whitespace: true }]` to block empty-string submissions

**SLA section**
- `weekdays` defaulted to `['MON', 'TUE', 'WED', 'THU', 'FRI']` via `useEffect` when no `initialValues`

**Approval Rules section**
- `greaterThan` field has a `dependencies`-based validator checking it exceeds `autoApprovalThreshold`
- `_vIsPrimary` sentinel `Form.Item` (hidden input) after the tiers Form.List:
  - Validator: throws if no tier has `isPrimary: true`

**Custom Fields section**
- `options` field (select type): validator requiring at least one non-empty option
- `min`/`max` fields (number type): cross-validators enforcing `min < max`

### FE — Pages
- `NewTenantPage.handleSubmit`: removed `TenantConfigSchema.safeParse` — form validation via Ant Design rules is the single source of truth
- `TenantDetailPage.handleSubmit`: same — no Zod `safeParse`, direct API call after form passes

## Expectation
- PUT `/api/tenants/:id` with a config containing only a subset of claim types (e.g. OUTPATIENT + INPATIENT) returns `200`
- PUT with zero enabled claim types returns `400`
- FE form blocks submission when: no claim type enabled, required doc is empty or missing, no isPrimary tier, invalid logoUrl, greaterThan ≤ autoApprovalThreshold
- Error messages surface inline under the relevant field, not as toasts

## Acceptance Criteria
- [x] BE: `ClaimTypeConfigSchema` rejects `requiredDocuments: []` only when `enabled: true`
- [x] BE: `TenantConfigSchema` accepts partial claimTypes record (subset of 5 enum keys)
- [x] BE: `TenantConfigSchema` rejects configs where `sla.perClaimType` has keys not in `claimTypes`
- [x] BE: `NotificationConfigSchema` rejects zero channels
- [x] FE schemas synced with BE
- [x] FE: `_vClaimTypes` sentinel blocks submit when no claim type is enabled
- [x] FE: `_vReqDocs` sentinel blocks submit when enabled claim type has no required docs (no extra layout space when valid)
- [x] FE: `_vIsPrimary` sentinel blocks submit when no tier is marked primary
- [x] FE: individual doc inputs block empty/whitespace strings
- [x] FE: `handleSubmit` in NewTenantPage and TenantDetailPage uses no Zod `safeParse`
- [x] `tsc --noEmit` passes on both BE and FE

## Dependencies
- Depends on: none
- Blocks: T002 (version history/diff tasks pending)

## References
- Architecture: `documents/planning/architecture.md` — Validation Rules, Schema Design
- Standards: `documents/planning/coding-standards.md` — Rule 3 (FE validation via Ant Design rules + sentinel pattern)

## Questions

## QA Report
