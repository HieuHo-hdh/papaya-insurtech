import type { ThemeConfig } from 'antd'

export const DEFAULT_PRIMARY = '#0D9488'
export const DEFAULT_SECONDARY = '#2DD4BF'

export function buildTheme(primaryColor?: string, secondaryColor?: string): ThemeConfig {
  return {
    token: {
      colorPrimary: primaryColor || DEFAULT_PRIMARY,
      colorLink: primaryColor || DEFAULT_PRIMARY,
      colorInfo: secondaryColor || DEFAULT_SECONDARY,
      borderRadius: 8,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    components: {
      Layout: {
        headerBg: '#ffffff',
        bodyBg: '#F9FAFB',
      },
      Menu: {
        darkItemBg: '#134e4a',
        darkItemSelectedBg: primaryColor || DEFAULT_PRIMARY,
        darkItemHoverBg: '#0f3d3a',
        darkSubMenuItemBg: '#134e4a',
      },
    },
  }
}
