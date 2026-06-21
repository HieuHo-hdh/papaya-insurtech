import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AntdProvider } from '@/components/providers/AntdProvider'
import AdminShell from '@/components/layout/AdminShell'
import LoginPage from '@/pages/LoginPage'
import TenantsPage from '@/pages/tenants/TenantsPage'
import NewTenantPage from '@/pages/tenants/NewTenantPage'
import TenantDetailPage from '@/pages/tenants/TenantDetailPage'
import DiffPage from '@/pages/DiffPage'

export default function App() {
  return (
    <BrowserRouter>
      <AntdProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminShell />}>
            <Route index element={<Navigate to="/tenants" replace />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/new" element={<NewTenantPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
            <Route path="/diff" element={<DiffPage />} />
          </Route>
        </Routes>
      </AntdProvider>
    </BrowserRouter>
  )
}
