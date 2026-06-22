import { App, ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { buildTheme } from '@/lib/theme'

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={buildTheme()}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
