import type { TenantConfig, CustomField } from '@/shared/types'

export const resolveCustomFields = (config: TenantConfig): CustomField[] =>
  config.customFields
