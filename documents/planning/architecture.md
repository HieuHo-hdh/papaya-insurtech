# Architecture — SA Sign-off

All decisions below are confirmed. Do not deviate without explicit approval.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19 + Vite 8 + React Router v7 + TypeScript + Ant Design 6 + Tailwind v4 + Zod |
| Backend | Node.js + Express + TypeScript + Prisma + PostgreSQL |
| Date/time | dayjs (all date arithmetic, SLA deadlines, timezone handling) |
| Deploy | BE + DB → Railway, FE → Vercel |

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | string | unique, not null |
| password_hash | string | not null |
| created_at | datetime | default now() |

### `tenants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | string | not null |
| deleted_at | datetime | nullable — soft delete |
| created_at | datetime | default now() |

### `tenant_configs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants.id |
| version | int | auto-increment per tenant |
| config | jsonb | full TenantConfig object |
| is_active | boolean | only one true per tenant |
| created_at | datetime | default now() |

**Constraints:**
- Unique index on `(tenant_id, version)`
- Only one `is_active = true` per tenant (enforced at app layer on every write)
- All tenant queries filter `deleted_at IS NULL`
- Version APIs check tenant is not deleted before any read/write

**No `claims` table** — `processClaim` is a pure computation, nothing is persisted.

---

## TenantConfig JSONB Shape

```typescript
{
  branding: {
    companyName: string
    logoUrl?: string           // valid URL or empty
    primaryColor: string       // hex #RRGGBB
    secondaryColor: string     // hex #RRGGBB
  }

  claimTypes: {
    // Partial record — only include types you configure; at least 1 must be enabled
    [ClaimType]: {
      enabled: boolean
      requiredDocuments: string[]
      optionalDocuments: string[]
    }
  }

  approvalRules: {
    autoApprovalThreshold: number    // ≥ 0
    approvalTiers: [
      {
        tier: string
        greaterThan?: number         // must be > autoApprovalThreshold
        smallerThan?: number         // must be > greaterThan
        isPrimary?: boolean          // catch-all for unmatched amounts
      }
    ]
  }

  notifications: [
    {
      event: 'claim_submitted' | 'approved' | 'rejected' | 'payment_sent'
      channels: [{ channel: 'email' | 'sms' | 'webhook', template?: string }]
    }
  ]

  sla: {
    timezone: string               // e.g. "Asia/Ho_Chi_Minh", default GMT+7
    weekdays: Weekday[]            // selectable, default ['MON','TUE','WED','THU','FRI']
    holidays: string[]             // YYYY-MM-DD dates to skip
    perClaimType: { [ClaimType]: number }   // business days, min 1
    escalationContacts: string[]   // valid emails
  }

  customFields: [
    {
      name: string                 // key identifier
      label: string                // display label
      required: boolean
      type: 'text' | 'text_area' | 'number' | 'date_time' | 'boolean' | 'select'
      maxLength?: number           // text, text_area
      min?: number                 // number
      max?: number                 // number
      options?: string[]           // select — min 1 option required
    }
  ]
}
```

---

## ClaimData Input

```typescript
{
  claimType: ClaimType
  amount: number          // ≥ 0
  customFields: Record<string, string>   // all values as strings, validated server-side
}
```
`submittedAt` is auto-set on BE.

### Custom Field Value Validation Rules

| Type | Validation |
|------|-----------|
| `text` | string, optional maxLength check |
| `text_area` | string, optional maxLength check |
| `number` | parseable as number, optional min/max |
| `date_time` | valid via `dayjs(value).isValid()` |
| `boolean` | must be `"true"` or `"false"` |
| `select` | must be one of `options[]` |

On failure: return `400 { code, message, details: { [fieldName]: string[] } }` — **non-blocking** for missing optional fields; still returns full result with `customFieldsRequired` listing all definitions.

---

## processClaim Contract

**Input:** `ClaimData` (above)

**Output:**
```typescript
{
  requiredDocuments: string[]
  approvalTiers: { tier: string }[]        // ALL matching tiers (multi-approver)
  notifications: { event, channels: string[], template?: string }[]
  slaDeadline: string                      // ISO string in tenant timezone via dayjs
  customFieldsRequired: CustomField[]      // full definitions including type info
}
```

### Approval Resolution Logic
1. `amount <= autoApprovalThreshold` → `approvalTiers: []` (auto-approve)
2. Find all tiers where `greaterThan < amount <= smallerThan` → return ALL matches
3. Zero range matches → return `isPrimary` tier
4. Overlapping ranges: all matching tiers returned (multi-approver flow)

### SLA Deadline Calculation
- Use `dayjs` with tenant `timezone`
- Skip days not in `weekdays[]`
- Skip dates in `holidays[]`
- Count forward `perClaimType[claimType]` business days from `submittedAt`

### Notification Template Variables
Available in `template` strings: `{{claimant_name}}`, `{{claim_id}}`, `{{claim_type}}`, `{{amount}}`, `{{sla_deadline}}`, `{{tenant_name}}`, `{{status}}`

---

## API Endpoints

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | Returns 24h JWT, no refresh token |
| POST | `/api/auth/logout` | Stateless — client discards token |

Seeded admin: `admin@papaya.dev` / `Admin@1234`. No public register endpoint.

**FE API client behaviour:** auto-redirects to `/login` on HTTP 401 and clears the stored token.

### Tenants
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/tenants` | Paginated; active tenants by default. Pass `?showDeleted=true` to include soft-deleted tenants |
| POST | `/api/tenants` | Create tenant + initial config |
| GET | `/api/tenants/:id` | Tenant + active config |
| PUT | `/api/tenants/:id` | Update config — auto-creates new version |
| DELETE | `/api/tenants/:id` | Soft-delete (`deleted_at = now()`) |

### Versions
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/tenants/:id/versions` | Paginated version history |
| GET | `/api/tenants/:id/versions/:vId` | Specific version |
| POST | `/api/tenants/:id/rollback/:vId` | Creates new version (copy of target) |

### Tools
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/tenants/:id/process-claim` | Pure computation — not persisted |
| GET | `/api/diff?a=:id&b=:id` | Diff two tenants' active configs |

---

## API Response Shapes

**Success:**
```json
{ "code": 200, "message": "OK", "data": { } }
```

**Paginated:**
```json
{ "code": 200, "message": "OK", "data": { "data": [], "total": 0, "page": 1, "pageSize": 20 } }
```

**Error:**
```json
{ "code": 400, "message": "Validation failed", "details": { "field": ["error"] } }
```

**FE utility:** `isSuccess(code) → code >= 200 && code < 300`

---

## Config Diff Response

```json
{
  "tenantA": { "id": "...", "name": "SafeGuard", "config": { } },
  "tenantB": { "id": "...", "name": "HealthFirst", "config": { } },
  "diffs": [
    { "section": "approvalRules", "path": "approvalRules.autoApprovalThreshold", "valueA": 20000, "valueB": 5000 }
  ]
}
```

Each `DiffEntry` has a `section` field — the top-level config key (`branding | claimTypes | approvalRules | notifications | sla | customFields`). `DiffResponse` wraps each side as `{ id, name, config }`. No `type` field in diff entries.

---

## Rollback Behavior

Rolling back to vN while on vM (M > N) creates v(M+1) as a copy of vN config. Linear history is always preserved.

---

## Validation Rules (enforced at save)

- `autoApprovalThreshold ≥ 0`
- `claimTypes` is a partial record — only include configured types; at least 1 must have `enabled: true`
- `requiredDocuments.length ≥ 1` only when that claim type is `enabled: true`; disabled types need no documents
- All keys in `sla.perClaimType` must exist as keys in `claimTypes`
- At least 1 `isPrimary` tier
- All tier `greaterThan > autoApprovalThreshold`
- `greaterThan < smallerThan` per tier
- SLA `perClaimType` days `≥ 1` for each defined type
- `weekdays.length ≥ 1`
- `select` custom field must have `options.length ≥ 1`
- `number` custom field: `min < max` if both defined
