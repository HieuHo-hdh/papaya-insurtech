# T004: calculateSlaDeadline

**Module:** M5 · process-claim-engine
**Story:** S4
**Tags:** BE
**Status:** done
**Size:** M

## Description
Implement `be/src/engine/calculateSlaDeadline.ts` — counts forward N business days from `submittedAt`, skipping non-weekdays and holidays, in the tenant's timezone. Returns an ISO string.

## Detail

```typescript
// be/src/engine/calculateSlaDeadline.ts
import dayjs from '@/config/dayjs'   // always import from config/dayjs, NOT from 'dayjs'
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
```

**Key implementation notes:**

1. **Always import dayjs from `@/config/dayjs`** — plugins (utc, timezone, customParseFormat) must already be extended. Direct `import dayjs from 'dayjs'` will fail silently at `.tz()` calls.

2. **Day-of-week matching:** `dayjs().format('ddd')` returns `'Mon'`, `'Tue'`, etc. After `.toUpperCase()` → `'MON'`, `'TUE'` — matches the `Weekday` enum values exactly.

3. **Holiday matching:** `current.format('YYYY-MM-DD')` produces the date string in the tenant's timezone (since `current` is a timezone-aware dayjs object). This is correct — a holiday declared as `2024-12-25` means that calendar date in the tenant's local timezone, not UTC.

4. **Business day counting:** Start from `submittedAt` (exclusive — day 0 is the submission day, not a counted business day). Count forward one day at a time.

5. **Timezone:** `dayjs(submittedAt).tz(timezone)` converts the UTC submission timestamp to the tenant's local timezone before counting. The returned ISO string is in UTC (`.toISOString()`) regardless.

**Test cases to verify:**
- SafeGuard OUTPATIENT (5 business days, Mon–Fri, no holidays): submitted Monday → deadline is next Monday (skips Sat/Sun)
- GovHealth (15 business days, Mon–Fri, no holidays): submitted Monday → deadline is 3 weeks later on Monday
- Holiday scenario: if 3 of the 5 business days are holidays, need 8 calendar days (Mon–Fri) to count 5 business days

## Expectation
`calculateSlaDeadline(safeguardConfig, 'OUTPATIENT', new Date('2024-01-01T09:00:00Z'))` — Jan 1 is Monday → deadline is Jan 8 (Monday), skipping Jan 6 (Sat) and Jan 7 (Sun). Returns ISO string.

## Acceptance Criteria
- [ ] Returns ISO string in correct format
- [ ] Skips days not in `weekdays[]`
- [ ] Skips dates in `holidays[]`
- [ ] Counts exactly `perClaimType[claimType]` business days
- [ ] Throws `AppError(400)` if claimType has no SLA entry in `perClaimType`
- [ ] Uses `@/config/dayjs` (not direct `dayjs` import)
- [ ] Timezone-aware: counts days in tenant's local timezone, not UTC
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none
- Blocks: T007

## References
- Architecture: SLA Deadline Calculation; `sla` config shape (timezone, weekdays, holidays, perClaimType)
- Standards: dayjs — always import from `@/config/dayjs`
