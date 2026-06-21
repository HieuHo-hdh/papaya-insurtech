# M2 · database — Status

**Status:** done
**Completed:** 2026-06-21

---

## Summary

All 5 tasks for M2 are complete. The Prisma schema is live, the initial migration applied, and all 3 tenant seed configs are in the database. Both `tsc --noEmit` and `prisma db seed` (idempotent) pass clean.

---

## What was done

### T001 · Prisma Schema
- Wrote 3 models in `be/prisma/schema.prisma`: `User`, `Tenant`, `TenantConfig`
- All DB column names snake_case via `@map`; Prisma fields are camelCase
- `Tenant.deletedAt` is nullable (`DateTime?`) for soft delete
- `TenantConfig.config` is `Json` (JSONB in PostgreSQL)
- `@@unique([tenantId, version])` constraint on `tenant_configs`
- One-to-many relation: `Tenant` → `TenantConfig[]`
- `npx prisma validate` ✅ and `npx prisma generate` ✅

### T002 · Initial Migration
- Ran `npx prisma migrate dev --name init`
- Generated `prisma/migrations/20260621072909_init/migration.sql`
- Applied to `papaya_db` running in Docker (service: `papaya_postgres`)
- Tables `users`, `tenants`, `tenant_configs` confirmed in DB

### T003 · Seed Admin User + Tenant Rows
- Created `be/prisma/seed.ts` with `seedAdminAndTenants()`
- Seeded `admin@papaya.dev` / `Admin@1234` (bcrypt hash, 10 rounds)
- Seeded 3 tenant rows with stable IDs: `tenant-safeguard`, `tenant-healthfirst`, `tenant-govhealth`
- Uses `upsert` throughout — fully idempotent
- Added `"prisma": { "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts" }` to `package.json`

### T004 · Seed SafeGuard Config
- SafeGuard: 3 claim types (OUT/IN/DENTAL), `autoApprovalThreshold: 20000`, 3-tier approval (assessor→team_lead→director), email-only notifications, SLA 5d/10d/5d, Employee ID custom field
- Inserted as `tenant_configs` version 1, `isActive: true`

### T005 · Seed HealthFirst + GovHealth Configs
- HealthFirst: all 5 types, `autoApprovalThreshold: 5000`, 2-tier (assessor→manager), email+SMS, SLA 7d all, no custom fields
- GovHealth: 2 types (OUT/IN), `autoApprovalThreshold: 0` (all manual), single `committee` tier (isPrimary), email+webhook, SLA 15d all, 2 required custom fields (department + budget_code)
- Both inserted as version 1, `isActive: true`

### Fix · tsconfig exclude
- Removed `prisma/**/*` from `tsconfig.json` include and added `"prisma"` to exclude — `seed.ts` is run via `ts-node` directly, not part of the main build

---

## Verification

| Check | Result |
|-------|--------|
| `npx prisma validate` | ✅ |
| `npx prisma generate` | ✅ |
| `npx prisma migrate dev` | ✅ migration applied |
| `npx prisma db seed` (×2) | ✅ idempotent |
| `npx tsc --noEmit` | ✅ 0 errors |
| 3 tenants in DB with v1 active configs | ✅ |

---

## Next

**M3 · auth-api** — Login endpoint, JWT signing, logout (depends on M2 ✅)
