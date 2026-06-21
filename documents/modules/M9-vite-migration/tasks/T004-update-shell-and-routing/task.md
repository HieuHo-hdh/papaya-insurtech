# T004: Update `AdminShell` + `lib/api/client.ts`

**Module:** M9 · vite-migration
**Story:** S4
**Tags:** FE
**Status:** todo
**Size:** S

## Description

Two existing files need surgical updates to work with React Router and Vite:

1. `components/layout/AdminShell.tsx` — swap Next.js router hooks for React Router
   equivalents and replace the `children` prop with `<Outlet />`
2. `lib/api/client.ts` — swap `process.env.NEXT_PUBLIC_*` for `import.meta.env.VITE_*`

## Detail

### `components/layout/AdminShell.tsx`

**Imports — change:**
```tsx
// Before
import { useRouter, usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// After
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
```

**Hooks — change:**
```tsx
// Before
const router   = useRouter()
const pathname = usePathname()

// After
const navigate        = useNavigate()
const { pathname }    = useLocation()
```

**Menu click handler — change:**
```tsx
// Before
onClick={({ key }) => { router.push(key); setDrawerOpen(false) }}

// After
onClick={({ key }) => { navigate(key); setDrawerOpen(false) }}
```

**Logout handler — change:**
```tsx
// Before
const handleLogout = () => { clearToken(); router.push('/login') }

// After
const handleLogout = () => { clearToken(); navigate('/login') }
```

**Function signature — change:**
```tsx
// Before
export default function AdminShell({ children }: { children: ReactNode }) {

// After
export default function AdminShell() {
```

**Content body — change:**
```tsx
// Before
<Content ...>{children}</Content>

// After
<Content ...><Outlet /></Content>
```

Nothing else in `AdminShell` changes — sidebar, breadcrumbs, header, drawer, all
styling remains exactly the same.

---

### `lib/api/client.ts`

**Line 3 — change:**
```ts
// Before
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// After
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
```

## Expectation

`AdminShell` renders its child page via `<Outlet />` — navigating between routes
updates the content area without reloading the shell. API calls hit the URL from
`VITE_API_URL` env var.

## Acceptance Criteria

- [ ] No import from `next/navigation` in `AdminShell.tsx`
- [ ] `AdminShell` accepts no props (no `children` prop)
- [ ] `<Outlet />` from `react-router-dom` renders in the Content area
- [ ] `navigate(key)` used in menu onClick
- [ ] `navigate('/login')` used in handleLogout
- [ ] `lib/api/client.ts` uses `import.meta.env.VITE_API_URL`
- [ ] `tsc --noEmit` passes on both files

## Dependencies

- Depends on: T001 (`react-router-dom` installed)
- Blocks: T002 (`src/App.tsx` wraps routes in `<AdminShell />`)
