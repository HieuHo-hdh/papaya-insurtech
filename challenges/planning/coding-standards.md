# Coding Standards

Read this before writing any code. These are non-negotiable.

---

## Backend (Node.js + Express + TypeScript)

### Folder structure

```
be/src/
  config/         env validation, constants
  middleware/     errorHandler, auth, validate
  modules/
    auth/
      auth.routes.ts
      auth.controller.ts
      auth.service.ts
    tenants/
      tenants.routes.ts
      tenants.controller.ts
      tenants.service.ts
    versions/
      versions.routes.ts
      versions.controller.ts
      versions.service.ts
    claims/
      claims.routes.ts
      claims.controller.ts
      claims.service.ts
    diff/
      diff.routes.ts
      diff.controller.ts
      diff.service.ts
  engine/         processClaim pure functions (no DB access)
    resolveDocuments.ts
    resolveApprovalTiers.ts
    resolveNotifications.ts
    calculateSlaDeadline.ts
    resolveCustomFields.ts
    validateCustomFieldValues.ts
    processClaim.ts
  shared/         types.ts + schemas.ts (copied from challenges/shared/)
  utils/          response helpers
  app.ts
  index.ts
```

### Patterns

**Controller — thin only. No business logic.**
```typescript
// tenants.controller.ts
export const listTenants = async (req: Request, res: Response) => {
  const result = await tenantService.list({ page: req.query.page, pageSize: req.query.pageSize })
  res.json(success(result))
}
```

**Service — all business logic + DB access.**
```typescript
// tenants.service.ts
export const list = async ({ page = 1, pageSize = 20 }) => {
  // prisma queries, domain logic here
}
```

**Engine — pure functions, zero DB access, fully testable in isolation.**
```typescript
// engine/resolveApprovalTiers.ts
export const resolveApprovalTiers = (rules: ApprovalRules, amount: number): { tier: string }[] => { }
```

**Error handling — throw AppError, errorHandler middleware catches it.**
```typescript
// utils/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message)
  }
}

// usage in service
throw new AppError(404, 'Tenant not found')
throw new AppError(400, 'Validation failed', { amount: ['must be ≥ 0'] })
```

**Response helpers — always use these, never write raw res.json.**
```typescript
// utils/response.ts
export const success = <T>(data: T, message = 'OK'): ApiResponse<T> =>
  ({ code: 200, message, data })

export const paginated = <T>(data: T[], total: number, page: number, pageSize: number) =>
  success({ data, total, page, pageSize })
```

**Validation middleware — Zod, applied at route level.**
```typescript
// middleware/validate.ts
export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body)
  if (!result.success) throw new AppError(400, 'Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
  req.body = result.data
  next()
}
```

**Auth middleware — protect all routes except /api/auth/login.**
```typescript
// middleware/auth.ts — verify JWT, attach req.user
```

**dayjs — import once, extend once at app entry.**
```typescript
// config/dayjs.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
export default dayjs
```
Always import dayjs from `@/config/dayjs`, never directly from `dayjs`.

---

## Frontend (Next.js 16 + TypeScript + Ant Design 6 + Tailwind v4)

### Folder structure

```
fe/
  app/
    (auth)/
      login/page.tsx
    (admin)/
      layout.tsx          admin shell (sidebar + header)
      tenants/
        page.tsx          tenant list
        [id]/page.tsx     tenant detail / edit
        new/page.tsx      create tenant
      diff/page.tsx
    layout.tsx            root layout with providers
    globals.css
  components/
    providers/
      AntdProvider.tsx    ConfigProvider + theme context
    layout/
      AdminShell.tsx      sidebar + header shell
    tenants/              tenant-specific components
    claims/               claim form + result display
    diff/                 diff viewer
    ui/                   generic reusable components
  lib/
    api/
      client.ts           fetch wrapper with isSuccess util
      tenants.ts
      auth.ts
      claims.ts
      diff.ts
    theme.ts              token builder from TenantConfig branding
    utils.ts
  hooks/
    useTenantTheme.ts     reads active tenant branding, updates theme
```

### Component rules

**1. Use Ant Design components for ALL UI. Never use raw HTML for text or layout.**

| Instead of | Use |
|-----------|-----|
| `<div>` for text | `<Typography.Text>`, `<Typography.Paragraph>` |
| `<h1>`–`<h6>` | `<Typography.Title level={1–5}>` |
| `<span>` for inline text | `<Typography.Text>` |
| `<button>` | `<Button>` |
| `<input>` | `<Input>` or `<Form.Item><Input /></Form.Item>` |
| `<select>` | `<Select>` |
| `<ul>/<li>` | `<List>` |
| `<table>` | `<Table>` |
| horizontal stack | `<Space>` or `<Flex>` |
| vertical stack | `<Space direction="vertical">` or `<Flex vertical>` |
| card container | `<Card>` |
| page section | `<section>` is ok for semantic HTML landmarks only |

**2. Use Tailwind for spacing/sizing/positioning that Ant Design doesn't cover.**
```tsx
// OK — Tailwind for layout
<Flex className="gap-4 p-6 min-h-screen">

// NOT OK — raw HTML for text
<div className="text-lg font-bold">Title</div>

// CORRECT
<Typography.Title level={4}>Title</Typography.Title>
```

**3. All forms use Ant Design Form + Zod validation together.**
```tsx
const schema = TenantConfigSchema
const form = Form.useForm()

// validate on submit via zod, show errors via form.setFields
```

**4. All API calls go through `lib/api/client.ts`, never fetch directly.**

**5. Loading/error states — always use Ant Design Spin, Result, Alert, message.**

---

## Theme customization

Ant Design 6 uses `ConfigProvider` with `theme.token`. Primary and secondary colors from tenant branding are mapped to design tokens.

The app has two modes:
- **Global theme** (default): neutral admin palette
- **Tenant preview theme**: when viewing/editing a tenant, ConfigProvider updates to that tenant's `branding.primaryColor` + `branding.secondaryColor`

See `fe/lib/theme.ts` and `fe/components/providers/AntdProvider.tsx`.

---

## Naming conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `tenant-list.tsx` |
| Components | PascalCase | `TenantList` |
| Hooks | camelCase + use prefix | `useTenantTheme` |
| BE services/utils | camelCase | `tenantService` |
| Constants | UPPER_SNAKE | `DEFAULT_PAGE_SIZE` |
| Types/interfaces | PascalCase | `TenantConfig` |
| Zod schemas | PascalCase + Schema suffix | `TenantConfigSchema` |

---

## General rules

- No `any` — use `unknown` and narrow, or define the type
- No inline styles — Tailwind classes or Ant Design props only
- No `console.log` in committed code — use structured logging on BE
- All async functions `try/catch` or let errorHandler middleware catch thrown errors
- All environment variables accessed via `process.env` only inside `config/env.ts` on BE; `NEXT_PUBLIC_*` via `lib/config.ts` on FE
