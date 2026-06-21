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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

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
        const enabled = (Object.entries(activeConfig.claimTypes) as [ClaimType, { enabled: boolean }][])
          .filter(([, v]) => v.enabled)
          .map(([k]) => k)
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
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `${t} tenants`,
        }}
      />
    </Flex>
  )
}
