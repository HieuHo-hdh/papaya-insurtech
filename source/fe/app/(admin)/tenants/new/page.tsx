'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Flex, message } from 'antd'
import { TenantForm, assembleConfig } from '@/components/tenants/TenantForm'
import { TenantConfigSchema } from '@/shared/schemas'
import { tenantsApi } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import { hasToken } from '@/lib/api/auth'
import type { TenantConfig } from '@/shared/types'

export default function NewTenantPage() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hasToken()) router.push('/login')
  }, [router])

  const handleSubmit = async (name: string, config: TenantConfig) => {
    const parsed = TenantConfigSchema.safeParse(config)
    if (!parsed.success) {
      const msgs = parsed.error.issues.map((i) => i.message).join('; ')
      messageApi.error(`Validation failed: ${msgs}`)
      return
    }

    setLoading(true)
    const res = await tenantsApi.create(name, parsed.data)
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
