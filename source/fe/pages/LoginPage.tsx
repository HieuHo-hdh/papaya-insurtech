import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, Flex, message } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { authApi, saveToken, hasToken } from '@/lib/api/auth'
import { LoginSchema } from '@/shared/schemas'
import { isSuccess } from '@/lib/api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (hasToken()) navigate('/tenants', { replace: true })
  }, [navigate])

  const onFinish = async (values: { email: string; password: string }) => {
    const parsed = LoginSchema.safeParse(values)
    if (!parsed.success) {
      form.setFields(
        (Object.entries(parsed.error.flatten().fieldErrors) as [string, string[]][]).map(
          ([name, errors]) => ({ name, errors }),
        ),
      )
      return
    }

    const res = await authApi.login(parsed.data.email, parsed.data.password)
    if (isSuccess(res.code) && res.data?.token) {
      saveToken(res.data.token)
      navigate('/tenants')
    } else {
      messageApi.error(res.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex">
      {contextHolder}

      {/* Left brand panel — hidden on mobile */}
      <div
        className="hidden md:flex flex-col justify-center items-center w-1/2 p-12 gap-6"
        style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}
      >
        <Typography.Title level={1} style={{ color: '#fff', margin: 0, fontSize: 40 }}>
          🍍
        </Typography.Title>
        <Flex vertical align="center" gap={8}>
          <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
            Papaya Admin
          </Typography.Title>
          <Typography.Text style={{ color: '#c7d2fe', textAlign: 'center', fontSize: 16 }}>
            Multi-tenant insurance configuration platform
          </Typography.Text>
        </Flex>
        <Flex vertical gap={12} style={{ marginTop: 24 }}>
          {[
            'Zero-code tenant onboarding',
            'Live config diff & versioning',
            'Real-time claim simulation',
          ].map((f) => (
            <Flex key={f} align="center" gap={8}>
              <span style={{ color: '#a5b4fc', fontSize: 16 }}>✓</span>
              <Typography.Text style={{ color: '#e0e7ff' }}>{f}</Typography.Text>
            </Flex>
          ))}
        </Flex>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="md:hidden text-center mb-8">
            <Typography.Title level={3} style={{ margin: 0 }}>
              🍍 Papaya Admin
            </Typography.Title>
          </div>

          <Flex vertical gap={8} style={{ marginBottom: 32 }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Sign in
            </Typography.Title>
            <Typography.Text type="secondary">Enter your credentials to continue</Typography.Text>
          </Flex>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
                type="email"
                placeholder="admin@papaya.dev"
              />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="••••••••"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block>
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  )
}
