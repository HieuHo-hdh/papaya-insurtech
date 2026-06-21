# T002: Init BE Source

**Module:** M1 · project-setup
**Story:** S2
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Bootstrap the Node.js + Express + TypeScript + Prisma backend in `challenges/be/` with the full folder structure from coding-standards.md.

## Detail
Initialize the BE project inside `challenges/be/`. Requirements:
- `package.json` with dependencies: `express`, `@types/express`, `typescript`, `ts-node`, `prisma`, `@prisma/client`, `jsonwebtoken`, `@types/jsonwebtoken`, `bcryptjs`, `@types/bcryptjs`, `zod`, `dayjs`, `dotenv`, `cors`, `@types/cors`
- `tsconfig.json`: `strict: true`, `module: commonjs`, `target: ES2020`, path alias `@/*` → `./src/*`
- Scaffold folder structure per coding-standards.md:
  ```
  be/src/
    config/           (empty — filled by T005, T006)
    middleware/       (empty — filled by T009, T010; errorHandler.ts stub)
    modules/
      auth/           (auth.routes.ts, auth.controller.ts, auth.service.ts — stubs)
      tenants/        (tenants.routes.ts, tenants.controller.ts, tenants.service.ts — stubs)
      versions/       (versions.routes.ts, versions.controller.ts, versions.service.ts — stubs)
      claims/         (claims.routes.ts, claims.controller.ts, claims.service.ts — stubs)
      diff/           (diff.routes.ts, diff.controller.ts, diff.service.ts — stubs)
    engine/           (empty — filled by M5)
    shared/           (empty — filled by T004/T005)
    utils/            (empty — filled by T007, T008)
    app.ts            Express app factory
    index.ts          server entry (import app, listen on PORT)
  ```
- `app.ts` must: create Express app, register JSON middleware, `cors()`, mount route stubs, export app
- `index.ts` must: import `app`, call `app.listen(process.env.PORT ?? 3001)`
- Stub route files export an Express `Router` with no routes defined yet
- Add `prisma init` (creates `prisma/schema.prisma` with provider `postgresql`)
- `package.json` scripts: `dev` (ts-node-dev or tsx watch), `build` (tsc), `start` (node dist/index.js)

Files to create:
- `challenges/be/package.json`
- `challenges/be/tsconfig.json`
- `challenges/be/src/app.ts`
- `challenges/be/src/index.ts`
- `challenges/be/src/middleware/errorHandler.ts` (stub — catches Error, sends 500)
- All stub module files (routes/controller/service)
- `challenges/be/prisma/schema.prisma`

## Expectation
`cd challenges/be && npm install && npm run dev` starts on port 3001 with no TS errors. `GET /` or any endpoint returns a response (even 404).

## Acceptance Criteria
- [ ] `npm run dev` starts without errors on port 3001
- [ ] `npm run build` (tsc) passes with zero errors
- [ ] Folder structure matches coding-standards.md exactly
- [ ] All stub module files export a valid Express Router
- [ ] `prisma/schema.prisma` exists with `provider = "postgresql"`
- [ ] `src/app.ts` exports the Express app (not listening inline)

## Dependencies
- Depends on: none
- Blocks: T003, T005, T006, T007, T008, T009, T010

## References
- Architecture: Tech Stack, API Endpoints
- Standards: Backend Folder structure, Patterns (controller/service/engine)
