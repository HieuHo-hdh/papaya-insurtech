# T013: FE Copy Shared Types

**Module:** M1 · project-setup
**Story:** S13
**Tags:** FE
**Status:** pending
**Size:** S

## Description
Copy `challenges/shared/types.ts` and `challenges/shared/schemas.ts` into `challenges/fe/shared/` so the FE can import them via `@/shared/types` and `@/shared/schemas`.

## Detail
Create the `challenges/fe/shared/` directory and copy the shared files:
```bash
mkdir -p challenges/fe/shared
cp challenges/shared/types.ts challenges/fe/shared/types.ts
cp challenges/shared/schemas.ts challenges/fe/shared/schemas.ts
```

The `tsconfig.json` path alias `@/*` already maps to the `fe/` root (or `fe/src/` — match what T001 configured), so `import type { TenantConfig } from '@/shared/types'` resolves correctly.

Add a comment at the top of each copied file noting it is auto-generated from `challenges/shared/` and must not be edited directly:
```typescript
// AUTO-GENERATED — edit challenges/shared/types.ts, then run challenges/shared/sync.sh
```

Update `challenges/shared/sync.sh` (created in T004) to also copy to FE:
```bash
cp types.ts ../fe/shared/types.ts
cp schemas.ts ../fe/shared/schemas.ts
```

Verify the FE can import from shared after copying:
- `import type { TenantConfig } from '@/shared/types'` resolves in any FE file
- `import { TenantConfigSchema } from '@/shared/schemas'` resolves in any FE file
- `npm run build` passes

## Expectation
`import type { TenantConfig } from '@/shared/types'` works in FE files without TypeScript errors. `TenantConfigSchema.safeParse({})` is callable in FE code.

## Acceptance Criteria
- [ ] `fe/shared/types.ts` exists and matches `challenges/shared/types.ts`
- [ ] `fe/shared/schemas.ts` exists and matches `challenges/shared/schemas.ts`
- [ ] Auto-generated comment present at top of both files
- [ ] `@/shared/types` and `@/shared/schemas` resolve in FE files
- [ ] `npm run build` in `challenges/fe/` passes after copy
- [ ] `sync.sh` updated to include FE copy step

## Dependencies
- Depends on: T001, T004
- Blocks: T011, T012

## References
- Architecture: TenantConfig JSONB Shape
- Standards: Naming conventions (Types: PascalCase, Schemas: PascalCase + Schema suffix)
