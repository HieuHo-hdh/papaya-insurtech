import type { ThemeConfig } from 'antd'

const PRIMARY = '#0D9488'
const SECONDARY = '#2DD4BF'

export function buildTheme(): ThemeConfig {
  return {
    token: {
      colorPrimary: PRIMARY,
      colorLink: PRIMARY,
      colorInfo: SECONDARY,
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
        darkItemSelectedBg: PRIMARY,
        darkItemHoverBg: '#0f3d3a',
        darkSubMenuItemBg: '#134e4a',
      },
    },
  }
}
