# T008: Form Validation + Pre-populate (Edit Mode)

**Module:** M6 · admin-ui-tenant
**Story:** S10, S11
**Tags:** FE
**Status:** done
**Size:** M

## Description
Wire Zod `TenantConfigSchema` validation into the form submit flow, surface errors as field-level Ant Design errors, and pre-populate the form from the active config when editing an existing tenant.

## Detail

### Validation in `handleFinish`

After collecting all form values, validate with `TenantConfigSchema` before calling the API:

```typescript
import { TenantConfigSchema, CreateTenantSchema } from '@/shared/schemas'

const handleFinish = async (rawValues: any) => {
  // 1. Assemble TenantConfig from form values
  const config = assembleConfig(rawValues)

  // 2. Validate with Zod
  const parsed = TenantConfigSchema.safeParse(config)
  if (!parsed.success) {
    // Map Zod errors to Ant Design form field paths
    const fieldErrors = parsed.error.issues.map((issue) => ({
      name: issue.path,          // e.g. ['approvalRules', 'autoApprovalThreshold']
      errors: [issue.message],
    }))
    form.setFields(fieldErrors)
    return
  }

  // 3. Call API
  await onSubmit(rawValues.name, parsed.data)
}
```

**Key validation rules to surface (from architecture.md):**
- `autoApprovalThreshold ≥ 0`
- At least 1 claim type enabled
- At least 1 `isPrimary` tier
- All tier `greaterThan > autoApprovalThreshold`
- `greaterThan < smallerThan` per tier
- SLA `perClaimType` days ≥ 1
- `weekdays.length ≥ 1`
- `select` custom field must have `options.length ≥ 1`
- `number` custom field: `min < max` if both defined

**Cross-field errors** (e.g. "tier greaterThan must exceed threshold") may not map cleanly to a single field path. Show them via `message.error` as a general notification in addition to field-level errors.

---

### `assembleConfig(rawValues)` helper

The form uses nested Ant Design paths that map closely to `TenantConfig`, but with some differences (ColorPicker, notifications flat fields, select options as string). Centralize the assembly:

```typescript
function assembleConfig(values: any): TenantConfig {
  // branding colors: ColorPicker may return Color object
  const primaryColor = toHex(values.branding?.primaryColor)
  const secondaryColor = toHex(values.branding?.secondaryColor)

  // notifications: reassemble from flat form fields
  const EVENTS = ['claim_submitted', 'approved', 'rejected', 'payment_sent'] as const
  const notifications = EVENTS.map((event) => ({
    event,
    channels: (values[`notifications_${event}`]?.channels ?? []).filter((ch: any) => ch?.channel),
  })).filter((n) => n.channels.length > 0)

  // sla.perClaimType: filter out undefined/null entries
  const perClaimType = Object.fromEntries(
    Object.entries(values.sla?.perClaimType ?? {})
      .filter(([, v]) => v != null)
  )

  // customFields: parse select options from comma-separated string
  const customFields = (values.customFields ?? []).map((f: any) => ({
    ...f,
    options: f.type === 'select' && typeof f.options === 'string'
      ? f.options.split(',').map((s: string) => s.trim()).filter(Boolean)
      : f.options,
  }))

  return {
    branding: { ...values.branding, primaryColor, secondaryColor },
    claimTypes: values.claimTypes ?? {},
    approvalRules: values.approvalRules ?? { autoApprovalThreshold: 0, approvalTiers: [] },
    notifications,
    sla: { ...values.sla, perClaimType, holidays: values.sla?.holidays?.filter(Boolean) ?? [] },
    customFields,
  }
}

function toHex(val: any): string {
  if (typeof val === 'string') return val
  return val?.toHexString?.() ?? '#000000'
}
```

---

### Edit mode — `app/(admin)/tenants/[id]/page.tsx`

Full implementation of the edit page:

```tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Flex, Spin, message } from 'antd'
import { TenantForm } from '@/components/tenants/TenantForm'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import { hasToken } from '@/lib/api/auth'
import type { TenantConfig } from '@/shared/types'

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [tenant, setTenant] = useState<TenantRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!hasToken()) { router.push('/login'); return }
    tenantsApi.getById(id).then((res) => {
      if (isSuccess(res.code) && res.data) setTenant(res.data)
      else messageApi.error('Failed to load tenant')
      setFetching(false)
    })
  }, [id])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (name: string, config: TenantConfig) => {
    setLoading(true)
    const res = await tenantsApi.update(id, config)
    if (isSuccess(res.code)) {
      messageApi.success('Config saved as new version')
      router.push('/tenants')
    } else {
      messageApi.error(res.message || 'Failed to save')
      setLoading(false)
    }
  }

  const activeConfig = tenant?.configs[0]?.config

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Typography.Title level={4}>Edit: {tenant?.name ?? '…'}</Typography.Title>
      {fetching ? (
        <Flex justify="center" style={{ padding: 48 }}><Spin size="large" /></Flex>
      ) : (
        <TenantForm
          initialValues={activeConfig ? { name: tenant!.name, config: activeConfig } : undefined}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </Flex>
  )
}
```

**Note:** `params` in Next.js 16 is a Promise — use `use(params)` to unwrap (React 19 `use()` hook). Do NOT destructure directly.

### Pre-populating the form

In `TenantForm`, `useEffect` sets form values from `initialValues`:
```typescript
useEffect(() => {
  if (!initialValues) return
  const { name, config } = initialValues

  // Flatten config into form paths
  form.setFieldsValue({
    name,
    branding: config.branding,
    claimTypes: config.claimTypes,
    approvalRules: config.approvalRules,
    // notifications: flatten to per-event keys
    ...Object.fromEntries(
      config.notifications.map((n) => [`notifications_${n.event}`, { channels: n.channels }])
    ),
    sla: {
      ...config.sla,
      perClaimType: config.sla.perClaimType,
    },
    customFields: config.customFields.map((f) => ({
      ...f,
      options: f.options?.join(', ') ?? '',  // flatten to comma-separated string
    })),
  })
}, [initialValues])
```

## Expectation
`/tenants/:id` loads the tenant's active config and pre-populates all form fields. On save, validates with Zod — field errors appear inline; cross-field errors appear as `message.error`. Valid config calls `PUT /api/tenants/:id` and redirects to `/tenants`.

## Acceptance Criteria
- [ ] `TenantConfigSchema.safeParse` called in `handleFinish` before API
- [ ] Zod field errors mapped to Ant Design form field paths via `form.setFields`
- [ ] Cross-field validation failures shown via `message.error`
- [ ] `/tenants/:id` fetches tenant, pre-populates TenantForm with `initialValues`
- [ ] `params` unwrapped via `use(params)` (Next.js 16 / React 19 pattern)
- [ ] Loading spinner shown while fetching tenant data
- [ ] ColorPicker, `select` options, and notifications correctly round-trip through pre-populate → assemble

## Dependencies
- Depends on: T005, T006, T007 (all form sections)
- Blocks: T009 (theme hook reads active config)

## References
- Architecture: Validation Rules; `PUT /api/tenants/:id`; `GET /api/tenants/:id`
- Standards: Zod validation before API; Ant Design `form.setFields` for error display; `use(params)` for Next.js 16
