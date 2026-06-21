# T004: Seed — SafeGuard Full Config

**Module:** M2 · database
**Story:** S4b (part of S4)
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Extend `prisma/seed.ts` to insert the complete `TenantConfig` JSON for SafeGuard (Corporate) as version 1, `isActive: true`.

## Detail
Append to the `main()` function in `be/prisma/seed.ts` after the tenant rows are created:

```typescript
const safeguardConfig: TenantConfig = {
  branding: {
    companyName: 'SafeGuard',
    primaryColor: '#1a3c6e',
    secondaryColor: '#4a90d9',
  },
  claimTypes: {
    OUTPATIENT: { enabled: true, requiredDocuments: ['Medical Report', 'Receipt'], optionalDocuments: ['Referral Letter'] },
    INPATIENT:  { enabled: true, requiredDocuments: ['Admission Form', 'Discharge Summary', 'Receipt'], optionalDocuments: ['Lab Results'] },
    DENTAL:     { enabled: true, requiredDocuments: ['Dental Report', 'Receipt'], optionalDocuments: [] },
    MATERNITY:  { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    OPTICAL:    { enabled: false, requiredDocuments: [], optionalDocuments: [] },
  },
  approvalRules: {
    autoApprovalThreshold: 20000,
    approvalTiers: [
      { tier: 'assessor',  greaterThan: 20000, smallerThan: 50000  },
      { tier: 'team_lead', greaterThan: 50000, smallerThan: 100000 },
      { tier: 'director',  greaterThan: 100000, isPrimary: true    },
    ],
  },
  notifications: [
    { event: 'claim_submitted', channels: [{ channel: 'email' }] },
    { event: 'approved',        channels: [{ channel: 'email' }] },
    { event: 'rejected',        channels: [{ channel: 'email' }] },
    { event: 'payment_sent',    channels: [{ channel: 'email' }] },
  ],
  sla: {
    timezone: 'Asia/Ho_Chi_Minh',
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    holidays: [],
    perClaimType: { OUTPATIENT: 5, INPATIENT: 10, DENTAL: 5 },
    escalationContacts: ['sla@safeguard.com'],
  },
  customFields: [
    { name: 'employee_id', label: 'Employee ID', required: true, type: 'text', maxLength: 20 },
  ],
}

await prisma.tenantConfig.upsert({
  where: { tenantId_version: { tenantId: 'tenant-safeguard', version: 1 } },
  update: { config: safeguardConfig as object, isActive: true },
  create: {
    tenantId: 'tenant-safeguard',
    version: 1,
    config: safeguardConfig as object,
    isActive: true,
  },
})
```

Import `TenantConfig` from `../src/shared/types` at the top of seed.ts.

Ensure only one `isActive: true` per tenant. Since this is seed (clean state), just set `isActive: true` directly.

Per architecture.md:
- SafeGuard auto-approves ≤ 20,000
- 3-tier: assessor (20k–50k), team_lead (50k–100k), director (>100k, isPrimary)
- Email notifications only
- SLA: 5 business days OUTPATIENT / 10 INPATIENT / 5 DENTAL
- Custom field: Employee ID (required, text, maxLength 20)

## Expectation
`npx prisma db seed` exits 0. `tenant_configs` has 1 row for `tenant-safeguard` with `version=1`, `is_active=true`, and the correct JSON config.

## Acceptance Criteria
- [ ] SafeGuard `tenant_configs` row exists with `version=1` and `is_active=true`
- [ ] `processClaim('tenant-safeguard', { claimType: 'OUTPATIENT', amount: 30000, customFields: {} })` routing hits `assessor` tier
- [ ] `processClaim('tenant-safeguard', { claimType: 'OUTPATIENT', amount: 10000, customFields: {} })` → auto-approve (amount ≤ 20,000)
- [ ] `processClaim('tenant-safeguard', { claimType: 'MATERNITY', ... })` → error (type not enabled)
- [ ] Config JSON validates against `TenantConfigSchema` without errors
- [ ] Seed is idempotent (uses `upsert`)

## Dependencies
- Depends on: T003
- Blocks: none (T005 is parallel — different tenant)

## References
- Architecture: Seed Data table (SafeGuard row); TenantConfig JSONB Shape; Approval Resolution Logic
- Standards: N/A
