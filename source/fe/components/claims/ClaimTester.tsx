import { useState } from 'react'
import {
  Form,
  Select,
  InputNumber,
  Input,
  Switch,
  DatePicker,
  Button,
  Card,
  Tag,
  Typography,
  Flex,
  Spin,
  message,
  List,
  Row,
  Col,
  Statistic,
  Steps,
  Result,
  Empty,
} from 'antd'
import {
  ClockCircleOutlined,
  AuditOutlined,
  FileTextOutlined,
  BellOutlined,
  CheckCircleOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { claimsApi } from '@/lib/api/claims'
import { isSuccess } from '@/lib/api/client'
import type { TenantConfig, ProcessClaimResult, ClaimType, CustomField } from '@/shared/types'
import { EVENT_LABELS, CHANNEL_LABELS } from '@/shared/constants'
import dayjs from 'dayjs'

const CLAIM_TYPE_OPTIONS: { label: string; value: ClaimType }[] = [
  { label: 'Outpatient', value: 'OUTPATIENT' },
  { label: 'Inpatient', value: 'INPATIENT' },
  { label: 'Dental', value: 'DENTAL' },
  { label: 'Maternity', value: 'MATERNITY' },
  { label: 'Optical', value: 'OPTICAL' },
]

interface ClaimTesterProps {
  tenantId: string
  config: TenantConfig
}

export function ClaimTester({ tenantId, config }: ClaimTesterProps) {
  const [form] = Form.useForm()
  const [result, setResult] = useState<ProcessClaimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const enabledTypes = CLAIM_TYPE_OPTIONS.filter((opt) => config.claimTypes[opt.value]?.enabled)

  const handleTest = async (values: Record<string, unknown>) => {
    setLoading(true)
    setResult(null)

    const rawFields = (values.customFields ?? {}) as Record<string, unknown>
    const customFields: Record<string, string> = {}
    for (const [key, val] of Object.entries(rawFields)) {
      if (val === null || val === undefined) continue
      if (
        typeof val === 'object' &&
        typeof (val as { toISOString?: () => string }).toISOString === 'function'
      ) {
        customFields[key] = (val as { toISOString: () => string }).toISOString()
      } else {
        customFields[key] = String(val)
      }
    }

    const res = await claimsApi.process(tenantId, {
      claimType: values.claimType as ClaimType,
      amount: values.amount as number,
      customFields,
    })

    if (isSuccess(res.code) && res.data) {
      setResult(res.data)
    } else {
      messageApi.error(res.message || 'Claim processing failed')
    }
    setLoading(false)
  }

  return (
    <>
      {contextHolder}
      <Row gutter={[24, 24]}>
        {/* Left: form input */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <SendOutlined style={{ color: '#0D9488' }} />
                <Typography.Text strong>Test Input</Typography.Text>
              </Flex>
            }
          >
            <Form form={form} layout="vertical" onFinish={handleTest}>
              <Form.Item
                label="Claim Type"
                name="claimType"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select options={enabledTypes} placeholder="Select type…" />
              </Form.Item>
              <Form.Item
                label="Amount"
                name="amount"
                rules={[{ required: true, type: 'number', min: 0, message: 'Required, ≥ 0' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="30000" prefix="$" />
              </Form.Item>

              {config.customFields.length > 0 && (
                <>
                  <Typography.Text
                    type="secondary"
                    style={{ display: 'block', marginBottom: 8, fontSize: 12 }}
                  >
                    Custom Fields
                  </Typography.Text>
                  {config.customFields.map((field) => (
                    <CustomFieldInput key={field.name} field={field} />
                  ))}
                </>
              )}

              <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<SendOutlined />}
                >
                  Process Claim
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Right: result */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <CheckCircleOutlined style={{ color: '#16A34A' }} />
                <Typography.Text strong>Result</Typography.Text>
              </Flex>
            }
            style={{ minHeight: 300 }}
          >
            {loading ? (
              <Flex justify="center" align="center" style={{ padding: 48 }}>
                <Spin size="large" />
              </Flex>
            ) : result ? (
              <ClaimResult result={result} />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text type="secondary">Submit a claim to see results</Typography.Text>
                }
                style={{ padding: '32px 0' }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}

function CustomFieldInput({ field }: { field: CustomField }) {
  const input = (() => {
    switch (field.type) {
      case 'text':
      case 'text_area':
        return <Input placeholder={field.label} maxLength={field.maxLength} />
      case 'number':
        return (
          <InputNumber
            style={{ width: '100%' }}
            min={field.min}
            max={field.max}
            placeholder={field.label}
          />
        )
      case 'boolean':
        return <Switch />
      case 'date_time':
        return <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
      case 'select':
        return (
          <Select
            options={(field.options ?? []).map((o) => ({ label: o, value: o }))}
            placeholder={field.label}
          />
        )
    }
  })()

  return (
    <Form.Item
      label={field.label}
      name={['customFields', field.name]}
      rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
      valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
    >
      {input}
    </Form.Item>
  )
}

function ClaimResult({ result }: { result: ProcessClaimResult }) {
  return (
    <Flex vertical gap={24}>
      {/* SLA */}
      <div
        style={{
          padding: '12px 16px',
          background: '#FFFBEB',
          borderRadius: 8,
          border: '1px solid #FDE68A',
        }}
      >
        <Statistic
          title={
            <Typography.Text type="secondary">
              <ClockCircleOutlined /> SLA Deadline
            </Typography.Text>
          }
          value={dayjs(result.slaDeadline).format('DD MMM YYYY · HH:mm')}
          styles={{ content: { fontSize: 18, fontWeight: 600, color: '#D97706' } }}
        />
      </div>

      {/* Approval */}
      <div>
        <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
          <AuditOutlined style={{ color: '#0D9488' }} />
          <Typography.Text strong>Approval Flow</Typography.Text>
        </Flex>
        {result.approvalTiers.length === 0 ? (
          <Result
            status="success"
            title="Auto-approved"
            subTitle="Amount is within the auto-approval threshold"
            style={{ padding: '12px 0' }}
          />
        ) : (
          <Steps
            direction="vertical"
            current={result.approvalTiers.length}
            items={result.approvalTiers.map((t) => ({
              title: <Typography.Text strong>{t.tier}</Typography.Text>,
              icon: <AuditOutlined />,
              status: 'process' as const,
            }))}
          />
        )}
      </div>

      {/* Required documents */}
      <div>
        <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
          <FileTextOutlined style={{ color: '#0D9488' }} />
          <Typography.Text strong>Required Documents</Typography.Text>
        </Flex>
        {result.requiredDocuments.length === 0 ? (
          <Typography.Text type="secondary">None required</Typography.Text>
        ) : (
          <List
            dataSource={result.requiredDocuments}
            renderItem={(doc) => (
              <List.Item style={{ padding: '4px 0', border: 'none' }}>
                <Flex align="center" gap={8}>
                  <CheckCircleOutlined style={{ color: '#16A34A' }} />
                  <Typography.Text>{doc}</Typography.Text>
                </Flex>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Notifications */}
      <div>
        <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
          <BellOutlined style={{ color: '#0D9488' }} />
          <Typography.Text strong>Notifications</Typography.Text>
        </Flex>
        <List
          dataSource={result.notifications}
          renderItem={(n) => (
            <List.Item style={{ padding: '4px 0', border: 'none' }}>
              <Flex align="center" gap={8} wrap="wrap">
                <Tag color="geekblue" style={{ margin: 0 }}>
                  {EVENT_LABELS[n.event as keyof typeof EVENT_LABELS] ?? n.event}
                </Tag>
                {n.channels.map((ch) => (
                  <Tag key={ch} color="blue" style={{ margin: 0 }}>
                    {CHANNEL_LABELS[ch as keyof typeof CHANNEL_LABELS] ?? ch}
                  </Tag>
                ))}
              </Flex>
            </List.Item>
          )}
        />
      </div>
    </Flex>
  )
}
