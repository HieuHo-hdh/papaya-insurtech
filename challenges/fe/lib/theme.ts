import type { ThemeConfig } from 'antd'

export const DEFAULT_PRIMARY = '#1677ff'
export const DEFAULT_SECONDARY = '#4096ff'

export function buildTheme(primaryColor?: string, secondaryColor?: string): ThemeConfig {
  return {
    token: {
      colorPrimary: primaryColor || DEFAULT_PRIMARY,
      colorLink: primaryColor || DEFAULT_PRIMARY,
      colorInfo: secondaryColor || DEFAULT_SECONDARY,
      borderRadius: 6,
    },
    components: {
      Layout: {
        siderBg: '#ffffff',
        headerBg: '#ffffff',
      },
    },
  }
}
