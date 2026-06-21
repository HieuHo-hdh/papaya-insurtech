# T002: Config History + Rollback Panel

**Module:** M7 · admin-ui-tools
**Story:** S1, S2
**Tags:** FE
**Status:** done
**Size:** M

## Description
Add a version history Table with a "current" Badge and rollback Popconfirm to the tenant detail page (`/tenants/[id]`).

## Detail

### Placement

Add a `VersionHistory` component below the `TenantForm` in `app/(admin)/tenants/[id]/page.tsx`:

```tsx
// In TenantDetailPage, below the TenantForm:
<VersionHistory tenantId={id} onRollback={() => { /* reload tenant */ window.location.reload() }} />
```

---

### `fe/components/tenants/VersionHistory.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Popconfirm, Badge, Typography, Flex, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { tenantsApi, type VersionRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import dayjs from 'dayjs'

interface VersionHistoryProps {
  tenantId: string
  onRollback: () => void
}

export function VersionHistory({ tenantId, onRollback }: VersionHistoryProps) {
  const [messageApi, contextHolder] = message.useMessage()
  const [versions, setVersions] = useState<VersionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [rollingBack, setRollingBack] = useState<string | null>(null)

  useEffect(() => {
    loadVersions(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const loadVersions = async (p: number) => {
    setLoading(true)
    const res = await tenantsApi.listVersions(tenantId, p, 10)
    if (isSuccess(res.code) && res.data) {
      setVersions(res.data.data)
      setTotal(res.data.total)
    }
    setLoading(false)
  }

  const handleRollback = async (versionId: string) => {
    setRollingBack(versionId)
    const res = await tenantsApi.rollback(tenantId, versionId)
    if (isSuccess(res.code)) {
      messageApi.success('Rolled back successfully — new version created')
      onRollback()
    } else {
      messageApi.error(res.message || 'Rollback failed')
      setRollingBack(null)
    }
  }

  const columns: ColumnsType<VersionRow> = [
    {
      title: 'Version',
      dataIndex: 'version',
      render: (v: number, record) => (
        <Flex align="center" gap={8}>
          <Typography.Text>v{v}</Typography.Text>
          {record.isActive && <Badge status="success" text="current" />}
        </Flex>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (ts: string) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Action',
      width: 120,
      render: (_, record) =>
        record.isActive ? null : (
          <Popconfirm
            title={`Roll back to v${record.version}?`}
            description="A new version will be created as a copy of this one."
            onConfirm={() => handleRollback(record.id)}
            okText="Rollback"
          >
            <Button
              size="small"
              loading={rollingBack === record.id}
              disabled={!!rollingBack}
            >
              Rollback
            </Button>
          </Popconfirm>
        ),
    },
  ]

  return (
    <Flex vertical gap={8}>
      {contextHolder}
      <Typography.Title level={5} style={{ margin: 0 }}>Version History</Typography.Title>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={versions}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `${t} versions`,
        }}
      />
    </Flex>
  )
}
```

**Rules:**
- Active version shows `Badge status="success" text="current"` — no Rollback button
- Rollback creates a new version server-side (copy of target). After success, call `onRollback()` which reloads the page to show the new active version
- Only one rollback in flight at a time (`rollingBack` state disables all rollback buttons)
- Version list is paginated (10 per page) — newest versions first (BE returns by `createdAt DESC`)

**Integration in `tenants/[id]/page.tsx`:**

```tsx
// Add below the TenantForm closing tag:
{!fetching && (
  <VersionHistory
    tenantId={id}
    onRollback={() => window.location.reload()}
  />
)}
```

## Expectation
`/tenants/tenant-safeguard` shows a "Version History" table below the form with v1 marked "current". After updating the config (creating v2), the table shows v2 as "current" and v1 with a Rollback button. Clicking Rollback → Popconfirm → creates v3 (copy of v1) and reloads page.

## Acceptance Criteria
- [ ] `VersionHistory` component renders a Table with version number, created timestamp, and "current" Badge on active version
- [ ] Non-active versions have a Rollback button
- [ ] Rollback shows Popconfirm before calling `tenantsApi.rollback()`
- [ ] On rollback success, page reloads (new active version shown)
- [ ] Active version has no Rollback button
- [ ] Pagination works (10 per page)
- [ ] Component added to `tenants/[id]/page.tsx`

## Dependencies
- Depends on: M6 T001 (`tenantsApi.listVersions`, `tenantsApi.rollback`)
- Blocks: none

## References
- Architecture: Rollback Behavior — creates v(M+1) as copy of vN, linear history preserved
- Standards: Ant Design Badge, Popconfirm, Table; `Typography.*` for all text
