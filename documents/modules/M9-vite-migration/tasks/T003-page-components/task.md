# T003: Page Components (`pages/` folder)

**Module:** M9 · vite-migration
**Story:** S3
**Tags:** FE
**Status:** todo
**Size:** M

## Description

Port each Next.js App Router page file to a plain React component in a new
`pages/` folder. Business logic, JSX, and styling are **unchanged** — only the
framework-specific imports and function signatures are updated.

## Detail

### Change rules (applied to every page)

| Before (Next.js) | After (Vite + React Router) |
|------------------|-----------------------------|
| `'use client'` directive at top | Remove entirely |
| `import { useRouter } from 'next/navigation'` | `import { useNavigate } from 'react-router-dom'` |
| `const router = useRouter()` | `const navigate = useNavigate()` |
| `router.push('/path')` | `navigate('/path')` |
| `router.replace('/path')` | `navigate('/path', { replace: true })` |

---

### `pages/LoginPage.tsx`

Source: `app/(auth)/login/page.tsx`

Additional changes:
- `router.replace('/tenants')` → `navigate('/tenants', { replace: true })`

---

### `pages/tenants/TenantsPage.tsx`

Source: `app/(admin)/tenants/page.tsx`

No additional changes beyond the standard rules above.

---

### `pages/tenants/NewTenantPage.tsx`

Source: `app/(admin)/tenants/new/page.tsx`

No additional changes beyond the standard rules above.

---

### `pages/tenants/TenantDetailPage.tsx`

Source: `app/(admin)/tenants/[id]/page.tsx`

Additional changes:
- Remove `use` from React imports (no longer needed)
- Add `useParams` import: `import { useNavigate, useParams } from 'react-router-dom'`
- Change function signature from:
  ```tsx
  export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> })
  ```
  to:
  ```tsx
  export default function TenantDetailPage()
  ```
- Remove: `const { id } = use(params)`
- Add as first line in component body: `const { id } = useParams<{ id: string }>()`

---

### `pages/DiffPage.tsx`

Source: `app/(admin)/diff/page.tsx`

No additional changes beyond the standard rules above.

---

### Folder structure after this task

```
source/fe/
  pages/
    LoginPage.tsx
    DiffPage.tsx
    tenants/
      TenantsPage.tsx
      NewTenantPage.tsx
      TenantDetailPage.tsx
```

## Expectation

All 5 page components render the same UI as their Next.js counterparts.
Navigation via `navigate()` works identically to `router.push()`.
`useParams<{ id: string }>()` resolves the tenant ID from the URL.

## Acceptance Criteria

- [ ] `pages/LoginPage.tsx` — no `'use client'`, uses `useNavigate`
- [ ] `pages/tenants/TenantsPage.tsx` — no `'use client'`, uses `useNavigate`
- [ ] `pages/tenants/NewTenantPage.tsx` — no `'use client'`, uses `useNavigate`
- [ ] `pages/tenants/TenantDetailPage.tsx` — no `'use client'`, uses `useParams` + `useNavigate`, no `use(params)`
- [ ] `pages/DiffPage.tsx` — no `'use client'`, uses `useNavigate`
- [ ] No imports from `next/navigation` anywhere in `pages/`
- [ ] `tsc --noEmit` passes on all page files

## Dependencies

- Depends on: T001 (`react-router-dom` installed)
- Blocks: T002 (`src/App.tsx` imports from `pages/`)
