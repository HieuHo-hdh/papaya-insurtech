# T002: Initial Migration

**Module:** M2 · database
**Story:** S3
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Run the initial Prisma migration to create all three tables in PostgreSQL, producing a versioned migration file in `be/prisma/migrations/`.

## Detail
Prerequisites:
- PostgreSQL must be running (via `docker-compose up db` or local install)
- `be/.env` must exist with a valid `DATABASE_URL` (copy from `.env.example`)

Steps:
```bash
cd source/be
npx prisma migrate dev --name init
```

This will:
1. Diff the schema against the (empty) database
2. Generate `prisma/migrations/<timestamp>_init/migration.sql`
3. Apply the migration to the DB
4. Re-generate the Prisma client

Commit the generated `migration.sql` — it is the source of truth for the DB schema and must not be edited manually.

Verify the migration SQL contains:
- `CREATE TABLE "users" (...)` with `id UUID`, `email VARCHAR UNIQUE`, `password_hash VARCHAR`, `created_at TIMESTAMP`
- `CREATE TABLE "tenants" (...)` with `id UUID`, `name VARCHAR`, `deleted_at TIMESTAMP NULL`, `created_at TIMESTAMP`
- `CREATE TABLE "tenant_configs" (...)` with `id UUID`, `tenant_id UUID REFERENCES tenants(id)`, `version INTEGER`, `config JSONB`, `is_active BOOLEAN`, `created_at TIMESTAMP`
- `CREATE UNIQUE INDEX` on `tenant_configs(tenant_id, version)`

After migration, confirm via `npx prisma studio` or `psql` that all three tables exist.

## Expectation
`npx prisma migrate dev` exits 0. All three tables exist in the PostgreSQL DB. `prisma/migrations/` contains the timestamped SQL file.

## Acceptance Criteria
- [ ] `npx prisma migrate dev --name init` exits 0
- [ ] `prisma/migrations/<timestamp>_init/migration.sql` is committed
- [ ] `users`, `tenants`, `tenant_configs` tables exist in the DB
- [ ] Unique index on `(tenant_id, version)` is present
- [ ] `config` column type is `JSONB` in PostgreSQL
- [ ] `deleted_at` is nullable in `tenants`

## Dependencies
- Depends on: T001
- Blocks: T003, T004, T005

## References
- Architecture: Database Schema — constraints section
- Standards: N/A (Prisma migration workflow)
