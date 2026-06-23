import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Flex, Button, message, Divider } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { TenantForm } from '@/components/tenants/TenantForm'
import { tenantsApi } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { addTenant } from '@/store/slices/tenantsSlice'
import type { TenantConfig } from '@/shared/types'

export default function NewTenantPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (name: string, config: TenantConfig) => {
    setLoading(true)
    const res = await tenantsApi.create(name, config)
    if (isSuccess(res.code) && res.data) {
      dispatch(addTenant(res.data))
      messageApi.success('Tenant created')
      navigate('/tenants')
    } else {
      messageApi.error(res.message || 'Failed to create tenant')
      setLoading(false)
    }
  }

  return (
    <Flex vertical gap={0}>
      {contextHolder}

      {/* Page header */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 20 }}>
        <Flex align="center" gap={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tenants')} />
          <Flex vertical gap={2}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              New Tenant
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Configure a new insurance tenant
            </Typography.Text>
          </Flex>
        </Flex>
      </Flex>

      <Divider style={{ margin: '0 0 20px' }} />

      <TenantForm onSubmit={handleSubmit} loading={loading} />
    </Flex>
  )
}
