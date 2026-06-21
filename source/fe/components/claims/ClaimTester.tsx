'use client'

import { useState } from 'react'
import {
  Form, Select, InputNumber, Input, Switch, DatePicker,
  Button, Card, Descriptions, Tag, Typography, Flex, Spin, Divider, message, List,
} from 'antd'
import { claimsApi } from '@/lib/api/claims'
import { isSuccess } from '@/lib/api/client'
import type { TenantConfig, ProcessClaimResult, ClaimType, CustomField } from '@/shared/types'
import dayjs from 'dayjs'

const CLAIM_TYPE_OPTIONS: { label: string; value: ClaimType }[] = [
  { label: 'Outpatient', value: 'OUTPATIENT' },
  { label: 'Inpatient',  value: 'INPATIENT'  },
  { label: 'Dental',     value: 'DENTAL'      },
  { label: 'Maternity',  value: 'MATERNITY'   },
  { label: 'Optical',    value: 'OPTICAL'     },
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

  const enabledTypes = CLAIM_TYPE_OPTIONS.filter(
    (opt) => config.claimTypes[opt.value]?.enabled
  )

  const handleTest = async (values: Record<string, unknown>) => {
    setLoading(true)
    setResult(null)

    const rawFields = (values.customFields ?? {}) as Record<string, unknown>
    const customFields: Record<string, string> = {}
    for (const [key, val] of Object.entries(rawFields)) {
      if (val === null || val === undefined) continue
      if (typeof val === 'object' && typeof (val as { toISOString?: () => string }).toISOString === 'function') {
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
    <Card title="Claim Tester">
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={handleTest}>
        <Flex gap={16} wrap="wrap">
          <Form.Item
            label="Claim Type"
            name="claimType"
            rules={[{ required: true, message: 'Required' }]}
            style={{ minWidth: 180 }}
          >
            <Select options={enabledTypes} placeholder="Select type…" />
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, type: 'number', min: 0, message: 'Required, ≥ 0' }]}
            style={{ minWidth: 160 }}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="30000" />
          </Form.Item>
        </Flex>

        {config.customFields.length > 0 && (
          <>
            <Typography.Text strong>Custom Fields</Typography.Text>
            <div style={{ marginTop: 8 }}>
              {config.customFields.map((field) => (
                <CustomFieldInput key={field.name} field={field} />
              ))}
            </div>
          </>
        )}

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Process Claim
          </Button>
        </Form.Item>
      </Form>

      {loading && (
        <Flex justify="center" style={{ padding: 24 }}>
          <Spin />
        </Flex>
      )}

      {result && <ClaimResult result={result} />}
    </Card>
  )
}

function CustomFieldInput({ field }: { field: CustomField }) {
  const input = (() => {
    switch (field.type) {
      case 'text':
      case 'text_area':
        return <Input placeholder={field.label} maxLength={field.maxLength} />
      case 'number':
        return <InputNumber style={{ width: '100%' }} min={field.min} max={field.max} placeholder={field.label} />
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
      style={{ maxWidth: 360 }}
    >
      {input}
    </Form.Item>
  )
}

function ClaimResult({ result }: { result: ProcessClaimResult }) {
  return (
    <Flex vertical gap={16} style={{ marginTop: 24 }}>
      <Divider style={{ margin: 0 }} />
      <Typography.Title level={5} style={{ margin: 0 }}>Result</Typography.Title>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="SLA Deadline">
          {dayjs(result.slaDeadline).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="Approval">
          {result.approvalTiers.length === 0
            ? <Tag color="green">Auto-approved</Tag>
            : result.approvalTiers.map((t) => <Tag key={t.tier} color="orange">{t.tier}</Tag>)
          }
        </Descriptions.Item>
        <Descriptions.Item label="Required Documents">
          <Flex vertical gap={4}>
            {result.requiredDocuments.length === 0
              ? <Typography.Text type="secondary">None</Typography.Text>
              : result.requiredDocuments.map((doc) => (
                  <Typography.Text key={doc}>• {doc}</Typography.Text>
                ))
            }
          </Flex>
        </Descriptions.Item>
        <Descriptions.Item label="Notifications">
          <List
            size="small"
            dataSource={result.notifications}
            renderItem={(n) => (
              <List.Item style={{ padding: '4px 0', border: 'none' }}>
                <Flex gap={8} align="center">
                  <Tag>{n.event}</Tag>
                  {n.channels.map((ch) => <Tag key={ch} color="blue">{ch}</Tag>)}
                </Flex>
              </List.Item>
            )}
          />
        </Descriptions.Item>
      </Descriptions>
    </Flex>
  )
}
