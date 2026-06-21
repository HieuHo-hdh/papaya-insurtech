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

function DiffValue({ value, highlight }: { value: unknown; highlight: 'a' | 'b' }) {
  if (value === undefined || value === null) {
    return <Tag color="default">—</Tag>
  }
  if (typeof value === 'boolean') {
    return <Tag color={value ? 'green' : 'red'}>{String(value)}</Tag>
  }
  if (typeof value === 'number') {
    return <Tag color={highlight === 'a' ? 'blue' : 'purple'}>{value.toLocaleString()}</Tag>
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return (
      <Typography.Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
        {JSON.stringify(value)}
      </Typography.Text>
    )
  }
  return <Tag color={highlight === 'a' ? 'blue' : 'purple'}>{String(value)}</Tag>
}

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          <Flex vertical gap={4}>
            <Typography.Text strong>Tenant A</Typography.Text>
            <Select
              options={tenantOptions}
              value={tenantA}
              onChange={setTenantA}
              placeholder="Select tenant…"
              style={{ width: 220 }}
            />
          </Flex>
          <Flex vertical gap={4}>
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

      {loading && (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      )}

      {!loading && compared && diffs.length === 0 && (
        <Empty description="No differences found — configs are identical" />
      )}

      {!loading && diffs.length > 0 && (
        <Flex vertical gap={8}>
          <Typography.Text type="secondary">
            {diffs.length} difference{diffs.length !== 1 ? 's' : ''} found
          </Typography.Text>
          <Table
            rowKey="path"
            columns={columns}
            dataSource={diffs}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} diffs` }}
            size="small"
          />
        </Flex>
      )}
    </Flex>
  )
}
