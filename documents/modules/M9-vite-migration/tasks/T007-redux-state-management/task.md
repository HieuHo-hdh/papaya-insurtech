# T007: Redux State Management

**Module:** M9 · vite-migration
**Story:** S7 (new)
**Tags:** FE
**Status:** dev-done
**Size:** L

## Description

Replace per-page `useState` for tenant list data with Redux Toolkit. Add typed
`useAppSelector` / `useAppDispatch` hooks. Wire add, update, and delete into the
store so every page stays in sync without re-fetching.

## Detail

### 1 · Install packages

```bash
npm install @reduxjs/toolkit react-redux
```

---

### 2 · Create `store/slices/tenantsSlice.ts`

```
source/fe/store/slices/tenantsSlice.ts
```

State shape:

```ts
interface TenantsState {
  list: TenantRow[]
  total: number
}
```

Actions:

| Action | Payload | Effect |
|--------|---------|--------|
| `setTenants` | `{ data: TenantRow[], total: number }` | Replace `list` and `total` |
| `addTenant` | `TenantRow` | Prepend to `list`, increment `total` |
| `updateTenantInList` | `TenantRow` | Replace matching item by `id` |
| `removeTenant` | `string` (id) | Filter out by `id`, decrement `total` |

---

### 3 · Create `store/slices/authSlice.ts`

```
source/fe/store/slices/authSlice.ts
```

State shape:

```ts
interface AuthState {
  token: string | null
}
```

Initialize from `localStorage.getItem('token')` so a page refresh keeps the session.

Actions:

| Action | Payload | Effect |
|--------|---------|--------|
| `setToken` | `string` | Set `token`, write to `localStorage` via side-effect in page (not in reducer) |
| `clearAuth` | — | Set `token` to `null` |

> `localStorage` writes stay in the pages / `lib/api/auth.ts` helpers. The slice is
> the single source of truth for in-memory auth state.

---

### 4 · Create `store/index.ts`

```ts
// source/fe/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import tenantsReducer from './slices/tenantsSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    tenants: tenantsReducer,
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

---

### 5 · Create typed hooks

```
source/fe/hooks/useAppSelector.ts
source/fe/hooks/useAppDispatch.ts
```

```ts
// useAppSelector.ts
import { useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState } from '@/store'
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// useAppDispatch.ts
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
export const useAppDispatch = () => useDispatch<AppDispatch>()
```

---

### 6 · Wrap app in Provider

In `source/fe/src/main.tsx`, wrap `<App />` with `<Provider store={store}>`:

```tsx
import { Provider } from 'react-redux'
import { store } from '@/store'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

---

### 7 · Apply in `TenantsPage.tsx`

Replace local `useState` for tenant list data with Redux selectors:

```ts
// Before
const [tenants, setTenants] = useState<TenantRow[]>([])
const [total, setTotal] = useState(0)

// After
const dispatch = useAppDispatch()
const tenants = useAppSelector((s) => s.tenants.list)
const total = useAppSelector((s) => s.tenants.total)
```

- In `loadTenants`: replace `setTenants(...)` / `setTotal(...)` with `dispatch(setTenants({ data: res.data.data, total: res.data.total }))`
- In `handleDelete` success: replace `loadTenants(page)` with `dispatch(removeTenant(id))`
- Keep local `loading`, `page`, `search` as `useState` (UI-only state)

---

### 8 · Apply in `NewTenantPage.tsx`

After `tenantsApi.create` succeeds:

```ts
if (isSuccess(res.code) && res.data) {
  dispatch(addTenant(res.data))
  navigate('/tenants')
}
```

---

### 9 · Apply in `TenantDetailPage.tsx`

After `tenantsApi.update` succeeds:

```ts
if (isSuccess(res.code) && res.data) {
  dispatch(updateTenantInList(res.data))
  navigate('/tenants')
}
```

---

### Folder structure after this task

```
source/fe/
  store/
    index.ts
    slices/
      tenantsSlice.ts
      authSlice.ts
  hooks/
    useAppSelector.ts
    useAppDispatch.ts
    useTenantTheme.ts   ← unchanged
```

## Expectation

- `TenantsPage` renders tenant list from Redux store; deleting a row updates the
  store without a full re-fetch.
- `NewTenantPage` dispatches `addTenant` after successful create; the tenant list
  is up-to-date when navigating back.
- `TenantDetailPage` dispatches `updateTenantInList` after successful save.
- `tsc --noEmit` passes with no new type errors.

## Acceptance Criteria

- [x] `store/index.ts` exports `store`, `RootState`, `AppDispatch`
- [x] `tenantsSlice` handles `setTenants`, `addTenant`, `updateTenantInList`, `removeTenant` correctly
- [x] `authSlice` initializes `token` from `localStorage`
- [x] `useAppSelector` and `useAppDispatch` are typed; no raw `useSelector`/`useDispatch` in pages
- [x] `TenantsPage` reads `list` and `total` from Redux; no `useState` for those fields
- [x] `TenantsPage` dispatches `removeTenant` on successful delete (no full re-fetch)
- [x] `NewTenantPage` dispatches `addTenant` after create
- [x] `TenantDetailPage` dispatches `updateTenantInList` after update
- [x] `Provider` wraps `<App />` in `src/main.tsx`
- [x] `tsc --noEmit` passes

## Dependencies

- Depends on: T001 (packages installed), T003 (pages exist)
- Blocks: T010 (TenantsPage tests rely on Redux store)

## References

- Architecture: State management section
- Standards: `documents/planning/coding-standards.md` — FE folder structure, hooks naming

## Questions
<!-- Dev or QA fills in questions for BA/SA here before starting. Leave blank on creation. -->

## Dev Notes

- `authSlice` initializes `token` directly from `localStorage.getItem('token')` in the slice `initialState`; localStorage writes remain in `lib/api/auth.ts` helpers (`saveToken`, `clearToken`) — no change to those.
- `NewTenantPage` and `TenantDetailPage` guard the `res.data` truthiness check (`&& res.data`) before dispatching, which required a small change from the original `isSuccess(res.code)` pattern.

## QA Report
<!-- QA fills in after testing. Leave blank on creation. -->
