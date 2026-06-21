# T001: Init FE Source

**Module:** M1 · project-setup
**Story:** S1
**Tags:** FE
**Status:** pending
**Size:** M

## Description
Bootstrap the Next.js 16 App Router project with TypeScript, Ant Design 6, and Tailwind v4 in `source/fe/`.

## Detail
Create a new Next.js 16 project inside `source/fe/` using the App Router. Configure:
- TypeScript strict mode (`strict: true` in `tsconfig.json`)
- Tailwind v4 (via `@tailwindcss/postcss` plugin, no `tailwind.config.js` — uses CSS `@import "tailwindcss"` in `globals.css`)
- Ant Design 6 (`antd`, `@ant-design/icons`)
- Path alias `@/*` → `./src/*` (or root-relative — match coding-standards.md folder layout)
- Scaffold folder structure per coding-standards.md:
  - `app/(auth)/login/`, `app/(admin)/layout.tsx`, `app/(admin)/tenants/`, `app/(admin)/diff/`
  - `components/providers/`, `components/layout/`, `components/tenants/`, `components/claims/`, `components/diff/`, `components/ui/`
  - `lib/api/`, `lib/theme.ts`, `lib/utils.ts`
  - `hooks/`
- Add placeholder `page.tsx` files (just `export default function Page() { return null }`) in each route so the build doesn't error
- Root `app/layout.tsx` wraps children with `AntdProvider` (import stub — AntdProvider is created in T011)
- `app/globals.css` must import Tailwind v4 (`@import "tailwindcss"`)
- Dev server must start with `npm run dev` on port 3000

Files to create/touch:
- `source/fe/package.json`
- `source/fe/tsconfig.json`
- `source/fe/next.config.ts`
- `source/fe/postcss.config.mjs`
- `source/fe/app/globals.css`
- `source/fe/app/layout.tsx` (stub — adds AntdProvider once T011 done)
- All placeholder route files per coding-standards.md

## Expectation
`cd source/fe && npm install && npm run dev` starts on port 3000 with no errors. TypeScript check (`npm run build`) passes on stub pages.

## Acceptance Criteria
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes with no type errors
- [ ] Folder structure matches coding-standards.md exactly
- [ ] Ant Design 6 and Tailwind v4 are installed (check `package.json`)
- [ ] `app/globals.css` includes `@import "tailwindcss"`
- [ ] No raw HTML elements used for text or layout in any placeholder (just return null)

## Dependencies
- Depends on: none
- Blocks: T011, T012, T013

## References
- Architecture: Tech Stack section
- Standards: Frontend Folder structure, Component rules
