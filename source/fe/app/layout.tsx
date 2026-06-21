import type { Metadata } from 'next'
import { AntdProvider } from '@/components/providers/AntdProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Insurance Config Platform',
  description: 'Multi-tenant insurance configuration admin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  )
}
