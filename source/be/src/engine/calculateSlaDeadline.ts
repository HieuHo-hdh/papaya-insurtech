import dayjs from '@/config/dayjs'
import type { TenantConfig, ClaimType } from '@/shared/types'
import { AppError } from '@/utils/AppError'

export const calculateSlaDeadline = (
  config: TenantConfig,
  claimType: ClaimType,
  submittedAt: Date,
): string => {
  const { timezone, weekdays, holidays, perClaimType } = config.sla
  const businessDaysRequired = perClaimType[claimType]

  if (!businessDaysRequired) {
    throw new AppError(400, `No SLA configured for claim type ${claimType}`)
  }

  const holidaySet = new Set(holidays)
  let current = dayjs(submittedAt).tz(timezone)
  let counted = 0

  while (counted < businessDaysRequired) {
    current = current.add(1, 'day')
    const dayAbbr = current.format('ddd').toUpperCase() as typeof weekdays[number]
    const dateStr = current.format('YYYY-MM-DD')

    if (weekdays.includes(dayAbbr) && !holidaySet.has(dateStr)) {
      counted++
    }
  }

  return current.toISOString()
}
