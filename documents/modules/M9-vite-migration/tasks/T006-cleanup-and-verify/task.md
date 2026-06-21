# T006: Cleanup Old Next.js Files + Verify

**Module:** M9 · vite-migration
**Story:** S6
**Tags:** FE, infra
**Status:** todo
**Size:** S

## Description

Delete all Next.js-specific files that are no longer needed, then verify the
migration with `tsc --noEmit`. The `app/` directory and its contents are fully
replaced by `pages/` + `src/`.

## Detail

### Files / directories to delete

```bash
rm -rf app/
rm -f next.config.ts
rm -f next-env.d.ts
rm -f postcss.config.mjs
rm -f tsconfig.tsbuildinfo
rm -f AGENTS.md
rm -f CLAUDE.md
```

> Only delete if the file/directory exists — skip silently if absent.

| Path | Why removed |
|------|-------------|
| `app/` | Replaced by `pages/` + `src/App.tsx` |
| `next.config.ts` | No longer needed without Next.js |
| `next-env.d.ts` | Next.js-generated type reference |
| `postcss.config.mjs` | Replaced by `@tailwindcss/vite` plugin |
| `tsconfig.tsbuildinfo` | Stale incremental build cache |
| `AGENTS.md` | Next.js-specific agent instructions |
| `CLAUDE.md` | Next.js-specific Claude instructions (project root has its own) |

### Verification

Run TypeScript check after all other tasks are complete:

```bash
npx tsc --noEmit
```

Expected: zero errors.

If errors appear, common causes and fixes:

| Error | Fix |
|-------|-----|
| `Cannot find module 'react-router-dom'` | Run `npm install react-router-dom` |
| `Property 'id' does not exist on type 'Readonly<Params<string>>'` | Use `useParams<{ id: string }>()` with explicit generic |
| `import.meta.env` not recognized | Ensure `tsconfig.json` targets `ES2020` and lib includes `dom` |
| `Cannot find name 'use'` in TenantDetailPage | Remove `use` from React import and use `useParams` instead |

## Expectation

After all 6 tasks are done:
- `npm run dev` → Vite dev server starts, app loads at `http://localhost:5173`
- `npm run build` → `dist/` folder produced with no TS or Vite errors
- No files in the project reference `next/navigation`, `next/image`, or any other `next/*` module

## Acceptance Criteria

- [ ] `app/` directory deleted
- [ ] `next.config.ts` deleted
- [ ] `next-env.d.ts` deleted
- [ ] `postcss.config.mjs` deleted
- [ ] `npx tsc --noEmit` exits with zero errors
- [ ] No remaining imports from `next/*` anywhere in `components/`, `lib/`, `hooks/`, `pages/`, `src/`
- [ ] `npm run dev` starts Vite successfully

## Dependencies

- Depends on: T001, T002, T003, T004, T005 (all must be complete first)
- Blocks: nothing (final task in M9)
