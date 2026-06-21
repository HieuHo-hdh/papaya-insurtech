# T003: resolveNotifications

**Module:** M5 · process-claim-engine
**Story:** S3
**Tags:** BE
**Status:** done
**Size:** S

## Description
Implement `be/src/engine/resolveNotifications.ts` — pure function that returns notification channels for a given event, with `{{variable}}` template interpolation.

## Detail

```typescript
// be/src/engine/resolveNotifications.ts
import type { TenantConfig, NotificationEvent } from '@/shared/types'

type TemplateVars = Partial<Record<
  'claimant_name' | 'claim_id' | 'claim_type' | 'amount' | 'sla_deadline' | 'tenant_name' | 'status',
  string
>>

export const resolveNotifications = (
  config: TenantConfig,
  event: NotificationEvent,
  vars: TemplateVars = {},
): { event: string; channels: string[]; template?: string }[] => {
  const notifConfig = config.notifications.find((n) => n.event === event)
  if (!notifConfig) return []

  return notifConfig.channels.map((ch) => ({
    event,
    channels: [ch.channel],
    ...(ch.template
      ? { template: interpolate(ch.template, vars) }
      : {}),
  }))
}

const interpolate = (template: string, vars: TemplateVars): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key as keyof TemplateVars] ?? `{{${key}}}`)
```

**Rules:**
- Return empty array if the event has no notification config
- Template variables: `{{claimant_name}}`, `{{claim_id}}`, `{{claim_type}}`, `{{amount}}`, `{{sla_deadline}}`, `{{tenant_name}}`, `{{status}}`
- Unresolved variables (not in `vars`) must be left as-is: `{{variable_name}}`
- Each channel entry in the response includes only its own channel string (not all channels)

**processClaim will call this for each of the 4 events** — the result is an array of per-channel notification descriptors.

## Expectation
- `resolveNotifications(safeguardConfig, 'claim_submitted')` → `[{ event: 'claim_submitted', channels: ['email'] }]`
- `resolveNotifications(healthfirstConfig, 'approved')` → `[{ event: 'approved', channels: ['email'] }, { event: 'approved', channels: ['sms'] }]`
- `resolveNotifications(govhealthConfig, 'approved', { tenant_name: 'GovHealth' })` → webhook channel with `{{tenant_name}}` replaced
- `resolveNotifications(config, 'payment_sent')` with no matching event → `[]`

## Acceptance Criteria
- [ ] Returns correct channels per event
- [ ] Unmatched event returns `[]`
- [ ] `{{variable}}` is interpolated when `vars` provided
- [ ] Unresolved `{{variable}}` left intact
- [ ] HealthFirst returns 2 entries (one per channel) for each event
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: none
- Blocks: T007

## References
- Architecture: Notification Template Variables; `notifications` config shape
- Standards: Engine — pure functions
