# M4 · tenant-api — Status

**Status:** done
**Completed:** 2026-06-21

---

## Summary

All 8 tasks implemented and smoke-tested live. Rollback path resolved in tenants.routes.ts to match architecture spec exactly (`POST /api/tenants/:id/rollback/:versionId`).

---

## What was done

### T001 · List Tenants
- `list(page, pageSize)` service — `findMany` with `deletedAt: null`, includes active config, ordered by `createdAt desc`
- Returns paginated shape via `paginated()` helper

### T002 · Get Tenant
- `getById(id)` — `findFirst` with `{ id, deletedAt: null }`, throws `AppError(404)` for both missing and deleted tenants

### T003 · Create Tenant
- `create(name, config)` — Prisma `$transaction`: creates tenant row + version 1 config (`isActive: true`)
- Added `CreateTenantSchema` to `shared/schemas.ts`; returns 201

### T004 · Update Tenant Config
- `update(id, config)` — `$transaction`: finds `max(version) + 1`, `updateMany` to deactivate current, creates new active version
- Added `UpdateTenantSchema` to `shared/schemas.ts`

### T005 · Soft-Delete Tenant
- `remove(id)` — sets `deletedAt = new Date()`; tenant and all config rows remain in DB
- After deletion, `GET /tenants/:id` and `GET /tenants` both exclude the tenant

### T006 · List Version History
- `listVersions(tenantId, page, pageSize)` in versions module — ordered newest first, validates tenant exists first

### T007 · Get Specific Version
- `getVersion(tenantId, versionId)` — scoped to `{ id: versionId, tenantId }` to prevent cross-tenant leakage

### T008 · Rollback
- `rollback(tenantId, versionId)` — `$transaction`: finds next version number, deactivates current, creates new version as copy of target config
- Path `POST /api/tenants/:id/rollback/:versionId` registered in **tenants.routes.ts** (not versions.routes.ts), resolving the architecture path mismatch

### Schema fix
- `SlaConfigSchema.perClaimType` changed from `z.record(ClaimTypeEnum, ...)` to `z.record(z.string(), ...)` — Zod v4 requires all enum keys in `z.record(z.enum, ...)` which broke partial SLA configs (e.g. GovHealth only sets 2 of 5 types)
- Synced to `source/shared/` and `fe/shared/`

---

## Verification (live smoke test)

| Test | Result |
|------|--------|
| `GET /api/tenants` — 3 tenants, paginated | ✅ |
| `GET /api/tenants/tenant-safeguard` — with active config | ✅ |
| `GET /api/tenants/nonexistent` — 404 | ✅ |
| `POST /api/tenants` — create TestCo, version 1 | ✅ |
| `POST /api/tenants` — invalid config → 400 with details | ✅ |
| `PUT /api/tenants/tenant-safeguard` — creates v2, deactivates v1 | ✅ |
| `DELETE /api/tenants/:id` — soft-delete, subsequent GET → 404 | ✅ |
| `GET /api/tenants/tenant-safeguard/versions` — total 2, newest first | ✅ |
| `GET /api/tenants/tenant-safeguard/versions/:v1Id` — v1, isActive false | ✅ |
| `POST /api/tenants/tenant-safeguard/rollback/:v1Id` — creates v3, active | ✅ |
| Linear history preserved (v1, v2, v3 all in DB) | ✅ |
| `tsc --noEmit` | ✅ 0 errors |
| `npm test` | ✅ 7/7 pass |

---

## Next

**M5 · process-claim-engine** + **M6 · config-tools-api** (parallel, both depend on M2 ✅, M4 ✅)
