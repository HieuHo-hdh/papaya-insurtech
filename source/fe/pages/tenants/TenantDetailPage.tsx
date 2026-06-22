import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { updateTenantInList } from '@/store/slices/tenantsSlice'
import { Typography, Flex, message, Button, Tabs, Tag, Skeleton } from 'antd'
import {
  ArrowLeftOutlined,
  SettingOutlined,
  HistoryOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { TenantForm } from '@/components/tenants/TenantForm'
import { VersionHistory } from '@/components/tenants/VersionHistory'
import { ClaimTester } from '@/components/claims/ClaimTester'
import { tenantsApi, type TenantRow } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import { hasToken } from '@/lib/api/auth'
import type { TenantConfig } from '@/shared/types'

export default function TenantDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [messageApi, contextHolder] = message.useMessage()
  const [tenant, setTenant] = useState<TenantRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const activeConfig = tenant?.configs[0]?.config ?? null

  const loadTenant = () => {
    tenantsApi.getById(id).then((res) => {
      if (isSuccess(res.code) && res.data) setTenant(res.data)
      else messageApi.error('Failed to load tenant')
      setFetching(false)
    })
  }

  useEffect(() => {
    if (!hasToken()) {
      navigate('/login')
      return
    }
    loadTenant()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (_name: string, config: TenantConfig) => {
    setLoading(true)
    const res = await tenantsApi.update(id, config)
    if (isSuccess(res.code) && res.data) {
      dispatch(updateTenantInList(res.data))
      messageApi.success('Config saved as new version')
      navigate('/tenants')
    } else {
      messageApi.error(res.message || 'Failed to save')
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
            <Flex align="center" gap={8}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {fetching ? '…' : (tenant?.name ?? 'Tenant')}
              </Typography.Title>
              {!fetching && activeConfig && (
                <Tag color="green" style={{ margin: 0 }}>
                  Active
                </Tag>
              )}
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ID: {id}
            </Typography.Text>
          </Flex>
        </Flex>
      </Flex>

      {fetching ? (
        <Flex vertical gap={16}>
          <Skeleton active />
          <Skeleton active />
        </Flex>
      ) : (
        <Tabs
          defaultActiveKey="config"
          size="large"
          items={[
            {
              key: 'config',
              label: (
                <Flex align="center" gap={6}>
                  <SettingOutlined />
                  Configuration
                </Flex>
              ),
              children: (
                <div style={{ paddingTop: 16 }}>
                  <TenantForm
                    initialValues={
                      activeConfig ? { name: tenant!.name, config: activeConfig } : undefined
                    }
                    onSubmit={handleSubmit}
                    loading={loading}
                  />
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <Flex align="center" gap={6}>
                  <HistoryOutlined />
                  Version History
                </Flex>
              ),
              children: (
                <div style={{ paddingTop: 16 }}>
                  <VersionHistory tenantId={id} onRollback={loadTenant} />
                </div>
              ),
            },
            {
              key: 'tester',
              label: (
                <Flex align="center" gap={6}>
                  <ExperimentOutlined />
                  Claim Tester
                </Flex>
              ),
              disabled: !activeConfig,
              children: activeConfig ? (
                <div style={{ paddingTop: 16 }}>
                  <ClaimTester tenantId={id} config={activeConfig} />
                </div>
              ) : null,
            },
          ]}
        />
      )}
    </Flex>
  )
}
