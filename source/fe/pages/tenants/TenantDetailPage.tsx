import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import {
  updateTenantInList,
  fetchTenantDetail,
  setDetail,
  clearDetail,
} from '@/store/slices/tenantsSlice'
import { fetchVersions } from '@/store/slices/versionsSlice'
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
import { tenantsApi } from '@/lib/api/tenants'
import { isSuccess } from '@/lib/api/client'
import type { TenantConfig } from '@/shared/types'

export default function TenantDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [messageApi, contextHolder] = message.useMessage()
  const tenant = useAppSelector((s) => s.tenants.detail)
  const fetching = useAppSelector((s) => s.tenants.detailLoading)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('config')

  const activeConfig = tenant?.configs[0]?.config ?? null

  useEffect(() => {
    dispatch(fetchTenantDetail(id))
    return () => {
      dispatch(clearDetail())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (_name: string, config: TenantConfig) => {
    setLoading(true)
    const res = await tenantsApi.update(id, config)
    if (isSuccess(res.code) && res.data) {
      dispatch(setDetail(res.data))
      dispatch(updateTenantInList(res.data))
      dispatch(fetchVersions({ tenantId: id, page: 1 }))
      messageApi.success('Config saved as new version')
      setActiveTab('history')
    } else {
      messageApi.error(res.message || 'Failed to save')
    }
    setLoading(false)
  }

  const handleRollback = () => {
    dispatch(fetchTenantDetail(id))
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
          activeKey={activeTab}
          onChange={setActiveTab}
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
                  <VersionHistory tenantId={id} onRollback={handleRollback} />
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
