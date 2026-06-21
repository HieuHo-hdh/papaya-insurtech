# M6 · admin-ui-tenant — Status

**Status:** done
**Completed:** 2026-06-21

## Summary

All 9 tasks implemented. `next build` passes with zero errors, all 8 routes present.

- **T001** `lib/api/auth.ts` + `lib/api/tenants.ts` — typed API clients with `authApi`, `tenantsApi`, token helpers
- **T002** `components/layout/AdminShell.tsx` + `(admin)/layout.tsx` — sidebar (Tenants, Config Diff nav), header with Logout
- **T003** `(auth)/login/page.tsx` — centered login form, Zod validation, `saveToken` + redirect
- **T004** `(admin)/tenants/page.tsx` — Table with colored claim type Tags, Edit/Delete + Popconfirm, server-side pagination
- **T005–T007** `components/tenants/TenantForm.tsx` — single shared form component with all 6 config sections (Branding, Claim Types, Approval Rules, Notifications, SLA, Custom Fields) as Ant Design Cards with Form.List dynamic rows
- **T008** `(admin)/tenants/new/page.tsx` + `[id]/page.tsx` — TenantConfigSchema Zod validation on submit; edit page pre-populates form via `setFieldsValue`, uses `use(params)` for Next.js 16
- **T009** `hooks/useTenantTheme.ts` — sets AntdProvider theme to tenant branding on mount, resets on unmount

## Key implementation notes

- `ColorPicker` stores hex via `onChange` (avoids Color object in form state)
- Notifications use flat form keys `notif_{event}` then reassemble in `assembleConfig()`
- `select` custom field options stored as comma-separated string, split on save
- `root /` redirects to `/tenants`

## Build

```
✓ Compiled successfully
Routes: / (redirect), /login, /tenants, /tenants/new, /tenants/[id], /diff
```
