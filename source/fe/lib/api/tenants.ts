import { apiClient } from './client'
import type { TenantConfig } from '@/shared/types'

export interface VersionRow {
  id: string
  tenantId: string
  version: number
  config: TenantConfig
  isActive: boolean
  createdAt: string
}

export interface TenantRow {
  id: string
  name: string
  createdAt: string
  configs: { config: TenantConfig; version: number; isActive: boolean; createdAt: string }[]
}

export interface PaginatedTenants {
  data: TenantRow[]
  total: number
  page: number
  pageSize: number
}

export const tenantsApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedTenants>(`/tenants?page=${page}&pageSize=${pageSize}`),

  getById: (id: string) =>
    apiClient.get<TenantRow>(`/tenants/${id}`),

  create: (name: string, config: TenantConfig) =>
    apiClient.post<TenantRow>('/tenants', { name, config }),

  update: (id: string, config: TenantConfig) =>
    apiClient.put<TenantRow>(`/tenants/${id}`, { config }),

  remove: (id: string) =>
    apiClient.delete<null>(`/tenants/${id}`),

  listVersions: (id: string, page = 1, pageSize = 20) =>
    apiClient.get<{ data: VersionRow[]; total: number; page: number; pageSize: number }>(
      `/tenants/${id}/versions?page=${page}&pageSize=${pageSize}`
    ),

  getVersion: (id: string, versionId: string) =>
    apiClient.get<VersionRow>(`/tenants/${id}/versions/${versionId}`),

  rollback: (id: string, versionId: string) =>
    apiClient.post<TenantRow>(`/tenants/${id}/rollback/${versionId}`, {}),
}
