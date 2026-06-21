# T002: Admin Shell Layout

**Module:** M6 · admin-ui-tenant
**Story:** S1
**Tags:** FE
**Status:** done
**Size:** M

## Description
Implement the admin shell: sidebar navigation + header using Ant Design Layout, Sider, and Menu. Wraps all `/admin/*` pages via `app/(admin)/layout.tsx`.

## Detail

### `fe/app/(admin)/layout.tsx`

```tsx
import AdminShell from '@/components/layout/AdminShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
```

---

### `fe/components/layout/AdminShell.tsx`

```tsx
'use client'

import { Layout, Menu, Typography, Flex } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { clearToken } from '@/lib/api/auth'

const { Sider, Header, Content } = Layout

const NAV_ITEMS = [
  { key: '/tenants', label: 'Tenants' },
  { key: '/diff',    label: 'Config Diff' },
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    clearToken()
    router.push('/login')
  }

  const selectedKey = NAV_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? ''

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <Flex className="p-4 border-b border-gray-100">
          <Typography.Title level={5} style={{ margin: 0 }}>Papaya Admin</Typography.Title>
        </Flex>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Flex justify="flex-end" align="center" style={{ height: '100%' }}>
            <Typography.Link onClick={handleLogout}>Logout</Typography.Link>
          </Flex>
        </Header>
        <Content style={{ padding: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
```

**Rules:**
- All text must use `Typography.*` — never raw `<div>` or `<span>` for text
- Nav items: **Tenants** → `/tenants`, **Config Diff** → `/diff`
- Active route highlighted via `selectedKeys` matching current pathname prefix
- Logout calls `clearToken()` then redirects to `/login`
- No auth guard in layout itself — redirect is handled by individual pages that check `hasToken()`

**Auth redirect pattern** (use in every protected page, NOT in the layout):
```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasToken } from '@/lib/api/auth'

// At top of each protected page component:
const router = useRouter()
useEffect(() => {
  if (!hasToken()) router.push('/login')
}, [router])
```

## Expectation
`/tenants` renders with a white sidebar showing "Tenants" and "Config Diff" nav items, a header with "Logout" link, and content area displaying the page content.

## Acceptance Criteria
- [ ] Sidebar has "Papaya Admin" branding and 2 nav items
- [ ] Active nav item is highlighted based on current route
- [ ] Logout clears token and redirects to `/login`
- [ ] Header shows Logout link
- [ ] No raw HTML for text — all via `Typography.*`
- [ ] Layout wraps all `(admin)` routes via `app/(admin)/layout.tsx`

## Dependencies
- Depends on: T001 (for `clearToken`)
- Blocks: T003, T004, T005

## References
- Architecture: (no specific section)
- Standards: Ant Design Layout, Sider, Menu; `Typography.*` for all text; no raw HTML
