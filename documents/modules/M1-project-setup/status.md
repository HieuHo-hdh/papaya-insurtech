# M1 · project-setup — Status

**Status:** done
**Completed:** 2026-06-21

---

## Summary

All 13 tasks for M1 are complete. The project scaffolding for both BE and FE is in place and both TypeScript builds pass with zero errors.

---

## What was done

### T001 · Init FE source
- Next.js 16 + TypeScript + Ant Design 6 + Tailwind v4 already bootstrapped in `fe/`
- Added full App Router route tree: `(auth)/login/`, `(admin)/layout.tsx`, `(admin)/tenants/`, `(admin)/tenants/[id]/`, `(admin)/tenants/new/`, `(admin)/diff/` — all with null placeholder pages
- Created component directory structure: `layout/`, `tenants/`, `claims/`, `diff/`, `ui/` under `components/`
- Created `hooks/` directory
- Added `lib/config.ts` (NEXT_PUBLIC_API_URL), `lib/utils.ts` (formatDate, formatCurrency), and API stub files (`lib/api/auth.ts`, `tenants.ts`, `claims.ts`, `diff.ts`)
- Added `fe/.env.local.example`

### T002 · Init BE source
- Express + TypeScript + Prisma scaffold in `be/`
- Added `baseUrl` + `paths (@/* → ./src/*)` to `tsconfig.json`; installed `tsconfig-paths` and updated `dev` script to use `-r tsconfig-paths/register`
- Added `dayjs` to dependencies
- Created `src/app.ts` — Express app factory (cors, json, auth middleware, all route mounts, errorHandler)
- Created `src/index.ts` — server entry (loads env → dayjs → app → listen)
- Created stub modules for all 5 domains: `auth/`, `tenants/`, `versions/`, `claims/`, `diff/` (routes + controller + service per module)
- Created `src/types/express.d.ts` — augments `Request` with `user`
- Created `src/engine/` directory (engine functions implemented in M5)
- Created `prisma/schema.prisma` with datasource + generator (models added in M2)

### T003 · Docker Compose
- `source/docker-compose.yml` already present with `postgres` + `be` services
- `be/Dockerfile` already present

### T004 · Shared types + schemas
- `source/shared/types.ts` and `schemas.ts` already fully defined
- Copied to `be/src/shared/` and `fe/shared/`
- Created `source/shared/sync.sh` to re-sync on future changes

### T005 · BE env config
- Created `be/src/config/env.ts` — Zod schema for `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`; loads dotenv; imported first in `index.ts`
- Created `be/.env.example` with all required vars

### T006 · BE dayjs config
- Created `be/src/config/dayjs.ts` — extends dayjs with `utc`, `timezone`, `customParseFormat` plugins; imported in `index.ts` before app

### T007 · BE response helpers
- Created `be/src/utils/response.ts` — `success<T>()` and `paginated<T>()` helpers matching architecture.md response shapes

### T008 · BE AppError + errorHandler
- Created `be/src/utils/AppError.ts` — custom error class with `statusCode`, `message`, `details`
- Created `be/src/middleware/errorHandler.ts` — catches `AppError` → sends correct HTTP status; unhandled errors → 500; registered last in `app.ts`

### T009 · BE validate middleware
- Created `be/src/middleware/validate.ts` — wraps any Zod schema, parses `req.body`, throws `AppError(400)` with flattened field errors on failure

### T010 · BE auth middleware
- Created `be/src/middleware/auth.ts` — verifies Bearer JWT, attaches `req.user`; `POST /api/auth/login` bypasses it
- Created `be/src/types/express.d.ts` — `Express.Request` augmented with `user?: { id, email }`

### T011 · FE AntdProvider + theme context
- `fe/components/providers/AntdProvider.tsx` already present — `ConfigProvider` + `ThemeContext` with `setPrimaryColor`, `setSecondaryColor`, `resetTheme`
- `fe/lib/theme.ts` already present — `buildTheme()` maps colors to Ant Design tokens
- `fe/app/layout.tsx` already wraps children with `AntdProvider`

### T012 · FE API client
- `fe/lib/api/client.ts` already present — `apiClient` (get/post/put/delete), `isSuccess`, `isUnauthorized`, `isNotFound`, `isValidationError`; reads Bearer token from `localStorage`

### T013 · FE copy shared types
- `fe/shared/types.ts` and `fe/shared/schemas.ts` already present and in sync with `source/shared/`

---

## Verification

| Check | Result |
|-------|--------|
| `cd be && npx tsc --noEmit` | ✅ 0 errors |
| `cd fe && npx tsc --noEmit` | ✅ 0 errors |
| BE folder structure matches coding-standards.md | ✅ |
| FE folder structure matches coding-standards.md | ✅ |
| All `@/*` path aliases resolve | ✅ |
| docker-compose.yml present | ✅ |
| shared/sync.sh syncs to both be and fe | ✅ |

---

## Next

**M2 · database** — Prisma schema models, initial migration, seed data (depends on M1 ✅)
