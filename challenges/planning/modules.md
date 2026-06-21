# Module Breakdown — Multi-Tenant Insurance Configuration Platform

Tech stack: Next.js 16 + TypeScript + Ant Design 5 + Tailwind CSS + Zod (FE) | Node.js + Express + TypeScript + Prisma + PostgreSQL (BE)

---

## M1 · project-setup
**Owner:** BE + FE | **Depends on:** nothing

| # | Story |
|---|-------|
| S1 | Init Next.js 16 App Router + TypeScript + Ant Design 5 + Tailwind CSS |
| S2 | Init Node.js + Express + TypeScript + Prisma BE |
| S3 | Docker Compose: PostgreSQL + BE service |
| S4 | Define shared TypeScript types + Zod schemas (`TenantConfig`, `ClaimData`, `ProcessClaimResult`, all sub-types) |
| S5 | Env config: `.env.example`, config validation on startup (Zod for env schema) |

---

## M2 · database
**Owner:** BE | **Depends on:** M1

| # | Story |
|---|-------|
| S1 | Design schema: `tenants`, `tenant_configs` (JSONB), `config_versions` |
| S2 | Write Prisma schema + relations |
| S3 | Initial migration |
| S4 | Seed script: SafeGuard, HealthFirst, GovHealth (full configs per CLAUDE.md seed table) |

Schema notes:
- `tenants(id, name, created_at)`
- `tenant_configs(id, tenant_id, version, config JSONB, created_at, is_active)` — every save = new row, one `is_active=true` per tenant
- `config_versions` is the same table; rollback = set `is_active` flag

---

## M3 · tenant-api
**Owner:** BE | **Depends on:** M2

| # | Story | Endpoint |
|---|-------|----------|
| S1 | List tenants | `GET /api/tenants` |
| S2 | Get tenant + active config | `GET /api/tenants/:id` |
| S3 | Create tenant + initial config | `POST /api/tenants` |
| S4 | Update config (auto-creates new version) | `PUT /api/tenants/:id` |
| S5 | Delete tenant | `DELETE /api/tenants/:id` |
| S6 | List version history | `GET /api/tenants/:id/versions` |
| S7 | Get specific version | `GET /api/tenants/:id/versions/:versionId` |
| S8 | Rollback to version | `POST /api/tenants/:id/rollback/:versionId` |

---

## M4 · process-claim-engine
**Owner:** BE | **Depends on:** M2

Core rule: **zero hardcoded tenant branches** — all logic driven by config JSONB.

| # | Story |
|---|-------|
| S1 | `resolveDocuments(config, claimType)` — required + optional docs from claim type config |
| S2 | `resolveApprovalTier(config, amount)` — auto-approve check + tiered range lookup |
| S3 | `resolveNotifications(config, event)` — channels + templates per event |
| S4 | `calculateSlaDeadline(config, claimType, submittedAt)` — business days arithmetic |
| S5 | `resolveCustomFields(config)` — list of required/optional custom fields |
| S6 | `processClaim(tenantId, claimData)` — orchestrates S1–S5 |
| S7 | Endpoint: `POST /api/tenants/:id/process-claim` |
| S8 | Unit tests: same claim input against all 3 tenants → different outputs |

---

## M5 · config-tools-api
**Owner:** BE | **Depends on:** M3, M4

| # | Story | Endpoint |
|---|-------|----------|
| S1 | Deep diff two tenant configs, return structured diff (added/removed/changed per field path) | `GET /api/diff?a=:id&b=:id` |
| S2 | Preview endpoint — runs processClaim without persisting | `POST /api/tenants/:id/preview-claim` |

---

## M6 · admin-ui-tenant
**Owner:** FE | **Depends on:** M3

| # | Story |
|---|-------|
| S1 | Tenant list page: table with name, enabled types, last updated, Edit/Delete actions |
| S2 | Create/Edit form — Branding section (name, logo URL, colors) |
| S3 | Create/Edit form — Claim Types section (toggle per type + required/optional docs per type) |
| S4 | Create/Edit form — Approval Rules section (threshold input + tier builder: add/remove tiers with amount range + role) |
| S5 | Create/Edit form — Notifications section (event × channel matrix + optional template per cell) |
| S6 | Create/Edit form — SLA section (business days per claim type + escalation contacts) |
| S7 | Create/Edit form — Custom Fields section (add/remove fields with name + required toggle) |
| S8 | Form validation with Zod schemas: threshold ≥ 0, ≥ 1 type enabled, SLA > 0, tiers must cover contiguous ranges |
| S9 | Edit pre-populates form from active config |
| S10 | Delete with confirmation modal |

---

## M7 · admin-ui-tools
**Owner:** FE | **Depends on:** M5, M6

| # | Story |
|---|-------|
| S1 | Config history panel (per tenant): list versions with timestamp + "current" badge |
| S2 | Rollback action: select version → confirm modal → call rollback API → refresh |
| S3 | Config diff page: select Tenant A + Tenant B → call diff API → side-by-side highlighted display |
| S4 | Preview mode panel: claim type selector + amount input + custom field inputs |
| S5 | Preview mode result: display approval tier, required docs, notifications, SLA deadline |

---

## M8 · testing-and-deploy
**Owner:** QA + DevOps | **Depends on:** M4–M7

| # | Story |
|---|-------|
| S1 | Unit tests: `processClaim` engine — all 3 tenants, edge cases (zero threshold, missing type, SLA breach) |
| S2 | API integration tests: all M3 + M5 endpoints |
| S3 | E2E (Playwright): create tenant → edit → verify in list |
| S4 | E2E (Playwright): preview mode — input claim → verify result matches expected |
| S5 | E2E (Playwright): config diff — select two tenants → verify differences highlighted |
| S6 | E2E (Playwright): version history → rollback → verify active config changed |
| S7 | Deploy BE to Railway/Render |
| S8 | Deploy PostgreSQL to Railway/Neon |
| S9 | Deploy FE to Vercel |
| S10 | Configure production env vars; smoke test live URL |

---

## Dependency Graph

```
M1 (setup)
 └── M2 (database)
      ├── M3 (tenant-api) ──────────────┐
      └── M4 (process-claim-engine) ────┤
                                        M5 (config-tools-api)
                                             └── M6 (admin-ui-tenant) ─┐
                                             └── M7 (admin-ui-tools) ──┤
                                                                        M8 (testing-deploy)
```

## Recommended Implementation Order

M1 → M2 → M3 + M4 (parallel) → M5 → M6 → M7 → M8
