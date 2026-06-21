# T003: Config Diff Page

**Module:** M7 · admin-ui-tools
**Story:** S3
**Tags:** FE
**Status:** done
**Size:** M

## Description
Implement `app/(admin)/diff/page.tsx` — select two tenants, call the diff API, display a side-by-side table highlighting all differences.

## Detail

### `fe/app/(admin)/diff/page.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, Button, Table, Typography, Flex, Card, Tag, Spin, Empty, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { hasToken } from '@/lib/api/auth'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { diffApi } from '@/lib/api/diff'
import { isSuccess } from '@/lib/api/client'
import type { DiffEntry } from '@/shared/types'

export default function DiffPage() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [tenantA, setTenantA] = useState<string | undefined>()
  const [tenantB, setTenantB] = useState<string | undefined>()
  const [diffs, setDiffs] = useState<DiffEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [compared, setCompared] = useState(false)

  useEffect(() => {
    if (!hasToken()) { router.push('/login'); return }
    tenantsApi.list(1, 100).then((res) => {
      if (isSuccess(res.code) && res.data) setTenants(res.data.data)
    })
  }, [router])

  const handleCompare = async () => {
    if (!tenantA || !tenantB) {
      messageApi.warning('Select both tenants')
      return
    }
    setLoading(true)
    const res = await diffApi.compare(tenantA, tenantB)
    if (isSuccess(res.code) && res.data) {
      setDiffs(res.data.diffs)
      setCompared(true)
    } else {
      messageApi.error(res.message || 'Diff failed')
    }
    setLoading(false)
  }

  const tenantOptions = tenants.map((t) => ({ label: t.name, value: t.id }))

  const nameA = tenants.find((t) => t.id === tenantA)?.name ?? 'Tenant A'
  const nameB = tenants.find((t) => t.id === tenantB)?.name ?? 'Tenant B'

  const columns: ColumnsType<DiffEntry> = [
    {
      title: 'Config Path',
      dataIndex: 'path',
      width: '35%',
      render: (path: string) => <Typography.Text code>{path}</Typography.Text>,
    },
    {
      title: nameA,
      dataIndex: 'valueA',
      width: '32%',
      render: (val) => <DiffValue value={val} highlight="a" />,
    },
    {
      title: nameB,
      dataIndex: 'valueB',
      width: '32%',
      render: (val) => <DiffValue value={val} highlight="b" />,
    },
  ]

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Typography.Title level={4}>Config Diff</Typography.Title>

      <Card>
        <Flex gap={12} align="flex-end" wrap="wrap">
          <Flex vertical gap={4} style={{ minWidth: 200 }}>
            <Typography.Text strong>Tenant A</Typography.Text>
            <Select
              options={tenantOptions}
              value={tenantA}
              onChange={setTenantA}
              placeholder="Select tenant…"
              style={{ width: 220 }}
            />
          </Flex>
          <Flex vertical gap={4} style={{ minWidth: 200 }}>
            <Typography.Text strong>Tenant B</Typography.Text>
            <Select
              options={tenantOptions}
              value={tenantB}
              onChange={setTenantB}
              placeholder="Select tenant…"
              style={{ width: 220 }}
            />
          </Flex>
          <Button
            type="primary"
            onClick={handleCompare}
            loading={loading}
            disabled={!tenantA || !tenantB || tenantA === tenantB}
          >
            Compare
          </Button>
        </Flex>
      </Card>

      {loading && <Flex justify="center" style={{ padding: 48 }}><Spin size="large" /></Flex>}

      {!loading && compared && diffs.length === 0 && (
        <Empty description="No differences found — configs are identical" />
      )}

      {!loading && diffs.length > 0 && (
        <>
          <Flex align="center" gap={8}>
            <Typography.Text type="secondary">{diffs.length} difference{diffs.length !== 1 ? 's' : ''} found</Typography.Text>
          </Flex>
          <Table
            rowKey="path"
            columns={columns}
            dataSource={diffs}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} diffs` }}
            size="small"
          />
        </>
      )}
    </Flex>
  )
}
```

### `DiffValue` helper component (in same file)

```tsx
function DiffValue({ value, highlight }: { value: unknown; highlight: 'a' | 'b' }) {
  if (value === undefined) {
    return <Tag color="default">—</Tag>
  }
  if (typeof value === 'boolean') {
    return <Tag color={value ? 'green' : 'red'}>{String(value)}</Tag>
  }
  if (typeof value === 'number') {
    return (
      <Tag color={highlight === 'a' ? 'blue' : 'purple'}>
        {value.toLocaleString()}
      </Tag>
    )
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return (
      <Typography.Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
        {JSON.stringify(value, null, 0)}
      </Typography.Text>
    )
  }
  return (
    <Tag color={highlight === 'a' ? 'blue' : 'purple'}>
      {String(value)}
    </Tag>
  )
}
```

**Display rules:**
- `undefined` (key missing in that tenant) → gray `—` Tag
- Boolean → green/red Tag
- Number → colored Tag with locale-formatted number
- Array or object (nested diff) → inline JSON `code` block
- String → colored Tag (blue for A, purple for B)

**Same-tenant guard:** Compare button is disabled when `tenantA === tenantB`.

## Expectation
Selecting SafeGuard vs GovHealth and clicking Compare shows a table with ~15+ diff rows. Paths like `branding.companyName`, `approvalRules.autoApprovalThreshold`, `sla.perClaimType` appear with their respective values highlighted. Selecting same tenant twice shows the button disabled.

## Acceptance Criteria
- [ ] Two tenant Selects (populated from `tenantsApi.list`)
- [ ] Compare button disabled when same tenant selected on both sides or either is empty
- [ ] Calls `diffApi.compare` on button click
- [ ] Results table shows path, valueA, valueB with type-appropriate rendering
- [ ] `undefined` values shown as `—`
- [ ] Zero diffs → `Empty` component with friendly message
- [ ] Auth guard: redirect to `/login` if no token
- [ ] No raw HTML for text

## Dependencies
- Depends on: T001 (`diffApi`), M6 T001 (`tenantsApi.list`)
- Blocks: none

## References
- Architecture: Config Diff Response — `{ tenantA, tenantB, diffs: [{path, valueA, valueB}] }`
- Standards: Ant Design Table, Select, Empty, Tag; `Typography.*` for text
