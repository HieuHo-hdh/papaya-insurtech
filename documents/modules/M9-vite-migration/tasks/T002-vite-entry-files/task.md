# T002: Vite Entry Files

**Module:** M9 · vite-migration
**Story:** S2
**Tags:** FE
**Status:** todo
**Size:** S

## Description

Create the Vite entry point files that replace Next.js App Router's built-in
HTML shell and `app/layout.tsx`. These live in two locations:

- `index.html` — Vite's HTML entry point (project root)
- `src/main.tsx` — React DOM mount
- `src/App.tsx` — top-level router + provider wrapper
- `src/index.css` — global styles (replaces `app/globals.css`)
- `vite.config.ts` — Vite configuration

## Detail

### `index.html` (at `source/fe/`)

```html
<!doctype html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Insurance Config Platform</title>
  </head>
  <body class="min-h-full antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `vite.config.ts` (at `source/fe/`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
```

The `@` alias maps to the project root (`.`), keeping all existing
`@/components/...`, `@/lib/...`, `@/shared/...`, `@/hooks/...` imports valid.

### `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### `src/index.css`

```css
@import "tailwindcss";

body {
  background: #F9FAFB;
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### `src/App.tsx`

Declares all routes. `AdminShell` wraps protected routes as a layout route — its
`<Outlet />` renders the active child page.

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AntdProvider } from '@/components/providers/AntdProvider'
import AdminShell from '@/components/layout/AdminShell'
import LoginPage from '@/pages/LoginPage'
import TenantsPage from '@/pages/tenants/TenantsPage'
import NewTenantPage from '@/pages/tenants/NewTenantPage'
import TenantDetailPage from '@/pages/tenants/TenantDetailPage'
import DiffPage from '@/pages/DiffPage'

export default function App() {
  return (
    <BrowserRouter>
      <AntdProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminShell />}>
            <Route index element={<Navigate to="/tenants" replace />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/new" element={<NewTenantPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
            <Route path="/diff" element={<DiffPage />} />
          </Route>
        </Routes>
      </AntdProvider>
    </BrowserRouter>
  )
}
```

## Expectation

`npm run dev` starts Vite dev server, loads `index.html`, mounts React app at
`#root`, and navigates to `/tenants` by default.

## Acceptance Criteria

- [ ] `index.html` exists at project root with `<div id="root">` and `src/main.tsx` script
- [ ] `vite.config.ts` sets `@` alias to project root and includes `react()` + `tailwindcss()` plugins
- [ ] `src/main.tsx` mounts `<App />` in `StrictMode`
- [ ] `src/index.css` imports tailwindcss and sets base body styles
- [ ] `src/App.tsx` declares all 5 routes with `AdminShell` as layout wrapper
- [ ] `tsc --noEmit` passes on these files

## Dependencies

- Depends on: T001 (packages installed), T003 (page components must exist), T004 (AdminShell updated)
- Blocks: T006
