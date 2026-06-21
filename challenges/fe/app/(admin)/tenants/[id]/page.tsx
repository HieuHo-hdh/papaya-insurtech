'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Flex, Spin, Divider, message } from 'antd'
import { TenantForm } from '@/components/tenants/TenantForm'
import { VersionHistory } from '@/components/tenants/VersionHistory'
import { ClaimTester } from '@/components/claims/ClaimTester'
import { TenantConfigSchema } from '@/shared/schemas'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import { hasToken } from '@/lib/api/auth'
import { useTenantTheme } from '@/hooks/useTenantTheme'
import type { TenantConfig } from '@/shared/types'

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [tenant, setTenant] = useState<TenantRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const activeConfig = tenant?.configs[0]?.config ?? null
  useTenantTheme(activeConfig)

  const loadTenant = () => {
    tenantsApi.getById(id).then((res) => {
      if (isSuccess(res.code) && res.data) setTenant(res.data)
      else messageApi.error('Failed to load tenant')
      setFetching(false)
    })
  }

  useEffect(() => {
    if (!hasToken()) { router.push('/login'); return }
    loadTenant()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (name: string, config: TenantConfig) => {
    const parsed = TenantConfigSchema.safeParse(config)
    if (!parsed.success) {
      const msgs = parsed.error.issues.map((i) => i.message).join('; ')
      messageApi.error(`Validation failed: ${msgs}`)
      return
    }

    setLoading(true)
    const res = await tenantsApi.update(id, parsed.data)
    if (isSuccess(res.code)) {
      messageApi.success('Config saved as new version')
      router.push('/tenants')
    } else {
      messageApi.error(res.message || 'Failed to save')
      setLoading(false)
    }
  }

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Typography.Title level={4}>Edit: {tenant?.name ?? '…'}</Typography.Title>

      {fetching ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      ) : (
        <>
          <TenantForm
            initialValues={activeConfig ? { name: tenant!.name, config: activeConfig } : undefined}
            onSubmit={handleSubmit}
            loading={loading}
          />

          <Divider />
          <VersionHistory tenantId={id} onRollback={loadTenant} />

          <Divider />
          {activeConfig && <ClaimTester tenantId={id} config={activeConfig} />}
        </>
      )}
    </Flex>
  )
}
