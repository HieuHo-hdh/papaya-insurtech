import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Select,
  Button,
  Table,
  Typography,
  Flex,
  Card,
  Tag,
  Spin,
  Empty,
  message,
  Steps,
  Row,
  Col,
} from 'antd'
import { SwapOutlined } from '@ant-design/icons'
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
    return (
      <div
        style={{
          borderLeft: `3px solid ${highlight === 'a' ? '#3B82F6' : '#14B8A6'}`,
          paddingLeft: 8,
        }}
      >
        <Tag color={highlight === 'a' ? 'blue' : 'cyan'}>{value.toLocaleString()}</Tag>
      </div>
    )
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return (
      <div
        style={{
          borderLeft: `3px solid ${highlight === 'a' ? '#3B82F6' : '#14B8A6'}`,
          paddingLeft: 8,
        }}
      >
        <Typography.Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
          {JSON.stringify(value)}
        </Typography.Text>
      </div>
    )
  }
  return (
    <div
      style={{
        borderLeft: `3px solid ${highlight === 'a' ? '#3B82F6' : '#14B8A6'}`,
        paddingLeft: 8,
      }}
    >
      <Tag color={highlight === 'a' ? 'blue' : 'cyan'}>{String(value)}</Tag>
    </div>
  )
}

export default function DiffPage() {
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [tenantA, setTenantA] = useState<string | undefined>()
  const [tenantB, setTenantB] = useState<string | undefined>()
  const [diffs, setDiffs] = useState<DiffEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [compared, setCompared] = useState(false)
  const [filter, setFilter] = useState<string[]>([])

  useEffect(() => {
    if (!hasToken()) {
      navigate('/login')
      return
    }
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
    setFilter([])
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

  const categories = [...new Set(diffs.map((d) => d.path.split('.')[0]))]
  const filtered =
    filter.length > 0 ? diffs.filter((d) => filter.includes(d.path.split('.')[0])) : diffs

  const stepsCurrentStep = tenantA && tenantB && compared ? 2 : tenantA || tenantB ? 1 : 0

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
    <Flex vertical gap={20}>
      {contextHolder}

      <Flex align="center" justify="space-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Config Diff
        </Typography.Title>
      </Flex>

      <Steps
        current={stepsCurrentStep}
        items={[
          { title: 'Select Tenant A', content: tenantA ? nameA : 'Not selected' },
          { title: 'Select Tenant B', content: tenantB ? nameB : 'Not selected' },
          { title: 'Result', content: compared ? `${diffs.length} differences` : 'Pending' },
        ]}
      />

      <Card>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={9}>
            <Flex vertical gap={4}>
              <Typography.Text strong>Tenant A</Typography.Text>
              <Select
                options={tenantOptions}
                value={tenantA}
                onChange={setTenantA}
                placeholder="Select tenant…"
                style={{ width: '100%' }}
              />
            </Flex>
          </Col>
          <Col xs={24} sm={2} style={{ textAlign: 'center' }}>
            <SwapOutlined style={{ fontSize: 20, color: '#9CA3AF', marginBottom: 4 }} />
          </Col>
          <Col xs={24} sm={9}>
            <Flex vertical gap={4}>
              <Typography.Text strong>Tenant B</Typography.Text>
              <Select
                options={tenantOptions}
                value={tenantB}
                onChange={setTenantB}
                placeholder="Select tenant…"
                style={{ width: '100%' }}
              />
            </Flex>
          </Col>
          <Col xs={24} sm={4}>
            <Button
              type="primary"
              onClick={handleCompare}
              loading={loading}
              disabled={!tenantA || !tenantB || tenantA === tenantB}
              style={{ width: '100%' }}
            >
              Compare
            </Button>
          </Col>
        </Row>
      </Card>

      {loading && (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      )}

      {!loading && compared && diffs.length === 0 && (
        <Empty
          description="No differences found — configs are identical"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {!loading && diffs.length > 0 && (
        <Flex vertical gap={12}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
            <Flex align="center" gap={8}>
              <Tag color="orange">{filtered.length}</Tag>
              <Typography.Text type="secondary">
                difference{filtered.length !== 1 ? 's' : ''}
                {filter.length > 0 ? ` (filtered from ${diffs.length})` : ' found'}
              </Typography.Text>
            </Flex>
            {categories.length > 1 && (
              <Select
                mode="multiple"
                placeholder="Filter by section…"
                options={categories.map((c) => ({ label: c, value: c }))}
                value={filter}
                onChange={setFilter}
                allowClear
                style={{ minWidth: 240 }}
              />
            )}
          </Flex>
          <Table
            rowKey="path"
            columns={columns}
            dataSource={filtered}
            rowClassName={() => 'diff-row'}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} diffs` }}
            scroll={{ x: 600 }}
            style={{ background: '#fff', borderRadius: 8 }}
          />
        </Flex>
      )}

      <style>{`
        .diff-row { background: #FFFBEB !important; }
        .diff-row:hover > td { background: #FEF3C7 !important; }
      `}</style>
    </Flex>
  )
}
