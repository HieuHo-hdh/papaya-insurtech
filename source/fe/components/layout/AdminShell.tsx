'use client'

import { Layout, Menu, Typography, Flex } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { clearToken } from '@/lib/api/auth'

const { Sider, Header, Content } = Layout

const NAV_ITEMS = [
  { key: '/tenants', label: 'Tenants' },
  { key: '/diff',    label: 'Config Diff' },
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    clearToken()
    router.push('/login')
  }

  const selectedKey = NAV_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? ''

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <Flex className="p-4 border-b border-gray-100">
          <Typography.Title level={5} style={{ margin: 0 }}>Papaya Admin</Typography.Title>
        </Flex>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Flex justify="flex-end" align="center" style={{ height: '100%' }}>
            <Typography.Link onClick={handleLogout}>Logout</Typography.Link>
          </Flex>
        </Header>
        <Content style={{ padding: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
