# M6 · config-tools-api — Status

**Status:** done
**Completed:** 2026-06-21

## Summary

- **T001** `GET /api/diff?a=:id&b=:id` — deep flat-diff of two tenants' active configs
  - `diff.service.ts`: loads both active configs via Prisma, calls `flatDiff` recursive algorithm
  - `diff.controller.ts`: validates `a` and `b` query params, returns `success(result)`
  - `diff.routes.ts`: `GET /` with `asyncHandler`
  - Algorithm: recurses into objects by key, treats arrays as atomic (JSON.stringify comparison), emits `{ path, valueA, valueB }` at every differing leaf

## TypeScript

`tsc --noEmit` passes with zero errors. All 39 tests pass.
