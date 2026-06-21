import { useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  Switch,
  Select,
  InputNumber,
  Checkbox,
  DatePicker,
  Space,
  Flex,
  Typography,
  ColorPicker,
  Collapse,
  Row,
  Col,
  Tag,
} from 'antd'
import {
  BgColorsOutlined,
  FileProtectOutlined,
  AuditOutlined,
  BellOutlined,
  ClockCircleOutlined,
  FormOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type { TenantConfig, ClaimType, NotificationEvent } from '@/shared/types'
import type { Color } from 'antd/es/color-picker'

const ALL_CLAIM_TYPES: ClaimType[] = ['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL']
const NOTIFICATION_EVENTS: NotificationEvent[] = [
  'claim_submitted',
  'approved',
  'rejected',
  'payment_sent',
]
const WEEKDAY_OPTIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => ({
  label: d,
  value: d,
}))
const TIMEZONE_OPTIONS = [
  { label: 'Asia/Ho_Chi_Minh (GMT+7)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Asia/Bangkok (GMT+7)', value: 'Asia/Bangkok' },
  { label: 'Asia/Singapore (GMT+8)', value: 'Asia/Singapore' },
  { label: 'UTC', value: 'UTC' },
]
const CHANNEL_OPTIONS = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Webhook', value: 'webhook' },
]
const FIELD_TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Text Area', value: 'text_area' },
  { label: 'Number', value: 'number' },
  { label: 'DateTime', value: 'date_time' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Select', value: 'select' },
]

const CLAIM_TYPE_COLORS: Record<ClaimType, string> = {
  OUTPATIENT: 'blue',
  INPATIENT: 'cyan',
  DENTAL: 'green',
  MATERNITY: 'pink',
  OPTICAL: 'orange',
}

export interface TenantFormValues {
  name: string
  config: TenantConfig
}

interface TenantFormProps {
  initialValues?: TenantFormValues
  onSubmit: (name: string, config: TenantConfig) => Promise<void>
  loading?: boolean
}

function toHex(val: string | Color | undefined): string {
  if (!val) return '#000000'
  if (typeof val === 'string') return val
  return (val as Color).toHexString?.() ?? '#000000'
}

export function assembleConfig(values: Record<string, unknown>): TenantConfig {
  const branding = (values.branding as Record<string, unknown>) ?? {}
  const slaRaw = (values.sla as Record<string, unknown>) ?? {}

  const notifications = NOTIFICATION_EVENTS.map((event) => ({
    event,
    channels: (
      (values[`notif_${event}`] as { channels?: { channel: string; template?: string }[] })
        ?.channels ?? []
    )
      .filter((ch) => ch?.channel)
      .map((ch) => ({
        channel: ch.channel as import('@/shared/types').NotificationChannel,
        template: ch.template,
      })),
  })).filter((n) => n.channels.length > 0)

  const perClaimType = Object.fromEntries(
    Object.entries((slaRaw.perClaimType as Record<string, unknown>) ?? {}).filter(
      ([, v]) => v != null,
    ),
  )

  const customFields = ((values.customFields as Record<string, unknown>[]) ?? []).map((f) => ({
    ...f,
    options:
      f.type === 'select' && typeof f.options === 'string'
        ? (f.options as string)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : f.options,
  }))

  return {
    branding: {
      companyName: (branding.companyName as string) ?? '',
      logoUrl: branding.logoUrl as string | undefined,
      primaryColor: toHex(branding.primaryColor as string | Color),
      secondaryColor: toHex(branding.secondaryColor as string | Color),
    },
    claimTypes: (values.claimTypes as TenantConfig['claimTypes']) ?? {},
    approvalRules: (values.approvalRules as TenantConfig['approvalRules']) ?? {
      autoApprovalThreshold: 0,
      approvalTiers: [],
    },
    notifications,
    sla: {
      timezone: (slaRaw.timezone as string) ?? 'Asia/Ho_Chi_Minh',
      weekdays: (slaRaw.weekdays as TenantConfig['sla']['weekdays']) ?? [],
      holidays: ((slaRaw.holidays as string[]) ?? []).filter(Boolean),
      perClaimType,
      escalationContacts: ((slaRaw.escalationContacts as string[]) ?? []).filter(Boolean),
    },
    customFields: customFields as TenantConfig['customFields'],
  }
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Flex align="center" gap={8}>
      <span style={{ color: '#0D9488', fontSize: 16 }}>{icon}</span>
      <Typography.Text strong style={{ fontSize: 15 }}>
        {title}
      </Typography.Text>
    </Flex>
  )
}

export function TenantForm({ initialValues, onSubmit, loading }: TenantFormProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (!initialValues) return
    const { name, config } = initialValues
    form.setFieldsValue({
      name,
      branding: config.branding,
      claimTypes: config.claimTypes,
      approvalRules: config.approvalRules,
      ...Object.fromEntries(
        config.notifications.map((n) => [`notif_${n.event}`, { channels: n.channels }]),
      ),
      sla: { ...config.sla, perClaimType: config.sla.perClaimType },
      customFields: config.customFields.map((f) => ({
        ...f,
        options: f.options?.join(', ') ?? '',
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const handleFinish = async (values: Record<string, unknown>) => {
    const config = assembleConfig(values)
    await onSubmit(values.name as string, config)
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {/* ── Branding ─────────────────────────────────────────────── */}
      <Card
        title={<SectionTitle icon={<BgColorsOutlined />} title="Branding" />}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Tenant Name"
              name="name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g. SafeGuard" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Company Name"
              name={['branding', 'companyName']}
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="SafeGuard Insurance" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Logo URL" name={['branding', 'logoUrl']}>
          <Input placeholder="https://..." />
        </Form.Item>
        <Flex gap={24} wrap="wrap">
          <Form.Item label="Primary Color" name={['branding', 'primaryColor']}>
            <ColorPicker
              format="hex"
              onChange={(_, hex) => form.setFieldValue(['branding', 'primaryColor'], hex)}
            />
          </Form.Item>
          <Form.Item label="Secondary Color" name={['branding', 'secondaryColor']}>
            <ColorPicker
              format="hex"
              onChange={(_, hex) => form.setFieldValue(['branding', 'secondaryColor'], hex)}
            />
          </Form.Item>
        </Flex>
      </Card>

      {/* ── Claim Types ──────────────────────────────────────────── */}
      <Card
        title={<SectionTitle icon={<FileProtectOutlined />} title="Claim Types" />}
        style={{ marginBottom: 16 }}
        extra={
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Enable types and set required documents
          </Typography.Text>
        }
      >
        <Row gutter={[12, 12]}>
          {ALL_CLAIM_TYPES.map((ct) => (
            <ClaimTypeSection key={ct} claimType={ct} />
          ))}
        </Row>
      </Card>

      {/* ── Approval Rules ───────────────────────────────────────── */}
      <Card
        title={<SectionTitle icon={<AuditOutlined />} title="Approval Rules" />}
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          label="Auto-Approval Threshold"
          name={['approvalRules', 'autoApprovalThreshold']}
          rules={[{ required: true, type: 'number', min: 0, message: 'Must be ≥ 0' }]}
          extra="Claims at or below this amount are auto-approved"
        >
          <InputNumber style={{ width: 200 }} min={0} placeholder="20000" prefix="≤" />
        </Form.Item>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          Approval Tiers
        </Typography.Text>
        <Form.List name={['approvalRules', 'approvalTiers']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Card key={key} style={{ marginBottom: 8, background: '#F9FAFB' }}>
                  <Row gutter={[8, 0]} align="bottom">
                    <Col xs={24} sm={6}>
                      <Form.Item
                        label="Tier Name"
                        name={[name, 'tier']}
                        rules={[{ required: true, message: 'Required' }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input placeholder="assessor" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={5}>
                      <Form.Item
                        label="Greater Than"
                        name={[name, 'greaterThan']}
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber style={{ width: '100%' }} min={0} placeholder="20000" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={5}>
                      <Form.Item
                        label="Smaller Than"
                        name={[name, 'smallerThan']}
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber style={{ width: '100%' }} min={0} placeholder="50000" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={4}>
                      <Form.Item
                        label="Primary fallback"
                        name={[name, 'isPrimary']}
                        valuePropName="checked"
                        style={{ marginBottom: 8 }}
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={4}>
                      <Form.Item style={{ marginBottom: 8 }}>
                        <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)}>
                          Remove
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button icon={<PlusOutlined />} onClick={() => add({ tier: '', isPrimary: false })}>
                Add Tier
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* ── Notifications ────────────────────────────────────────── */}
      <Card
        title={<SectionTitle icon={<BellOutlined />} title="Notifications" />}
        style={{ marginBottom: 16 }}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Configure notification channels per lifecycle event.
        </Typography.Text>
        <Collapse
          items={NOTIFICATION_EVENTS.map((event) => ({
            key: event,
            label: (
              <Tag color="geekblue" style={{ margin: 0 }}>
                {event}
              </Tag>
            ),
            children: <NotificationEventRow event={event} />,
          }))}
        />
      </Card>

      {/* ── SLA ──────────────────────────────────────────────────── */}
      <Card
        title={<SectionTitle icon={<ClockCircleOutlined />} title="SLA" />}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Timezone"
              name={['sla', 'timezone']}
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select options={TIMEZONE_OPTIONS} showSearch placeholder="Asia/Ho_Chi_Minh" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Business Days"
          name={['sla', 'weekdays']}
          rules={[
            { required: true, type: 'array', min: 1, message: 'At least one weekday required' },
          ]}
        >
          <Checkbox.Group options={WEEKDAY_OPTIONS} />
        </Form.Item>

        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          SLA Days Per Claim Type
        </Typography.Text>
        <Row gutter={[12, 0]}>
          {ALL_CLAIM_TYPES.map((ct) => (
            <Col xs={12} sm={8} md={4} key={ct}>
              <Form.Item
                label={<Tag color={CLAIM_TYPE_COLORS[ct]}>{ct}</Tag>}
                name={['sla', 'perClaimType', ct]}
              >
                <InputNumber min={1} placeholder="5" style={{ width: '100%' }} suffix="d" />
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Form.Item label="Holiday Dates (skip)">
          <Form.List name={['sla', 'holidays']}>
            {(fields, { add, remove }) => (
              <Flex vertical gap={8}>
                {fields.map(({ key, name }) => (
                  <Flex key={key} gap={8}>
                    <Form.Item name={name} noStyle>
                      <DatePicker
                        format="YYYY-MM-DD"
                        onChange={(_, dateStr) => {
                          const list: string[] = form.getFieldValue(['sla', 'holidays'])
                          list[name] = Array.isArray(dateStr) ? dateStr[0] : dateStr
                          form.setFieldValue(['sla', 'holidays'], list)
                        }}
                      />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Flex>
                ))}
                <Button
                  icon={<PlusOutlined />}
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => add('')}
                >
                  Add Holiday
                </Button>
              </Flex>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item label="Escalation Contacts">
          <Form.List name={['sla', 'escalationContacts']}>
            {(fields, { add, remove }) => (
              <Flex vertical gap={8}>
                {fields.map(({ key, name }) => (
                  <Flex key={key} gap={8}>
                    <Form.Item
                      name={name}
                      noStyle
                      rules={[{ type: 'email', message: 'Must be a valid email' }]}
                    >
                      <Input placeholder="sla@company.com" style={{ width: 280 }} />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Flex>
                ))}
                <Button
                  icon={<PlusOutlined />}
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => add('')}
                >
                  Add Contact
                </Button>
              </Flex>
            )}
          </Form.List>
        </Form.Item>
      </Card>

      {/* ── Custom Fields ─────────────────────────────────────────── */}
      <Card
        title={<SectionTitle icon={<FormOutlined />} title="Custom Fields" />}
        style={{ marginBottom: 24 }}
      >
        <Form.List name="customFields">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <CustomFieldRow key={key} name={name} onRemove={() => remove(name)} />
              ))}
              <Button
                icon={<PlusOutlined />}
                onClick={() => add({ name: '', label: '', required: false, type: 'text' })}
              >
                Add Custom Field
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          icon={<SaveOutlined />}
        >
          Save Configuration
        </Button>
      </Form.Item>
    </Form>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ClaimTypeSection({ claimType }: { claimType: ClaimType }) {
  const form = Form.useFormInstance()
  const enabled = Form.useWatch(['claimTypes', claimType, 'enabled'], form) ?? false

  return (
    <Col xs={24} sm={12}>
      <Card
        style={{
          borderColor: enabled ? '#0D9488' : '#E5E7EB',
          background: enabled ? '#EEF2FF' : '#FAFAFA',
          transition: 'all 0.2s',
        }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: enabled ? 12 : 0 }}>
          <Flex align="center" gap={8}>
            <Tag color={CLAIM_TYPE_COLORS[claimType]} style={{ margin: 0 }}>
              {claimType}
            </Tag>
          </Flex>
          <Form.Item name={['claimTypes', claimType, 'enabled']} valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
        {enabled && (
          <Flex vertical gap={8}>
            <DocList claimType={claimType} listKey="requiredDocuments" label="Required Docs" />
            <DocList claimType={claimType} listKey="optionalDocuments" label="Optional Docs" />
          </Flex>
        )}
      </Card>
    </Col>
  )
}

function DocList({
  claimType,
  listKey,
  label,
}: {
  claimType: ClaimType
  listKey: string
  label: string
}) {
  return (
    <Form.List name={['claimTypes', claimType, listKey]}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={4}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {label}
          </Typography.Text>
          {fields.map(({ key, name, ...rest }) => (
            <Flex key={key} gap={6}>
              <Form.Item {...rest} name={name} noStyle>
                <Input placeholder="e.g. Medical Report" style={{ flex: 1 }} />
              </Form.Item>
              <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
            </Flex>
          ))}
          <Button
            style={{ alignSelf: 'flex-start' }}
            onClick={() => add('')}
            icon={<PlusOutlined />}
          >
            Add
          </Button>
        </Flex>
      )}
    </Form.List>
  )
}

function NotificationEventRow({ event }: { event: NotificationEvent }) {
  return (
    <Form.List name={[`notif_${event}`, 'channels']}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={8}>
          {fields.map(({ key, name }) => (
            <Row key={key} gutter={[8, 0]} align="bottom">
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Channel"
                  name={[name, 'channel']}
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select options={CHANNEL_OPTIONS} placeholder="email" />
                </Form.Item>
              </Col>
              <Col xs={22} sm={14}>
                <Form.Item
                  label="Template (optional)"
                  name={[name, 'template']}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="https://webhook.url or message text" />
                </Form.Item>
              </Col>
              <Col xs={2} sm={2}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Form.Item>
              </Col>
            </Row>
          ))}
          <Button
            icon={<PlusOutlined />}
            style={{ alignSelf: 'flex-start' }}
            onClick={() => add({ channel: 'email' })}
          >
            Add Channel
          </Button>
        </Flex>
      )}
    </Form.List>
  )
}

function CustomFieldRow({ name, onRemove }: { name: number; onRemove: () => void }) {
  const form = Form.useFormInstance()
  const fieldType = Form.useWatch(['customFields', name, 'type'], form) ?? 'text'

  return (
    <Card style={{ marginBottom: 8, background: '#FAFAFA' }}>
      <Row gutter={[8, 0]} align="bottom">
        <Col xs={24} sm={6}>
          <Form.Item
            label="Name (key)"
            name={[name, 'name']}
            rules={[{ required: true, message: 'Required' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="employee_id" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item
            label="Label"
            name={[name, 'label']}
            rules={[{ required: true, message: 'Required' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="Employee ID" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={5}>
          <Form.Item
            label="Type"
            name={[name, 'type']}
            rules={[{ required: true }]}
            style={{ marginBottom: 8 }}
          >
            <Select options={FIELD_TYPE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={8} sm={3}>
          <Form.Item
            label="Required"
            name={[name, 'required']}
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={4} sm={4}>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button danger icon={<DeleteOutlined />} onClick={onRemove}>
              Remove
            </Button>
          </Form.Item>
        </Col>
      </Row>
      {(fieldType === 'text' || fieldType === 'text_area') && (
        <Form.Item label="Max Length" name={[name, 'maxLength']} style={{ marginBottom: 0 }}>
          <InputNumber min={1} style={{ width: 120 }} />
        </Form.Item>
      )}
      {fieldType === 'number' && (
        <Space>
          <Form.Item label="Min" name={[name, 'min']} style={{ marginBottom: 0 }}>
            <InputNumber style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="Max" name={[name, 'max']} style={{ marginBottom: 0 }}>
            <InputNumber style={{ width: 100 }} />
          </Form.Item>
        </Space>
      )}
      {fieldType === 'select' && (
        <Form.Item
          label="Options (comma-separated)"
          name={[name, 'options']}
          style={{ marginBottom: 0 }}
        >
          <Input placeholder="option1, option2, option3" />
        </Form.Item>
      )}
    </Card>
  )
}
