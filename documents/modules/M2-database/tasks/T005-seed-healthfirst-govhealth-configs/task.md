# T005: Seed — HealthFirst + GovHealth Full Configs

**Module:** M2 · database
**Story:** S4c (part of S4)
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Extend `prisma/seed.ts` to insert complete `TenantConfig` JSON for HealthFirst (Retail) and GovHealth (Government) as version 1, `isActive: true`.

## Detail
Append to `main()` in `be/prisma/seed.ts` after SafeGuard (T004):

### HealthFirst config
```typescript
const healthfirstConfig: TenantConfig = {
  branding: {
    companyName: 'HealthFirst',
    primaryColor: '#27ae60',
    secondaryColor: '#82e0aa',
  },
  claimTypes: {
    OUTPATIENT: { enabled: true, requiredDocuments: ['Medical Receipt', 'Doctor Note'], optionalDocuments: [] },
    INPATIENT:  { enabled: true, requiredDocuments: ['Hospital Bill', 'Discharge Summary'], optionalDocuments: ['Lab Results'] },
    DENTAL:     { enabled: true, requiredDocuments: ['Dental Receipt'], optionalDocuments: ['X-Ray'] },
    MATERNITY:  { enabled: true, requiredDocuments: ['Birth Certificate', 'Hospital Bill'], optionalDocuments: ['Prenatal Records'] },
    OPTICAL:    { enabled: true, requiredDocuments: ['Optical Receipt', 'Prescription'], optionalDocuments: [] },
  },
  approvalRules: {
    autoApprovalThreshold: 5000,
    approvalTiers: [
      { tier: 'assessor', greaterThan: 5000, smallerThan: 50000 },
      { tier: 'manager',  greaterThan: 50000, isPrimary: true   },
    ],
  },
  notifications: [
    { event: 'claim_submitted', channels: [{ channel: 'email' }, { channel: 'sms' }] },
    { event: 'approved',        channels: [{ channel: 'email' }, { channel: 'sms' }] },
    { event: 'rejected',        channels: [{ channel: 'email' }, { channel: 'sms' }] },
    { event: 'payment_sent',    channels: [{ channel: 'email' }, { channel: 'sms' }] },
  ],
  sla: {
    timezone: 'Asia/Ho_Chi_Minh',
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    holidays: [],
    perClaimType: { OUTPATIENT: 7, INPATIENT: 7, DENTAL: 7, MATERNITY: 7, OPTICAL: 7 },
    escalationContacts: ['sla@healthfirst.com'],
  },
  customFields: [],
}
```

### GovHealth config
```typescript
const govhealthConfig: TenantConfig = {
  branding: {
    companyName: 'GovHealth',
    primaryColor: '#c0392b',
    secondaryColor: '#e74c3c',
  },
  claimTypes: {
    OUTPATIENT: { enabled: true, requiredDocuments: ['Medical Report', 'Government ID', 'Receipt'], optionalDocuments: [] },
    INPATIENT:  { enabled: true, requiredDocuments: ['Admission Form', 'Government ID', 'Discharge Summary', 'Receipt'], optionalDocuments: ['Lab Results'] },
    DENTAL:     { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    MATERNITY:  { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    OPTICAL:    { enabled: false, requiredDocuments: [], optionalDocuments: [] },
  },
  approvalRules: {
    autoApprovalThreshold: 0,     // all claims go to manual approval
    approvalTiers: [
      { tier: 'committee', isPrimary: true },   // catch-all — all amounts
    ],
  },
  notifications: [
    { event: 'claim_submitted', channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/claim-submitted' }] },
    { event: 'approved',        channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/approved' }] },
    { event: 'rejected',        channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/rejected' }] },
    { event: 'payment_sent',    channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/payment-sent' }] },
  ],
  sla: {
    timezone: 'Asia/Ho_Chi_Minh',
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    holidays: [],
    perClaimType: { OUTPATIENT: 15, INPATIENT: 15 },
    escalationContacts: ['sla@govhealth.gov.vn', 'director@govhealth.gov.vn'],
  },
  customFields: [
    { name: 'department',   label: 'Department',   required: true, type: 'text',   maxLength: 100 },
    { name: 'budget_code',  label: 'Budget Code',  required: true, type: 'text',   maxLength: 20  },
  ],
}
```

Insert both using `upsert` the same way as T004.

Key differences to verify per architecture.md:
- **HealthFirst**: all 5 types enabled, `autoApprovalThreshold: 5000`, 2-tier, email + SMS
- **GovHealth**: `autoApprovalThreshold: 0` (no auto-approve), single `committee` tier (isPrimary), email + webhook, 2 required custom fields

## Expectation
`npx prisma db seed` exits 0. `tenant_configs` has 3 rows total (1 per tenant), all `is_active=true`. All 3 tenants produce different `processClaim` outputs for the same input.

## Acceptance Criteria
- [ ] HealthFirst `tenant_configs` row exists with `version=1`, `is_active=true`, all 5 claim types enabled
- [ ] GovHealth `tenant_configs` row exists with `version=1`, `is_active=true`, `autoApprovalThreshold=0`
- [ ] `processClaim('tenant-govhealth', { amount: 1, ... })` → tier `committee` (no auto-approve even at amount=1)
- [ ] `processClaim('tenant-healthfirst', { amount: 3000, ... })` → auto-approve (`amount ≤ 5000`)
- [ ] GovHealth config includes 2 custom fields (department + budget_code, both required)
- [ ] HealthFirst notifications include both email and sms channels
- [ ] GovHealth notifications include webhook channels with template URLs
- [ ] All 3 tenant configs validate against `TenantConfigSchema`
- [ ] Seed is idempotent

## Dependencies
- Depends on: T003
- Blocks: none

## References
- Architecture: Seed Data table (HealthFirst + GovHealth rows); processClaim Contract; Approval Resolution Logic
- Standards: Key Architectural Constraint — all 3 tenants must produce different output for same input (zero code branches)
