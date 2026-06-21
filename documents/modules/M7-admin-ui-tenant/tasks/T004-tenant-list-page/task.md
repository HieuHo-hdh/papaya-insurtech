# T004: Tenant List Page + Delete

**Module:** M6 · admin-ui-tenant
**Story:** S3, S12
**Tags:** FE
**Status:** done
**Size:** M

## Description
Implement `app/(admin)/tenants/page.tsx` — a Table listing all tenants with enabled claim types, last updated timestamp, and Edit/Delete actions. Delete uses a Popconfirm before calling the API.

## Detail

### `fe/app/(admin)/tenants/page.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Button, Popconfirm, Tag, Space, Typography, Flex, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { hasToken } from '@/lib/api/auth'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import type { ClaimType } from '@/shared/types'
import dayjs from 'dayjs'

const CLAIM_TYPE_COLORS: Record<ClaimType, string> = {
  OUTPATIENT: 'blue',
  INPATIENT:  'purple',
  DENTAL:     'green',
  MATERNITY:  'pink',
  OPTICAL:    'orange',
}

export default function TenantsPage() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hasToken()) { router.push('/login'); return }
    loadTenants(page)
  }, [page])  // eslint-disable-line react-hooks/exhaustive-deps

  const loadTenants = async (p: number) => {
    setLoading(true)
    const res = await tenantsApi.list(p, 20)
    if (isSuccess(res.code) && res.data) {
      setTenants(res.data.data)
      setTotal(res.data.total)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const res = await tenantsApi.remove(id)
    if (isSuccess(res.code)) {
      messageApi.success('Tenant deleted')
      loadTenants(page)
    } else {
      messageApi.error(res.message || 'Delete failed')
    }
  }

  const columns: ColumnsType<TenantRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, record) => (
        <Typography.Link onClick={() => router.push(`/tenants/${record.id}`)}>
          {name}
        </Typography.Link>
      ),
    },
    {
      title: 'Enabled Types',
      render: (_, record) => {
        const activeConfig = record.configs[0]?.config
        if (!activeConfig) return null
        const enabled = Object.entries(activeConfig.claimTypes)
          .filter(([, v]) => v.enabled)
          .map(([k]) => k as ClaimType)
        return (
          <Space wrap>
            {enabled.map((t) => <Tag key={t} color={CLAIM_TYPE_COLORS[t]}>{t}</Tag>)}
          </Space>
        )
      },
    },
    {
      title: 'Last Updated',
      render: (_, record) => {
        const ts = record.configs[0]?.createdAt
        return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '—'
      },
    },
    {
      title: 'Actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => router.push(`/tenants/${record.id}`)}>Edit</Button>
          <Popconfirm
            title="Delete tenant?"
            description="This cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Flex justify="space-between" align="center">
        <Typography.Title level={4} style={{ margin: 0 }}>Tenants</Typography.Title>
        <Button type="primary" onClick={() => router.push('/tenants/new')}>New Tenant</Button>
      </Flex>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={tenants}
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `${t} tenants` }}
      />
    </Flex>
  )
}
```

**Notes:**
- `record.configs[0]` is the active config (BE always returns exactly 1 entry via `ACTIVE_CONFIG` include)
- Delete is soft-delete on BE — tenant disappears from list on next load
- `dayjs` is already installed and used without timezone here (display only)
- Auth guard: `useEffect` redirects to `/login` if no token

## Expectation
`/tenants` shows a table with 3 seed tenants. Each row shows name (linked to edit page), enabled claim type tags (color-coded), last updated date, Edit and Delete buttons. Delete shows a Popconfirm before proceeding.

## Acceptance Criteria
- [ ] Table displays `name`, enabled claim types as colored Tags, last updated timestamp
- [ ] Name cell is a link → `/tenants/:id`
- [ ] Edit button → `/tenants/:id`
- [ ] Delete shows Popconfirm, on confirm calls `tenantsApi.remove()` and refreshes
- [ ] "New Tenant" button → `/tenants/new`
- [ ] Pagination works (server-side)
- [ ] Loading state shown during fetch
- [ ] Auth guard: redirects to `/login` if no token
- [ ] No raw HTML for text

## Dependencies
- Depends on: T001 (tenantsApi), T002 (AdminShell layout)
- Blocks: T005, T006, T007, T008

## References
- Architecture: `GET /api/tenants` (paginated); `DELETE /api/tenants/:id` (soft-delete)
- Standards: Ant Design Table, Tag, Popconfirm, Button; `Typography.*` for text
