import { apiClient } from './client'
import type { DiffResponse } from '@/shared/types'

export const diffApi = {
  compare: (tenantIdA: string, tenantIdB: string) =>
    apiClient.get<DiffResponse>(`/diff?a=${tenantIdA}&b=${tenantIdB}`),
}
