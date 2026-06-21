import { App, ConfigProvider } from 'antd'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { buildTheme } from '@/lib/theme'

interface ThemeContextValue {
  setPrimaryColor: (color: string) => void
  setSecondaryColor: (color: string) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  setPrimaryColor: () => {},
  setSecondaryColor: () => {},
  resetTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function AntdProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState<string | undefined>()
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>()

  const resetTheme = () => {
    setPrimaryColor(undefined)
    setSecondaryColor(undefined)
  }

  return (
    <ThemeContext.Provider value={{ setPrimaryColor, setSecondaryColor, resetTheme }}>
      <ConfigProvider theme={buildTheme(primaryColor, secondaryColor)}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
