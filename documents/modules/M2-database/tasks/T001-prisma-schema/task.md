# T001: Prisma Schema — Models + Relations + Indexes

**Module:** M2 · database
**Story:** S1 + S2
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Write the full Prisma schema in `be/prisma/schema.prisma` — three models (`users`, `tenants`, `tenant_configs`) with all columns, relations, and constraints from architecture.md.

## Detail
Update `source/be/prisma/schema.prisma` (currently has only generator + datasource from M1):

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("users")
}

model Tenant {
  id        String        @id @default(uuid())
  name      String
  deletedAt DateTime?     @map("deleted_at")
  createdAt DateTime      @default(now()) @map("created_at")
  configs   TenantConfig[]

  @@map("tenants")
}

model TenantConfig {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  version   Int
  config    Json
  isActive  Boolean  @default(false) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, version])
  @@map("tenant_configs")
}
```

Key constraints to verify in the schema:
- `@@unique([tenantId, version])` — prevents duplicate versions per tenant
- `deletedAt` is nullable — soft delete marker; queries must filter `deletedAt: null`
- `isActive` — at most one `true` per tenant, enforced at app layer (not DB constraint)
- `config` is `Json` — stores a full `TenantConfig` object as JSONB in PostgreSQL
- All PK/FK use uuid strings (not auto-increment ints)
- Column names are snake_case in DB (`@map`), camelCase in Prisma/TS

After writing: run `npx prisma format` to auto-format the schema file.

## Expectation
`npx prisma validate` passes with no errors. `npx prisma generate` generates the Prisma client with correct TypeScript types.

## Acceptance Criteria
- [ ] `npx prisma validate` exits 0
- [ ] `npx prisma generate` exits 0 and produces client types for `User`, `Tenant`, `TenantConfig`
- [ ] `@@unique([tenantId, version])` constraint is present on `tenant_configs`
- [ ] `Tenant.deletedAt` is nullable (`DateTime?`)
- [ ] `TenantConfig.config` is type `Json`
- [ ] All column DB names are snake_case via `@map`
- [ ] Tenant → TenantConfig relation defined (one-to-many)

## Dependencies
- Depends on: none (M1 ✅ — prisma/schema.prisma stub exists)
- Blocks: T002, T003, T004, T005

## References
- Architecture: Database Schema section (users, tenants, tenant_configs tables + constraints)
- Standards: Backend — Prisma schema conventions
