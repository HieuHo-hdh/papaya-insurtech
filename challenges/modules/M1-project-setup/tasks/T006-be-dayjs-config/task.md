# T006: BE dayjs Config Module

**Module:** M1 · project-setup
**Story:** S6
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Create `be/src/config/dayjs.ts` that extends dayjs with UTC, timezone, and customParseFormat plugins — the single import point for all date operations in the BE.

## Detail
Create `challenges/be/src/config/dayjs.ts`:
```typescript
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

export default dayjs
```

Install required dayjs type declarations if needed (`@types/dayjs` is bundled with dayjs itself — no extra install needed).

Import this module at the top of `be/src/index.ts` (after env but before app) so plugins are registered once at startup:
```typescript
import './config/dayjs'
```

All other BE files that use dates must import from `@/config/dayjs`, never directly from `'dayjs'`. Add an ESLint rule (if ESLint is set up) or a comment in the file noting this convention.

## Expectation
Any BE file that imports `@/config/dayjs` can use `dayjs().tz('Asia/Ho_Chi_Minh')` and `dayjs('2024-01-01', 'YYYY-MM-DD')` without runtime errors.

## Acceptance Criteria
- [ ] `be/src/config/dayjs.ts` exists and exports extended dayjs
- [ ] `dayjs().tz('Asia/Ho_Chi_Minh').format()` works without throwing
- [ ] `dayjs('01-01-2024', 'MM-DD-YYYY').isValid()` returns true
- [ ] `be/src/index.ts` imports dayjs config before app startup
- [ ] No direct `import dayjs from 'dayjs'` in any file other than `config/dayjs.ts`

## Dependencies
- Depends on: T002
- Blocks: none (M5 engine tasks will depend on this)

## References
- Architecture: SLA Deadline Calculation (timezone, weekdays, holidays)
- Standards: dayjs — import once, extend once at app entry
