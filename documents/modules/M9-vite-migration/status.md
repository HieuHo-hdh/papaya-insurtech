# M9 · vite-migration — Status

**Status:** in-progress
**Started:** 2026-06-21

## Goal

Migrate the frontend from Next.js 16 (App Router) to Vite + React Router v7.
All business logic, UI components, and API clients stay **unchanged** — only the
framework plumbing (routing, entry point, config files) is replaced.

## Summary of Tasks

| Task | Description | Size | Status |
|------|-------------|------|--------|
| T001 | Install/remove packages | S | todo |
| T002 | Vite entry files (`index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `vite.config.ts`) | S | todo |
| T003 | Page components (`pages/` folder — port Next.js pages to plain React) | M | todo |
| T004 | Update `AdminShell` layout (swap `next/navigation` → RR `Outlet`) | S | todo |
| T005 | Config files (`tsconfig.json`, `eslint.config.mjs`, `.env`, `.gitignore`, `.prettierignore`, `vercel.json`) | S | todo |
| T006 | Delete old Next.js files + run `tsc --noEmit` | S | todo |
| T007 | Redux state management (`tenantsSlice`, `authSlice`, `useAppSelector`, apply in pages) | L | pending |

## What Does NOT Change

- `components/` — all Ant Design UI components, including `TenantForm`, `VersionHistory`, `ClaimTester`, `AntdProvider`
- `lib/` — all API clients, auth helpers, theme
- `hooks/` — `useTenantTheme`, any other custom hooks
- `shared/` — all types and Zod schemas
- `public/` — static assets

## Route Map (Next.js → React Router)

| Next.js App Router path | React Router path | New page file |
|-------------------------|-------------------|---------------|
| `app/(auth)/login/page.tsx` | `/login` | `pages/LoginPage.tsx` |
| `app/(admin)/tenants/page.tsx` | `/tenants` | `pages/tenants/TenantsPage.tsx` |
| `app/(admin)/tenants/new/page.tsx` | `/tenants/new` | `pages/tenants/NewTenantPage.tsx` |
| `app/(admin)/tenants/[id]/page.tsx` | `/tenants/:id` | `pages/tenants/TenantDetailPage.tsx` |
| `app/(admin)/diff/page.tsx` | `/diff` | `pages/DiffPage.tsx` |

## Key Changes Per File

- Remove `'use client'` directive (not needed in Vite)
- `useRouter` from `next/navigation` → `useNavigate` from `react-router-dom`
- `usePathname` from `next/navigation` → `useLocation` from `react-router-dom`
- `router.push(x)` → `navigate(x)`
- Next.js dynamic segment `{ params: Promise<{ id: string }> }` → `useParams<{ id: string }>()`
- `AdminShell` children prop → `<Outlet />` (React Router nested layout)
- `process.env.NEXT_PUBLIC_API_URL` → `import.meta.env.VITE_API_URL`
