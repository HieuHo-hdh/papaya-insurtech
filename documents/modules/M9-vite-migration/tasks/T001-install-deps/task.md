# T001: Install / Remove Packages

**Module:** M9 · vite-migration
**Story:** S1 (prerequisite)
**Tags:** FE, infra
**Status:** todo
**Size:** S

## Description

Remove all Next.js-specific npm packages and install Vite + React Router + their
dev tooling. No code changes in this task — only `package.json` and `node_modules`.

## Detail

### Remove

```bash
npm uninstall next eslint-config-next @tailwindcss/postcss
```

| Package | Reason removed |
|---------|----------------|
| `next` | Replaced by Vite |
| `eslint-config-next` | Replaced by `typescript-eslint` + react-hooks + react-refresh |
| `@tailwindcss/postcss` | Replaced by `@tailwindcss/vite` plugin |

### Install (runtime)

```bash
npm install react-router-dom
```

### Install (dev)

```bash
npm install --save-dev vite @vitejs/plugin-react @tailwindcss/vite typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### Update `package.json` scripts

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

## Expectation

`npm run dev` resolves to `vite` (not `next dev`).
`package.json` no longer lists `next`, `eslint-config-next`, or `@tailwindcss/postcss`.

## Acceptance Criteria

- [ ] `next`, `eslint-config-next`, `@tailwindcss/postcss` removed from `package.json`
- [ ] `react-router-dom` in `dependencies`
- [ ] `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` in `devDependencies`
- [ ] `scripts.dev` is `"vite"`

## Dependencies

- Depends on: M8 (all FE work complete)
- Blocks: T002, T003, T004, T005, T006
