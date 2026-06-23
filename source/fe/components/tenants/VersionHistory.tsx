import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Popconfirm,
  Badge,
  Typography,
  Flex,
  message,
  Tooltip,
  Drawer,
  Descriptions,
  Tag,
  Divider,
  Space,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { tenantsApi, type VersionRow } from '@/lib/api/tenants'
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

interface VersionHistoryProps {
  tenantId: string
  onRollback: () => void
}

function ColorSwatch({ hex }: { hex?: string }) {
  if (!hex) return <Typography.Text type="secondary">—</Typography.Text>
  return (
    <Space size={6}>
      <div style={{ width: 16, height: 16, borderRadius: 3, background: hex, border: '1px solid #d9d9d9', display: 'inline-block' }} />
      <Typography.Text code style={{ fontSize: 12 }}>{hex}</Typography.Text>
    </Space>
  )
}

function ConfigPreview({ version }: { version: VersionRow }) {
  const { config } = version
  const enabledClaimTypes = Object.entries(config.claimTypes ?? {}).filter(([, v]) => v?.enabled)

  const tierColumns: ColumnsType<(typeof config.approvalRules.approvalTiers)[0]> = [
    { title: 'Tier Name', dataIndex: 'tier', key: 'tier' },
    { title: 'Greater Than', dataIndex: 'greaterThan', key: 'gt', render: (v) => v ?? '—' },
    { title: 'Smaller Than', dataIndex: 'smallerThan', key: 'st', render: (v) => v ?? '—' },
    {
      title: 'Primary',
      dataIndex: 'isPrimary',
      key: 'primary',
      render: (v) => v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
  ]

  const slaPerTypeColumns = [
    { title: 'Claim Type', dataIndex: 'ct', key: 'ct', render: (ct: string) => <Tag color={CLAIM_TYPE_COLORS[ct as ClaimType]}>{ct}</Tag> },
    { title: 'Business Days', dataIndex: 'days', key: 'days' },
  ]
  const slaPerTypeData = Object.entries(config.sla?.perClaimType ?? {}).map(([ct, days]) => ({ ct, days, key: ct }))

  const customFieldColumns: ColumnsType<NonNullable<typeof config.customFields>[0]> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag>{v}</Tag> },
    { title: 'Required', dataIndex: 'required', key: 'required', render: (v) => v ? <Tag color="red">Yes</Tag> : <Tag>No</Tag> },
  ]

  return (
    <Flex vertical gap={0}>
      {/* Branding */}
      <Typography.Text strong style={{ fontSize: 13, color: '#0D9488' }}>Branding</Typography.Text>
      <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
        <Descriptions.Item label="Company">{config.branding?.companyName}</Descriptions.Item>
        {config.branding?.logoUrl && (
          <Descriptions.Item label="Logo URL">
            <Typography.Text copyable style={{ fontSize: 12 }}>{config.branding.logoUrl}</Typography.Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Primary Color">
          <ColorSwatch hex={config.branding?.primaryColor} />
        </Descriptions.Item>
        <Descriptions.Item label="Secondary Color">
          <ColorSwatch hex={config.branding?.secondaryColor} />
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: '12px 0' }} />

      {/* Claim Types */}
      <Typography.Text strong style={{ fontSize: 13, color: '#0D9488' }}>Claim Types</Typography.Text>
      {enabledClaimTypes.length === 0 ? (
        <Typography.Text type="secondary" style={{ marginTop: 8 }}>No enabled claim types</Typography.Text>
      ) : (
        <Flex vertical gap={8} style={{ marginTop: 8 }}>
          {enabledClaimTypes.map(([ct, v]) => (
            <Flex key={ct} vertical gap={4}>
              <Tag color={CLAIM_TYPE_COLORS[ct as ClaimType]} style={{ width: 'fit-content' }}>{ct}</Tag>
              {v?.requiredDocuments?.length ? (
                <Flex wrap="wrap" gap={4} style={{ paddingLeft: 8 }}>
                  {v.requiredDocuments.map((doc) => (
                    <Tag key={doc} color="default">{doc}</Tag>
                  ))}
                </Flex>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>No required documents</Typography.Text>
              )}
            </Flex>
          ))}
        </Flex>
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* Approval Rules */}
      <Typography.Text strong style={{ fontSize: 13, color: '#0D9488' }}>Approval Rules</Typography.Text>
      <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
        <Descriptions.Item label="Auto-approve threshold">
          {config.approvalRules?.autoApprovalThreshold?.toLocaleString() ?? '—'}
        </Descriptions.Item>
      </Descriptions>
      <Table
        size="small"
        rowKey="tier"
        columns={tierColumns}
        dataSource={config.approvalRules?.approvalTiers ?? []}
        pagination={false}
        style={{ marginTop: 8 }}
      />

      <Divider style={{ margin: '12px 0' }} />

      {/* SLA */}
      <Typography.Text strong style={{ fontSize: 13, color: '#0D9488' }}>SLA</Typography.Text>
      <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
        <Descriptions.Item label="Timezone">{config.sla?.timezone}</Descriptions.Item>
        <Descriptions.Item label="Weekdays">
          <Flex wrap="wrap" gap={4}>
            {(config.sla?.weekdays ?? []).map((d) => <Tag key={d}>{d}</Tag>)}
          </Flex>
        </Descriptions.Item>
        {config.sla?.escalationContacts?.length ? (
          <Descriptions.Item label="Escalation">
            {config.sla.escalationContacts.join(', ')}
          </Descriptions.Item>
        ) : null}
      </Descriptions>
      {slaPerTypeData.length > 0 && (
        <Table
          size="small"
          rowKey="ct"
          columns={slaPerTypeColumns}
          dataSource={slaPerTypeData}
          pagination={false}
          style={{ marginTop: 8 }}
        />
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* Custom Fields */}
      <Typography.Text strong style={{ fontSize: 13, color: '#0D9488' }}>Custom Fields</Typography.Text>
      {!config.customFields?.length ? (
        <Typography.Text type="secondary" style={{ marginTop: 8 }}>None configured</Typography.Text>
      ) : (
        <Table
          size="small"
          rowKey="name"
          columns={customFieldColumns}
          dataSource={config.customFields}
          pagination={false}
          style={{ marginTop: 8 }}
        />
      )}
    </Flex>
  )
}

export function VersionHistory({ tenantId, onRollback }: VersionHistoryProps) {
  const [messageApi, contextHolder] = message.useMessage()
  const [versions, setVersions] = useState<VersionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState<VersionRow | null>(null)
  const [previewLoading, setPreviewLoading] = useState<string | null>(null)

  const loadVersions = async (p: number) => {
    setLoading(true)
    const res = await tenantsApi.listVersions(tenantId, p, 10)
    if (isSuccess(res.code) && res.data) {
      setVersions(res.data.data)
      setTotal(res.data.total)
    }
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVersions(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handlePreview = async (record: VersionRow) => {
    setPreviewLoading(record.id)
    const res = await tenantsApi.getVersion(tenantId, record.id)
    if (isSuccess(res.code) && res.data) setPreviewVersion(res.data)
    setPreviewLoading(null)
  }

  const handleRollback = async (versionId: string) => {
    setRollingBack(versionId)
    const res = await tenantsApi.rollback(tenantId, versionId)
    if (isSuccess(res.code)) {
      messageApi.success('Rolled back successfully — new version created')
      onRollback()
    } else {
      messageApi.error(res.message || 'Rollback failed')
    }
    setRollingBack(null)
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
      title: 'Preview',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Preview config">
          <Button
            icon={<EyeOutlined />}
            size="small"
            loading={previewLoading === record.id}
            onClick={() => handlePreview(record)}
          />
        </Tooltip>
      ),
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
            <Button loading={rollingBack === record.id} disabled={!!rollingBack}>
              Rollback
            </Button>
          </Popconfirm>
        ),
    },
  ]

  return (
    <Flex vertical gap={8}>
      {contextHolder}
      <Flex justify="space-between" align="center">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Version History
        </Typography.Title>
        <Tooltip title="Refresh">
          <Button icon={<ReloadOutlined />} onClick={() => loadVersions(page)} loading={loading} />
        </Tooltip>
      </Flex>
      <Table
        rowKey="id"
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

      <Drawer
        title={previewVersion ? `Config Preview — v${previewVersion.version}` : 'Config Preview'}
        open={!!previewVersion}
        onClose={() => setPreviewVersion(null)}
        size={640}
        destroyOnHidden
      >
        {previewVersion && <ConfigPreview version={previewVersion} />}
      </Drawer>
    </Flex>
  )
}
