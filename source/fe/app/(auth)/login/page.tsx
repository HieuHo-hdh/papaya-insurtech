'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Typography, Flex, message } from 'antd'
import { authApi, saveToken, hasToken } from '@/lib/api/auth'
import { LoginSchema } from '@/shared/schemas'
import { isSuccess } from '@/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (hasToken()) router.replace('/tenants')
  }, [router])

  const onFinish = async (values: { email: string; password: string }) => {
    const parsed = LoginSchema.safeParse(values)
    if (!parsed.success) {
      form.setFields(
        Object.entries(parsed.error.flatten().fieldErrors).map(([name, errors]) => ({
          name,
          errors: errors ?? [],
        }))
      )
      return
    }

    const res = await authApi.login(parsed.data.email, parsed.data.password)
    if (isSuccess(res.code) && res.data?.token) {
      saveToken(res.data.token)
      router.push('/tenants')
    } else {
      messageApi.error(res.message || 'Login failed')
    }
  }

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {contextHolder}
      <Card style={{ width: 400 }}>
        <Flex vertical gap={24}>
          <Typography.Title level={3} style={{ margin: 0, textAlign: 'center' }}>
            Papaya Admin
          </Typography.Title>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email is required' }]}>
              <Input type="email" placeholder="admin@papaya.dev" size="large" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password placeholder="••••••••" size="large" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Flex>
      </Card>
    </Flex>
  )
}
