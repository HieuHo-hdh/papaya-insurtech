import { useEffect } from 'react'
import { useTheme } from '@/components/providers/AntdProvider'
import type { TenantConfig } from '@/shared/types'

export function useTenantTheme(config: TenantConfig | null | undefined) {
  const { setPrimaryColor, setSecondaryColor, resetTheme } = useTheme()

  useEffect(() => {
    if (!config) return
    setPrimaryColor(config.branding.primaryColor)
    setSecondaryColor(config.branding.secondaryColor)
    return () => resetTheme()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.branding.primaryColor, config?.branding.secondaryColor])
}
