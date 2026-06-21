import type { TenantConfig, ClaimType } from '@/shared/types'
import { AppError } from '@/utils/AppError'

export const resolveDocuments = (
  config: TenantConfig,
  claimType: ClaimType,
): { requiredDocuments: string[]; optionalDocuments: string[] } => {
  const claimConfig = config.claimTypes[claimType]

  if (!claimConfig?.enabled) {
    throw new AppError(400, `Claim type ${claimType} is not enabled for this tenant`)
  }

  return {
    requiredDocuments: claimConfig.requiredDocuments,
    optionalDocuments: claimConfig.optionalDocuments,
  }
}
