# T012: FE API Client

**Module:** M1 · project-setup
**Story:** S12
**Tags:** FE
**Status:** pending
**Size:** S

## Description
Implement `fe/lib/api/client.ts` — the base fetch wrapper with `isSuccess` and `isUnauthorized` helpers used by all FE API modules.

## Detail
Create `challenges/fe/lib/api/client.ts`:
```typescript
import type { ApiResponse } from '@/shared/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const isSuccess = (code: number) => code >= 200 && code < 300

export const isUnauthorized = (code: number) => code === 401

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  return res.json() as Promise<ApiResponse<T>>
}
```

Add `NEXT_PUBLIC_API_URL` to `challenges/fe/.env.local.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

All domain-specific API modules (`lib/api/tenants.ts`, `lib/api/auth.ts`, etc.) must import and call `apiRequest` — never `fetch` directly.

The `isUnauthorized` helper is used by callers to redirect to `/login` on 401. Token storage is `localStorage` (simple for this challenge — no HttpOnly cookies needed).

## Expectation
`apiRequest<TenantConfig[]>('/api/tenants')` returns a typed `ApiResponse<TenantConfig[]>`. An expired token causes `isUnauthorized(response.code)` to return true.

## Acceptance Criteria
- [ ] `fe/lib/api/client.ts` exports `apiRequest`, `isSuccess`, `isUnauthorized`
- [ ] `apiRequest` reads the Bearer token from `localStorage` automatically
- [ ] `NEXT_PUBLIC_API_URL` is used as the base URL (falls back to `http://localhost:3001`)
- [ ] `fe/.env.local.example` documents `NEXT_PUBLIC_API_URL`
- [ ] No direct `fetch()` calls in any file other than `client.ts`
- [ ] TypeScript passes with no errors

## Dependencies
- Depends on: T001, T013
- Blocks: none (M7 will add lib/api/tenants.ts etc.)

## References
- Architecture: API Response Shapes, API Endpoints
- Standards: All API calls go through lib/api/client.ts, never fetch directly
