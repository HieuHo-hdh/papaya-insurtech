import { useState } from 'react'
import {
  Layout,
  Menu,
  Typography,
  Flex,
  Avatar,
  Dropdown,
  Breadcrumb,
  Drawer,
  Button,
  Grid,
} from 'antd'
import {
  TeamOutlined,
  DiffOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { clearToken } from '@/lib/api/auth'

const { Sider, Header, Content } = Layout
const { useBreakpoint } = Grid

const NAV_ITEMS = [
  { key: '/tenants', label: 'Tenants', icon: <TeamOutlined /> },
  { key: '/diff', label: 'Config Diff', icon: <DiffOutlined /> },
]

function useBreadcrumbs(pathname: string) {
  if (pathname === '/tenants') return [{ title: 'Tenants' }]
  if (pathname === '/tenants/new')
    return [{ title: 'Tenants', href: '/tenants' }, { title: 'New Tenant' }]
  if (pathname.startsWith('/tenants/'))
    return [{ title: 'Tenants', href: '/tenants' }, { title: 'Edit Config' }]
  if (pathname === '/diff') return [{ title: 'Config Diff' }]
  return []
}

export default function AdminShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  const selectedKey = NAV_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? ''
  const breadcrumbs = useBreadcrumbs(pathname)

  const siderNav = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={NAV_ITEMS}
      onClick={({ key }) => {
        navigate(key)
        setDrawerOpen(false)
      }}
      style={{ border: 'none' }}
    />
  )

  const logoBlock = (
    <Flex align="center" style={{ height: 56, padding: '0 20px', background: '#0f766e' }}>
      <Typography.Title level={5} style={{ margin: 0, color: '#fff', letterSpacing: '-0.01em' }}>
        🍍 Papaya Admin
      </Typography.Title>
    </Flex>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider theme="dark" width={220} style={{ background: '#134e4a' }}>
          <Flex vertical style={{ height: '100%' }}>
            {logoBlock}
            <div style={{ flex: 1 }}>{siderNav}</div>
            <div style={{ padding: '12px 20px' }}>
              <Typography.Text style={{ fontSize: 11, color: '#2DD4BF' }}>v1.0.0</Typography.Text>
            </div>
          </Flex>
        </Sider>
      )}

      <Drawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        size={220}
        closable={false}
        styles={{ body: { padding: 0, background: '#134e4a' } }}
      >
        {logoBlock}
        {siderNav}
      </Drawer>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #E5E7EB',
            height: 56,
            lineHeight: 'unset',
          }}
        >
          <Flex justify="space-between" align="center" style={{ height: '100%' }}>
            <Flex align="center" gap={12}>
              {isMobile && (
                <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
              )}
              <Breadcrumb items={breadcrumbs} />
            </Flex>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    label: 'Sign out',
                    icon: <LogoutOutlined />,
                    danger: true,
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Flex
                align="center"
                gap={8}
                style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 8 }}
                className="hover:bg-gray-50"
              >
                <Avatar style={{ background: '#0D9488' }} icon={<UserOutlined />} />
                <Typography.Text strong style={{ fontSize: 14 }}>
                  Admin
                </Typography.Text>
                <DownOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />
              </Flex>
            </Dropdown>
          </Flex>
        </Header>

        <Content style={{ padding: 24, background: '#F9FAFB', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
