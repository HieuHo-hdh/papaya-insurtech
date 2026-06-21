# T009: useTenantTheme Hook

**Module:** M6 · admin-ui-tenant
**Story:** S13
**Tags:** FE
**Status:** done
**Size:** S

## Description
Implement `hooks/useTenantTheme.ts` — when editing a specific tenant, update the `AntdProvider` theme to use that tenant's branding colors. Reset to default on unmount.

## Detail

### `fe/hooks/useTenantTheme.ts`

```typescript
'use client'

import { useEffect } from 'react'
import { useTheme } from '@/components/providers/AntdProvider'
import type { TenantConfig } from '@/shared/types'

export function useTenantTheme(config: TenantConfig | null | undefined) {
  const { setPrimaryColor, setSecondaryColor, resetTheme } = useTheme()

  useEffect(() => {
    if (!config) return
    setPrimaryColor(config.branding.primaryColor)
    setSecondaryColor(config.branding.secondaryColor)
    return () => resetTheme()
  }, [config?.branding.primaryColor, config?.branding.secondaryColor])  // eslint-disable-line react-hooks/exhaustive-deps
}
```

### Usage in `app/(admin)/tenants/[id]/page.tsx`

Add the hook call after the tenant is fetched:

```tsx
// In TenantDetailPage, after tenant state is set:
const activeConfig = tenant?.configs[0]?.config
useTenantTheme(activeConfig ?? null)
```

This causes:
- When entering `/tenants/:id` → theme updates to tenant's brand colors
- When navigating away (unmount) → theme resets to default neutral palette

**`useTheme` is already implemented** in `components/providers/AntdProvider.tsx` — it exposes `setPrimaryColor`, `setSecondaryColor`, `resetTheme` via context.

**`buildTheme` is already implemented** in `lib/theme.ts` — maps primary/secondary colors to AntD `token.colorPrimary` etc.

### Where NOT to call this hook
- `TenantsPage` (list) — no single tenant selected, no theme change
- `NewTenantPage` — no existing config yet, skip
- Only call in `TenantDetailPage` (edit view)

## Expectation
When navigating to `/tenants/tenant-safeguard`, the Ant Design UI updates to SafeGuard's primary color (`#1a3c6e`). When navigating back to `/tenants`, the theme resets to the default blue palette.

## Acceptance Criteria
- [ ] `useTenantTheme` hook exists in `fe/hooks/useTenantTheme.ts`
- [ ] Calls `setPrimaryColor` and `setSecondaryColor` from `useTheme()` context
- [ ] Calls `resetTheme` on cleanup (unmount)
- [ ] Used in `TenantDetailPage` — theme visibly updates when editing a tenant
- [ ] No theme change on list page or new tenant page
- [ ] TypeScript: no `any`, uses `TenantConfig` type

## Dependencies
- Depends on: T008 (TenantDetailPage where hook is used)
- Blocks: none

## References
- Architecture: Theme customization (coding-standards.md)
- Standards: `useTheme()` from AntdProvider context; `buildTheme()` from lib/theme.ts
