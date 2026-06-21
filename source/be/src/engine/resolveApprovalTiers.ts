import type { TenantConfig } from '@/shared/types'

export const resolveApprovalTiers = (
  config: TenantConfig,
  amount: number,
): { tier: string }[] => {
  const { autoApprovalThreshold, approvalTiers } = config.approvalRules

  if (amount <= autoApprovalThreshold) return []

  const matched = approvalTiers.filter((t) => {
    const aboveFloor = t.greaterThan === undefined || amount > t.greaterThan
    const belowCeiling = t.smallerThan === undefined || amount <= t.smallerThan
    return !t.isPrimary && aboveFloor && belowCeiling
  })

  if (matched.length === 0) {
    const primary = approvalTiers.find((t) => t.isPrimary)
    return primary ? [{ tier: primary.tier }] : []
  }

  return matched.map((t) => ({ tier: t.tier }))
}
