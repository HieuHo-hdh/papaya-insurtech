# T005: Tenant Form — Branding + Claim Types Sections

**Module:** M6 · admin-ui-tenant
**Story:** S4, S5
**Tags:** FE
**Status:** done
**Size:** M

## Description
Create the `TenantForm` shell component and implement the Branding and Claim Types form sections. This component is shared between Create (`/tenants/new`) and Edit (`/tenants/:id`) pages.

## Detail

### Component: `fe/components/tenants/TenantForm.tsx`

The `TenantForm` is a controlled Ant Design Form with a two-column Card layout, one Card per config section. It accepts an optional `initialValues` prop (for edit mode).

```tsx
'use client'

import { Form, Input, ColorPicker, Switch, Button, Card, Space, Flex, Typography, Divider } from 'antd'
import type { TenantConfig, ClaimType } from '@/shared/types'

const ALL_CLAIM_TYPES: ClaimType[] = ['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL']

interface TenantFormProps {
  initialValues?: { name: string; config: TenantConfig }
  onSubmit: (name: string, config: TenantConfig) => Promise<void>
  loading?: boolean
}

export function TenantForm({ initialValues, onSubmit, loading }: TenantFormProps) {
  const [form] = Form.useForm()

  // populate form when initialValues arrive
  useEffect(() => {
    if (initialValues) form.setFieldsValue(flattenForForm(initialValues))
  }, [initialValues])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = async (values: any) => {
    const config = unFlattenToConfig(values)
    await onSubmit(values.name, config)
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {/* ── Branding ─────────────────────────────────────── */}
      <Card title="Branding" style={{ marginBottom: 16 }}>
        <Form.Item label="Tenant Name" name="name" rules={[{ required: true }]}>
          <Input placeholder="e.g. SafeGuard" />
        </Form.Item>
        <Form.Item label="Company Name" name={['branding', 'companyName']} rules={[{ required: true }]}>
          <Input placeholder="SafeGuard Insurance" />
        </Form.Item>
        <Form.Item label="Logo URL" name={['branding', 'logoUrl']}>
          <Input placeholder="https://..." />
        </Form.Item>
        <Space>
          <Form.Item label="Primary Color" name={['branding', 'primaryColor']}>
            <ColorPicker format="hex" />
          </Form.Item>
          <Form.Item label="Secondary Color" name={['branding', 'secondaryColor']}>
            <ColorPicker format="hex" />
          </Form.Item>
        </Space>
      </Card>

      {/* ── Claim Types ───────────────────────────────────── */}
      <Card title="Claim Types" style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">Enable claim types and configure required/optional documents.</Typography.Text>
        {ALL_CLAIM_TYPES.map((ct) => (
          <ClaimTypeSection key={ct} claimType={ct} />
        ))}
      </Card>

      {/* ── Other sections added in T006, T007 ─────────────── */}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Save Configuration
        </Button>
      </Form.Item>
    </Form>
  )
}
```

### `ClaimTypeSection` sub-component (in same file)

```tsx
function ClaimTypeSection({ claimType }: { claimType: ClaimType }) {
  const form = Form.useFormInstance()
  const enabled = Form.useWatch(['claimTypes', claimType, 'enabled'], form) ?? false

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Flex align="center" gap={12}>
        <Form.Item name={['claimTypes', claimType, 'enabled']} valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
        <Typography.Text strong>{claimType}</Typography.Text>
      </Flex>
      {enabled && (
        <Flex vertical gap={8} style={{ marginTop: 12 }}>
          <Form.List name={['claimTypes', claimType, 'requiredDocuments']}>
            {(fields, { add, remove }) => (
              <>
                <Typography.Text>Required Documents</Typography.Text>
                {fields.map(({ key, name, ...rest }) => (
                  <Flex key={key} gap={8}>
                    <Form.Item {...rest} name={name} noStyle>
                      <Input placeholder="e.g. Medical Report" />
                    </Form.Item>
                    <Button danger size="small" onClick={() => remove(name)}>×</Button>
                  </Flex>
                ))}
                <Button size="small" onClick={() => add('')}>+ Add Required Doc</Button>
              </>
            )}
          </Form.List>
          <Form.List name={['claimTypes', claimType, 'optionalDocuments']}>
            {(fields, { add, remove }) => (
              <>
                <Typography.Text>Optional Documents</Typography.Text>
                {fields.map(({ key, name, ...rest }) => (
                  <Flex key={key} gap={8}>
                    <Form.Item {...rest} name={name} noStyle>
                      <Input placeholder="e.g. Referral Letter" />
                    </Form.Item>
                    <Button danger size="small" onClick={() => remove(name)}>×</Button>
                  </Flex>
                ))}
                <Button size="small" onClick={() => add('')}>+ Add Optional Doc</Button>
              </>
            )}
          </Form.List>
        </Flex>
      )}
    </Card>
  )
}
```

### Pages using `TenantForm`

**`fe/app/(admin)/tenants/new/page.tsx`:**
```tsx
'use client'
import { useRouter } from 'next/navigation'
import { Typography, Flex, message } from 'antd'
import { TenantForm } from '@/components/tenants/TenantForm'
import { tenantsApi } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import { hasToken } from '@/lib/api/auth'
import { useEffect, useState } from 'react'

export default function NewTenantPage() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!hasToken()) router.push('/login') }, [router])

  const handleSubmit = async (name: string, config: TenantConfig) => {
    setLoading(true)
    const res = await tenantsApi.create(name, config)
    if (isSuccess(res.code)) {
      messageApi.success('Tenant created')
      router.push('/tenants')
    } else {
      messageApi.error(res.message || 'Failed to create tenant')
      setLoading(false)
    }
  }

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Typography.Title level={4}>New Tenant</Typography.Title>
      <TenantForm onSubmit={handleSubmit} loading={loading} />
    </Flex>
  )
}
```

**`fe/app/(admin)/tenants/[id]/page.tsx`** — load existing config, pass as `initialValues` (full implementation in T008).

### ColorPicker value handling

Ant Design 6 `ColorPicker` returns a `Color` object, not a hex string. Convert in `onFinish`:
```typescript
// When reading ColorPicker value from form, call .toHexString():
const primaryColor = typeof values.branding.primaryColor === 'string'
  ? values.branding.primaryColor
  : values.branding.primaryColor?.toHexString?.() ?? '#000000'
```

Or use `ColorPicker`'s `onChange` to store as string in form:
```tsx
<Form.Item name={['branding', 'primaryColor']}>
  <ColorPicker
    format="hex"
    onChange={(_, hex) => form.setFieldValue(['branding', 'primaryColor'], hex)}
  />
</Form.Item>
```

Use the `onChange` approach — simpler, always a string in form state.

## Expectation
`/tenants/new` shows a form with Branding card (company name, logo URL, two color pickers) and Claim Types card (5 types with toggles; when enabled, shows doc list inputs with add/remove). Submit creates tenant and redirects to `/tenants`.

## Acceptance Criteria
- [ ] `TenantForm` component renders Branding + Claim Types sections in Cards
- [ ] ColorPicker stores hex string in form state (not Color object)
- [ ] Claim type Switch shows/hides doc lists
- [ ] Doc lists have add/remove buttons using `Form.List`
- [ ] `/tenants/new` uses TenantForm and calls `tenantsApi.create`
- [ ] On success, redirects to `/tenants`
- [ ] No raw HTML for text

## Dependencies
- Depends on: T001 (tenantsApi), T002 (AdminShell), T004 (navigate back to list)
- Blocks: T006, T007, T008

## References
- Architecture: TenantConfig JSONB Shape — `branding`, `claimTypes`
- Standards: Ant Design Form.List for dynamic arrays; `Typography.*` for text; no raw HTML
