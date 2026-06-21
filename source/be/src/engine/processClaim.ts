import { PrismaClient } from '@prisma/client'
import type { ClaimData, ProcessClaimResult, TenantConfig } from '@/shared/types'
import { AppError } from '@/utils/AppError'
import { resolveDocuments } from './resolveDocuments'
import { resolveApprovalTiers } from './resolveApprovalTiers'
import { resolveNotifications } from './resolveNotifications'
import { calculateSlaDeadline } from './calculateSlaDeadline'
import { resolveCustomFields } from './resolveCustomFields'
import { validateCustomFieldValues } from './validateCustomFieldValues'

const prisma = new PrismaClient()

export const processClaim = async (
  tenantId: string,
  claimData: ClaimData,
): Promise<ProcessClaimResult> => {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  const activeConfig = await prisma.tenantConfig.findFirst({
    where: { tenantId, isActive: true },
  })
  if (!activeConfig) throw new AppError(404, 'No active config for tenant')

  const config = activeConfig.config as unknown as TenantConfig
  const { claimType, amount, customFields: fieldValues } = claimData

  const customFieldDefs = resolveCustomFields(config)
  const fieldErrors = validateCustomFieldValues(fieldValues, customFieldDefs)

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError(400, 'Custom field validation failed', fieldErrors)
  }

  const submittedAt = new Date()

  return {
    requiredDocuments: resolveDocuments(config, claimType).requiredDocuments,
    approvalTiers: resolveApprovalTiers(config, amount),
    notifications: config.notifications.flatMap((n) =>
      resolveNotifications(config, n.event)
    ),
    slaDeadline: calculateSlaDeadline(config, claimType, submittedAt),
    customFieldsRequired: customFieldDefs,
  }
}
