# T001: API Clients — Auth + Tenants

**Module:** M6 · admin-ui-tenant
**Story:** S1 (prerequisite)
**Tags:** FE
**Status:** done
**Size:** S

## Description
Implement `lib/api/auth.ts` and `lib/api/tenants.ts` — typed wrappers around `apiClient` for all auth and tenant endpoints. These are the data layer used by all M6 pages.

## Detail

### `fe/lib/api/auth.ts`

```typescript
import { apiClient } from './client'
import type { ApiResponse } from '@/shared/types'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string }>('/auth/login', { email, password }),

  logout: () =>
    apiClient.post<null>('/auth/logout', {}),
}

export function saveToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function hasToken(): boolean {
  return !!localStorage.getItem('token')
}
```

---

### `fe/lib/api/tenants.ts`

All endpoints from M4:

```typescript
import { apiClient } from './client'
import type { TenantConfig, ApiResponse } from '@/shared/types'

export interface TenantRow {
  id: string
  name: string
  createdAt: string
  configs: { config: TenantConfig; version: number; isActive: boolean; createdAt: string }[]
}

export interface PaginatedTenants {
  data: TenantRow[]
  total: number
  page: number
  pageSize: number
}

export const tenantsApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedTenants>(`/tenants?page=${page}&pageSize=${pageSize}`),

  getById: (id: string) =>
    apiClient.get<TenantRow>(`/tenants/${id}`),

  create: (name: string, config: TenantConfig) =>
    apiClient.post<TenantRow>('/tenants', { name, config }),

  update: (id: string, config: TenantConfig) =>
    apiClient.put<TenantRow>(`/tenants/${id}`, { config }),

  remove: (id: string) =>
    apiClient.delete<null>(`/tenants/${id}`),

  listVersions: (id: string, page = 1, pageSize = 20) =>
    apiClient.get<{ data: VersionRow[]; total: number; page: number; pageSize: number }>(
      `/tenants/${id}/versions?page=${page}&pageSize=${pageSize}`
    ),

  getVersion: (id: string, versionId: string) =>
    apiClient.get<VersionRow>(`/tenants/${id}/versions/${versionId}`),

  rollback: (id: string, versionId: string) =>
    apiClient.post<TenantRow>(`/tenants/${id}/rollback/${versionId}`, {}),
}

export interface VersionRow {
  id: string
  tenantId: string
  version: number
  config: TenantConfig
  isActive: boolean
  createdAt: string
}
```

**Notes:**
- `TenantRow.configs` always has exactly 1 entry (active config) from the BE `ACTIVE_CONFIG` include
- All functions return the full `ApiResponse<T>` — callers check `isSuccess(res.code)` before using `res.data`
- No error throwing in API lib — let the caller handle error states

## Expectation
`tenantsApi.list()` returns typed `ApiResponse<PaginatedTenants>`. Callers can destructure `res.data.data` for the tenant array.

## Acceptance Criteria
- [ ] `lib/api/auth.ts` exports `authApi`, `saveToken`, `clearToken`, `hasToken`
- [ ] `lib/api/tenants.ts` exports `tenantsApi`, `TenantRow`, `VersionRow`, `PaginatedTenants`
- [ ] All endpoints match M4 API routes exactly
- [ ] No `any` types
- [ ] `tsc --noEmit` (or `next build`) passes

## Dependencies
- Depends on: none (lib/api/client.ts already implemented in M1)
- Blocks: T002, T003, T004

## References
- Architecture: API Endpoints (Tenants, Auth sections)
- Standards: All API calls go through `lib/api/client.ts`, never fetch directly
