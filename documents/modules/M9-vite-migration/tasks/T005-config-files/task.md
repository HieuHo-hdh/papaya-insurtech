# T005: Config Files

**Module:** M9 · vite-migration
**Story:** S5
**Tags:** FE, infra
**Status:** todo
**Size:** S

## Description

Update all tooling config files to remove Next.js references and target the
Vite + React Router setup.

## Detail

### `tsconfig.json` — replace entire file

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.mts"],
  "exclude": ["node_modules", "dist"]
}
```

Key differences from the Next.js version:
- Removes `"incremental": true` and `"plugins": [{ "name": "next" }]`
- Removes `.next/` paths from `include`
- Adds `"dist"` to `exclude`
- Changes `target` from `ES2017` → `ES2020`

---

### `eslint.config.mjs` — replace entire file

```mjs
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import { globalIgnores } from 'eslint/config'

export default tseslint.config(
  globalIgnores(['dist/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
)
```

---

### `.env` — update variable name

```
# Before
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# After
VITE_API_URL=http://localhost:3001/api
```

---

### `.env.local.example` — same rename

```
VITE_API_URL=http://localhost:3001/api
```

---

### `.gitignore` — swap Next.js entries for Vite

Remove:
```
/.next/
/out/
next-env.d.ts
```

Add:
```
# Vite
/dist/
```

---

### `.prettierignore` — swap entry

```
# Before
.next/

# After
dist/
```

---

### `vercel.json` — create new file (at `source/fe/`)

Required for SPA client-side routing on Vercel (all paths serve `index.html`):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Expectation

`npm run build` (`tsc -b && vite build`) produces output in `dist/`. ESLint runs
without Next.js plugin errors. Vercel deployment serves the SPA correctly for
deep links (e.g. `/tenants/some-id`).

## Acceptance Criteria

- [ ] `tsconfig.json` has no `next` plugin, no `.next/` paths, `exclude` includes `dist`
- [ ] `eslint.config.mjs` uses `typescript-eslint` + react-hooks + react-refresh plugins
- [ ] `.env` uses `VITE_API_URL`
- [ ] `.env.local.example` uses `VITE_API_URL`
- [ ] `.gitignore` contains `dist/`, does not contain `.next/`
- [ ] `.prettierignore` contains `dist/`, does not contain `.next/`
- [ ] `vercel.json` created with SPA rewrite rule

## Dependencies

- Depends on: T001 (packages installed)
- Blocks: T006 (verify build)
