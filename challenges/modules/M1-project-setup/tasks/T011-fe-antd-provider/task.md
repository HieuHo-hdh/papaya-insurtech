# T011: FE AntdProvider + Theme Context

**Module:** M1 · project-setup
**Story:** S11
**Tags:** FE
**Status:** pending
**Size:** M

## Description
Implement `components/providers/AntdProvider.tsx` with Ant Design 6 `ConfigProvider` and a theme context that supports switching between the global admin palette and a tenant-specific branding palette.

## Detail
Create `challenges/fe/lib/theme.ts` — maps `TenantConfig.branding` to Ant Design 6 theme tokens:
```typescript
import type { ThemeConfig } from 'antd'
import type { BrandingConfig } from '@/shared/types'

export const buildTheme = (branding?: BrandingConfig): ThemeConfig => ({
  token: {
    colorPrimary: branding?.primaryColor ?? '#1677ff',
    colorBgBase: '#ffffff',
    // add secondary color mapping as needed
  },
})
```

Create `challenges/fe/components/providers/AntdProvider.tsx`:
```tsx
'use client'
import { ConfigProvider } from 'antd'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { buildTheme } from '@/lib/theme'
import type { BrandingConfig } from '@/shared/types'

type ThemeContextValue = {
  setTenantBranding: (branding: BrandingConfig | null) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  setTenantBranding: () => {},
})

export function AntdProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  return (
    <ThemeContext.Provider value={{ setTenantBranding: setBranding }}>
      <ConfigProvider theme={buildTheme(branding ?? undefined)}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

Add `AntdProvider` to `challenges/fe/app/layout.tsx`:
```tsx
import { AntdProvider } from '@/components/providers/AntdProvider'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  )
}
```

`AntdProvider` must be a Client Component (`'use client'`) because it uses `useState`. The root layout itself can remain a Server Component.

## Expectation
`npm run dev` renders without "window is not defined" SSR errors. Calling `setTenantBranding({ primaryColor: '#ff0000', ... })` updates the Ant Design primary color globally.

## Acceptance Criteria
- [ ] `fe/components/providers/AntdProvider.tsx` exists with `ConfigProvider` + theme context
- [ ] `fe/lib/theme.ts` exports `buildTheme(branding?)` returning `ThemeConfig`
- [ ] `fe/app/layout.tsx` wraps children in `AntdProvider`
- [ ] No SSR "window is not defined" errors (`next build` and `next dev` both clean)
- [ ] `useTheme()` hook is exported and returns `setTenantBranding`
- [ ] Default theme uses Ant Design 6 default blue (`#1677ff`)

## Dependencies
- Depends on: T001, T013
- Blocks: none (M7 useTenantTheme hook will call setTenantBranding)

## References
- Architecture: Tech Stack (Ant Design 5 — note modules.md uses Ant Design 6; follow modules.md)
- Standards: Theme customization, Component rules (no raw HTML for text/layout)
