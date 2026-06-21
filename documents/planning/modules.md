# Module Breakdown — Multi-Tenant Insurance Configuration Platform

Tech stack: Next.js 16 + TypeScript + Ant Design 6 + Tailwind v4 + Zod 4 (FE) | Node.js + Express + TypeScript + Prisma + PostgreSQL + dayjs (BE)

---

## M1 · project-setup
**Owner:** BE + FE | **Depends on:** nothing

| # | Story |
|---|-------|
| S1 | Init Next.js 16 App Router + TypeScript + Ant Design 6 + Tailwind v4  |
| S2 | Init Node.js + Express + TypeScript + Prisma BE — scaffold folder structure per coding-standards.md  |
| S3 | Docker Compose: PostgreSQL + BE service  |
| S4 | Define shared TypeScript types + Zod 4 schemas in `source/shared/`, copy to `be/src/shared/` and `fe/shared/`  |
| S5 | Env config: `.env.example`, Zod env validation on BE startup  |
| S6 | BE: dayjs config module (`config/dayjs.ts`) with UTC + timezone + customParseFormat plugins |
| S7 | BE: `utils/response.ts` — `success()`, `paginated()` helpers |
| S8 | BE: `utils/AppError.ts` — custom error class with statusCode + details |
| S9 | BE: `middleware/validate.ts` — Zod request body validation middleware |
| S10 | BE: `middleware/auth.ts` — JWT verification, attach req.user |
| S11 | FE: AntdProvider (`components/providers/AntdProvider.tsx`) + theme context  |
| S12 | FE: API client (`lib/api/client.ts`) with isSuccess/isUnauthorized helpers  |
| S13 | FE: Copy shared types into `fe/shared/`  |

---

## M2 · database
**Owner:** BE | **Depends on:** M1

| # | Story |
|---|-------|
| S1 | Design Prisma schema: `users`, `tenants` (soft-delete), `tenant_configs` (JSONB + version per tenant) |
| S2 | Write Prisma schema + relations + unique index on (tenant_id, version) |
| S3 | Initial migration |
| S4 | Seed script: admin user + SafeGuard, HealthFirst, GovHealth (full configs per architecture.md) |

Schema:
- `users(id, email, password_hash, created_at)`
- `tenants(id, name, deleted_at, created_at)` — soft delete via deleted_at
- `tenant_configs(id, tenant_id, version: Int, config: Json, is_active: Boolean, created_at)` — every save = new row, one `is_active=true` per tenant; rollback = create new version as copy of target

---

## M3 · auth-api
**Owner:** BE | **Depends on:** M2

| # | Story | Endpoint |
|---|-------|----------|
| S1 | Login — validate credentials, return 24h JWT | `POST /api/auth/login` |
| S2 | Logout — stateless (client discards token) | `POST /api/auth/logout` |
| S3 | Auth middleware applied to all routes except login | — |

---

## M4 · tenant-api
**Owner:** BE | **Depends on:** M2, M3

| # | Story | Endpoint |
|---|-------|----------|
| S1 | List tenants (paginated, active only) | `GET /api/tenants` |
| S2 | Get tenant + active config | `GET /api/tenants/:id` |
| S3 | Create tenant + initial config (validate with TenantConfigSchema) | `POST /api/tenants` |
| S4 | Update config — auto-creates new version, sets it as active | `PUT /api/tenants/:id` |
| S5 | Soft-delete tenant (set deleted_at) | `DELETE /api/tenants/:id` |
| S6 | List version history (paginated) | `GET /api/tenants/:id/versions` |
| S7 | Get specific version | `GET /api/tenants/:id/versions/:versionId` |
| S8 | Rollback — creates new version as copy of target, sets it active | `POST /api/tenants/:id/rollback/:versionId` |

---

## M5 · process-claim-engine
**Owner:** BE | **Depends on:** M2

Core rule: **zero hardcoded tenant branches** — all logic driven by config JSONB.

| # | Story |
|---|-------|
| S1 | `resolveDocuments(config, claimType)` — required + optional docs |
| S2 | `resolveApprovalTiers(config, amount)` — auto-approve check + all matching range tiers + isPrimary fallback |
| S3 | `resolveNotifications(config, event)` — channels + template interpolation with {{variables}} |
| S4 | `calculateSlaDeadline(config, claimType, submittedAt)` — dayjs business days arithmetic with tenant timezone + weekdays + holidays |
| S5 | `resolveCustomFields(config)` — return full CustomField definitions |
| S6 | `validateCustomFieldValues(values, definitions)` — type-aware validation (text/text_area/number/date_time/boolean/select) |
| S7 | `processClaim(tenantId, claimData)` — orchestrates S1–S6, fetches active config from DB |
| S8 | Endpoint: `POST /api/tenants/:id/process-claim` |
| S9 | Unit tests: same claim input against all 3 tenants → different outputs; edge cases |

---

## M6 · config-tools-api
**Owner:** BE | **Depends on:** M4, M5

| # | Story | Endpoint |
|---|-------|----------|
| S1 | Deep diff two tenants' active configs — flat path list with valueA/valueB | `GET /api/diff?a=:id&b=:id` |

---

## M7 · admin-ui-tenant
**Owner:** FE | **Depends on:** M4

| # | Story |
|---|-------|
| S1 | Admin shell layout: sidebar nav + header (Ant Design Layout, Sider, Menu) |
| S2 | Login page (Ant Design Form, Input.Password, Button) |
| S3 | Tenant list page: Table with name, enabled types, last updated, Edit/Delete actions |
| S4 | Create/Edit form — Branding section (Input for name/logo URL, ColorPicker for primary/secondary) |
| S5 | Create/Edit form — Claim Types section (Switch per type + dynamic doc list per type) |
| S6 | Create/Edit form — Approval Rules section (InputNumber for threshold + tier builder with add/remove) |
| S7 | Create/Edit form — Notifications section (event × channel matrix + template Input per cell) |
| S8 | Create/Edit form — SLA section (timezone Select, Checkbox.Group for weekdays, DatePicker for holidays, InputNumber per claim type, email list for escalation) |
| S9 | Create/Edit form — Custom Fields section (add/remove with name, label, type Select, required Switch, conditional constraint inputs) |
| S10 | Form validation with Zod: all architecture.md validation rules surfaced as field errors |
| S11 | Edit pre-populates form from active config |
| S12 | Delete with Popconfirm modal |
| S13 | useTenantTheme hook: when editing a tenant, update AntdProvider theme to tenant's branding colors |

---

## M8 · admin-ui-tools
**Owner:** FE | **Depends on:** M6, M7

| # | Story |
|---|-------|
| S1 | Config history panel (per tenant): Table of versions with timestamp + "current" Badge |
| S2 | Rollback action: select version → Popconfirm → call rollback API → refresh |
| S3 | Config diff page: Select Tenant A + Tenant B → call diff API → side-by-side highlighted display |
| S4 | Claim tester panel: claim type Select + InputNumber for amount + dynamic custom field inputs (rendered by type) |
| S5 | Claim tester result: Descriptions for approval tiers, required docs, notifications, SLA deadline |

---

## M9 · testing-and-deploy
**Owner:** QA + DevOps | **Depends on:** M5–M8

| # | Story |
|---|-------|
| S1 | Unit tests: processClaim engine — all 3 tenants, edge cases (zero threshold, missing type, holidays) |
| S2 | API integration tests: all M4 + M6 endpoints |
| S3 | E2E (Playwright): login → create tenant → edit → verify in list |
| S4 | E2E (Playwright): claim tester — input claim → verify result matches expected |
| S5 | E2E (Playwright): config diff — select two tenants → verify differences highlighted |
| S6 | E2E (Playwright): version history → rollback → verify active config changed |
| S7 | Deploy BE to Railway |
| S8 | Deploy PostgreSQL to Railway |
| S9 | Deploy FE to Vercel |
| S10 | Configure production env vars; smoke test live URL |

---

## Dependency Graph

```
M1 (setup)
 └── M2 (database)
      ├── M3 (auth-api)
      ├── M4 (tenant-api) ──────────────────┐
      └── M5 (process-claim-engine) ────────┤
                                            M6 (config-tools-api)
                                                 ├── M7 (admin-ui-tenant)
                                                 └── M8 (admin-ui-tools)
                                                          └── M9 (testing-deploy)
```

## Implementation Order

M1 → M2 → M3 → M4 + M5 (parallel) → M6 → M7 → M8 → M9
