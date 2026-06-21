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
