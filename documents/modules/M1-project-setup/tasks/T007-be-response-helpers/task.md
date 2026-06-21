# T007: BE Response Helpers

**Module:** M1 · project-setup
**Story:** S7
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Implement `be/src/utils/response.ts` with `success()` and `paginated()` helper functions used by all controllers.

## Detail
Create `source/be/src/utils/response.ts` exactly as specified in coding-standards.md:

```typescript
import { ApiResponse, PaginatedData } from '@/shared/types'

export const success = <T>(data: T, message = 'OK'): ApiResponse<T> => ({
  code: 200,
  message,
  data,
})

export const paginated = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): ApiResponse<PaginatedData<T>> =>
  success({ data, total, page, pageSize })
```

No other response shapes should be created. Controllers must always call `res.json(success(...))` or `res.json(paginated(...))` — never `res.json({ ... })` directly.

Error responses are handled by `AppError` + `errorHandler` middleware (T008), not by these helpers.

## Expectation
`success({ id: '123' })` returns `{ code: 200, message: 'OK', data: { id: '123' } }`. `paginated([], 0, 1, 20)` returns the correct paginated shape.

## Acceptance Criteria
- [ ] `be/src/utils/response.ts` exists and exports `success` and `paginated`
- [ ] Both helpers are fully typed (no `any`)
- [ ] `success` and `paginated` return shapes match the API Response Shapes in architecture.md
- [ ] TypeScript `tsc` passes with no errors in this file

## Dependencies
- Depends on: T002, T004
- Blocks: none (all controllers in M4–M6 will depend on this)

## References
- Architecture: API Response Shapes
- Standards: Response helpers — always use these, never write raw res.json
