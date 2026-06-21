import { apiClient } from './client'
import type { ProcessClaimResult, ClaimData } from '@/shared/types'

export const claimsApi = {
  process: (tenantId: string, claimData: ClaimData) =>
    apiClient.post<ProcessClaimResult>(`/tenants/${tenantId}/process-claim`, claimData),
}
