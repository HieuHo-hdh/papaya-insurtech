import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setTenants, removeTenant } from '@/store/slices/tenantsSlice'
import {
  Table,
  Button,
  Popconfirm,
  Tag,
  Space,
  Typography,
  Flex,
  message,
  Input,
  Row,
  Col,
  Statistic,
  Avatar,
  Skeleton,
} from 'antd'
import {
  PlusOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { hasToken } from '@/lib/api/auth'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import type { ClaimType } from '@/shared/types'
import dayjs from 'dayjs'

const CLAIM_TYPE_COLORS: Record<ClaimType, string> = {
  OUTPATIENT: 'blue',
  INPATIENT: 'cyan',
  DENTAL: 'green',
  MATERNITY: 'pink',
  OPTICAL: 'orange',
}

export default function TenantsPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const tenants = useAppSelector((s) => s.tenants.list)
  const total = useAppSelector((s) => s.tenants.total)
  const [messageApi, contextHolder] = message.useMessage()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadTenants = async (p: number) => {
    setLoading(true)
    const res = await tenantsApi.list(p, 20)
    if (isSuccess(res.code) && res.data) {
      dispatch(setTenants({ data: res.data.data, total: res.data.total }))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!hasToken()) {
      navigate('/login')
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTenants(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleDelete = async (id: string) => {
    const res = await tenantsApi.remove(id)
    if (isSuccess(res.code)) {
      dispatch(removeTenant(id))
      messageApi.success('Tenant deleted')
    } else {
      messageApi.error(res.message || 'Delete failed')
    }
  }

  const filtered = tenants.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))

  const columns: ColumnsType<TenantRow> = [
    {
      title: 'Tenant',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <Avatar style={{ background: '#0D9488', flexShrink: 0 }}>
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <Flex vertical gap={2}>
            <Typography.Text strong style={{ lineHeight: 1.3 }}>
              {record.name}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.id}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Claim Types',
      render: (_, record) => {
        const cfg = record.configs[0]?.config
        if (!cfg) return <Typography.Text type="secondary">—</Typography.Text>
        const enabled = (Object.entries(cfg.claimTypes) as [ClaimType, { enabled: boolean }][])
          .filter(([, v]) => v.enabled)
          .map(([k]) => k)
        return (
          <Flex wrap="wrap" gap={4}>
            {enabled.map((t) => (
              <Tag key={t} color={CLAIM_TYPE_COLORS[t]} style={{ margin: 0 }}>
                {t}
              </Tag>
            ))}
          </Flex>
        )
      },
    },
    {
      title: 'Status',
      width: 110,
      render: (_, record) =>
        record.configs[0] ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="default">No config</Tag>
        ),
    },
    {
      title: 'Last Updated',
      width: 160,
      render: (_, record) => {
        const ts = record.configs[0]?.createdAt
        return ts ? (
          <Typography.Text type="secondary">
            {dayjs(ts).format('MMM D, YYYY HH:mm')}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        )
      },
    },
    {
      title: 'Actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/tenants/${record.id}`)
            }}
          />
          <Popconfirm
            title="Delete this tenant?"
            description="This action cannot be undone."
            onConfirm={(e) => {
              e?.stopPropagation()
              handleDelete(record.id)
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Flex vertical gap={20}>
      {contextHolder}

      {/* Stats row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '16px 20px',
              border: '1px solid #E5E7EB',
            }}
          >
            <Statistic
              title={<Typography.Text type="secondary">Total Tenants</Typography.Text>}
              value={total}
              prefix={<TeamOutlined style={{ color: '#0D9488' }} />}
              styles={{ content: { color: '#111827', fontWeight: 600 } }}
              loading={loading}
            />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '16px 20px',
              border: '1px solid #E5E7EB',
            }}
          >
            <Statistic
              title={<Typography.Text type="secondary">Active Configs</Typography.Text>}
              value={tenants.filter((t) => t.configs.length > 0).length + (total - tenants.length)}
              styles={{ content: { color: '#16A34A', fontWeight: 600 } }}
              loading={loading}
              suffix={
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  / {total}
                </Typography.Text>
              }
            />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '16px 20px',
              border: '1px solid #E5E7EB',
            }}
          >
            <Statistic
              title={<Typography.Text type="secondary">Claim Types Available</Typography.Text>}
              value={5}
              suffix={
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  types
                </Typography.Text>
              }
              styles={{ content: { color: '#D97706', fontWeight: 600 } }}
            />
          </div>
        </Col>
      </Row>

      {/* Toolbar */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Input
          placeholder="Search tenants…"
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          allowClear
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadTenants(page)} loading={loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tenants/new')}>
            New Tenant
          </Button>
        </Space>
      </Flex>

      {/* Table */}
      {loading ? (
        <div
          style={{ background: '#fff', borderRadius: 8, padding: 24, border: '1px solid #E5E7EB' }}
        >
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : (
        <Table
          loading={loading}
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          // loading={false}
          scroll={{ x: 600 }}
          onRow={(record) => ({
            onClick: () => navigate(`/tenants/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `${t} tenants`,
            showSizeChanger: false,
          }}
          style={{ borderRadius: 8 }}
        />
      )}
    </Flex>
  )
}
