# T003: FE — Human-Readable Labels for Events and Channels

**Module:** M12 · ux-improvements
**Story:** S3
**Tags:** FE
**Status:** pending
**Size:** S

## Description
Replace raw enum strings (`claim_submitted`, `email`, `sms`, `webhook`) with human-readable display labels wherever they appear in the UI.

## Detail

Add display maps to a shared constants location — or inline where used. The two places that need updating:

### 1. `source/fe/components/tenants/TenantForm.tsx` — Notifications section

The notification section currently renders event names as accordion/collapse labels using the raw string. Update the `Collapse` items' `label` prop:

```typescript
const EVENT_LABELS: Record<NotificationEvent, string> = {
  claim_submitted: 'Claim Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  payment_sent: 'Payment Sent',
}
```

The channel Select options already use `CHANNEL_OPTIONS` with `{ label: 'Email', value: 'email' }` etc. — those are already correct. No change needed there.

### 2. `source/fe/components/claims/ClaimTester.tsx`

The ClaimTester renders `processClaim` result including notification events. Apply the same `EVENT_LABELS` map to display labels.

### 3. Any other location where raw event strings are rendered as visible text

Check: DiffPage renders raw path strings (e.g. `notifications.0.event`) — those are config paths, not display labels. Leave those as-is (they're technical identifiers in a diff context).

## Expectation
- TenantForm notification section headers show "Claim Submitted", "Approved", "Rejected", "Payment Sent"
- ClaimTester result shows human-readable event names
- Raw strings still used as form field values (not changed) — only display text changes

## Acceptance Criteria
- [ ] Notification collapse labels in TenantForm show human-readable event names
- [ ] ClaimTester result notification events rendered with human-readable labels
- [ ] `EVENT_LABELS` map defined once and reused across both files
- [ ] No change to underlying form values or API payloads

## Dependencies
- Depends on: none
- Blocks: none

## References
- Standards: `documents/planning/coding-standards.md` — FE: display labels vs. values
