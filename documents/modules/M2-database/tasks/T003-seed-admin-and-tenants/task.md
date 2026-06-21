# T003: Seed — Admin User + Tenant Rows

**Module:** M2 · database
**Story:** S4a (part of S4)
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Create `be/prisma/seed.ts` and seed the admin user plus 3 bare tenant rows (no config yet — configs added in T004 and T005).

## Detail
Create `source/be/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user (seeded admin: admin@papaya.dev / Admin@1234)
  const passwordHash = await bcrypt.hash('Admin@1234', 10)
  await prisma.user.upsert({
    where: { email: 'admin@papaya.dev' },
    update: {},
    create: { email: 'admin@papaya.dev', passwordHash },
  })

  // Tenant rows — configs added in T004/T005
  const tenants = [
    { id: 'tenant-safeguard', name: 'SafeGuard' },
    { id: 'tenant-healthfirst', name: 'HealthFirst' },
    { id: 'tenant-govhealth', name: 'GovHealth' },
  ]

  for (const t of tenants) {
    await prisma.tenant.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: t,
    })
  }

  console.log('Seeded admin user and 3 tenant rows')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add the seed config to `be/package.json` (already has `prisma:seed` script — verify it points to `ts-node prisma/seed.ts`).

Also add to `be/package.json` under `"prisma"` key:
```json
"prisma": {
  "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts"
}
```

Use fixed UUIDs for tenants so T004/T005 can reference them by ID without querying. Use `upsert` so re-running the seed is idempotent.

## Expectation
`npx prisma db seed` exits 0. DB has 1 user (`admin@papaya.dev`) and 3 tenants with no `tenant_configs` rows yet.

## Acceptance Criteria
- [ ] `npx prisma db seed` exits 0 and is idempotent (safe to run multiple times)
- [ ] `users` table has `admin@papaya.dev` with bcrypt-hashed `Admin@1234`
- [ ] `tenants` table has `SafeGuard`, `HealthFirst`, `GovHealth` rows with fixed IDs
- [ ] `tenant_configs` has 0 rows after this task (configs added in T004/T005)
- [ ] `package.json` has `"prisma": { "seed": "..." }` config pointing to the seed script

## Dependencies
- Depends on: T001, T002
- Blocks: T004, T005

## References
- Architecture: Seeded admin: `admin@papaya.dev` / `Admin@1234`; Seed Data table (3 tenants)
- Standards: N/A
