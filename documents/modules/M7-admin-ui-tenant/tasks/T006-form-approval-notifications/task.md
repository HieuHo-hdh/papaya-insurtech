# T006: Tenant Form — Approval Rules + Notifications Sections

**Module:** M6 · admin-ui-tenant
**Story:** S6, S7
**Tags:** FE
**Status:** done
**Size:** M

## Description
Add Approval Rules and Notifications sections to the shared `TenantForm` component.

## Detail

### Approval Rules section (add to `TenantForm.tsx`)

```tsx
{/* ── Approval Rules ───────────────────────────────── */}
<Card title="Approval Rules" style={{ marginBottom: 16 }}>
  <Form.Item
    label="Auto-Approval Threshold (≥ 0)"
    name={['approvalRules', 'autoApprovalThreshold']}
    rules={[{ required: true, type: 'number', min: 0 }]}
  >
    <InputNumber style={{ width: '100%' }} min={0} placeholder="20000" />
  </Form.Item>

  <Typography.Text strong>Approval Tiers</Typography.Text>
  <Form.List name={['approvalRules', 'approvalTiers']}>
    {(fields, { add, remove }) => (
      <>
        {fields.map(({ key, name }) => (
          <Card key={key} size="small" style={{ marginTop: 8 }}>
            <Flex gap={8} wrap="wrap" align="flex-end">
              <Form.Item label="Tier Name" name={[name, 'tier']} rules={[{ required: true }]} style={{ flex: 1, minWidth: 120 }}>
                <Input placeholder="assessor" />
              </Form.Item>
              <Form.Item label="Greater Than" name={[name, 'greaterThan']} style={{ flex: 1, minWidth: 100 }}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="20000" />
              </Form.Item>
              <Form.Item label="Smaller Than" name={[name, 'smallerThan']} style={{ flex: 1, minWidth: 100 }}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="50000" />
              </Form.Item>
              <Form.Item label="Is Primary (catch-all)" name={[name, 'isPrimary']} valuePropName="checked" style={{ flex: 0 }}>
                <Switch />
              </Form.Item>
              <Button danger size="small" onClick={() => remove(name)}>Remove</Button>
            </Flex>
          </Card>
        ))}
        <Button style={{ marginTop: 8 }} onClick={() => add({ tier: '', isPrimary: false })}>
          + Add Tier
        </Button>
      </>
    )}
  </Form.List>
</Card>
```

**Validation rules to enforce:**
- At least one tier must have `isPrimary: true` — show field-level error if none set
- All tier `greaterThan` values must exceed `autoApprovalThreshold` — cross-field validation via `TenantConfigSchema` in T008

---

### Notifications section (add to `TenantForm.tsx`)

```tsx
{/* ── Notifications ────────────────────────────────── */}
<Card title="Notifications" style={{ marginBottom: 16 }}>
  <Typography.Text type="secondary">
    Configure notification channels per event. Each row is one event × channel pair.
  </Typography.Text>

  {NOTIFICATION_EVENTS.map((event) => (
    <NotificationEventRow key={event} event={event} />
  ))}
</Card>
```

### `NotificationEventRow` sub-component

```tsx
const NOTIFICATION_EVENTS = ['claim_submitted', 'approved', 'rejected', 'payment_sent'] as const
const CHANNEL_OPTIONS = [
  { label: 'Email',   value: 'email'   },
  { label: 'SMS',     value: 'sms'     },
  { label: 'Webhook', value: 'webhook' },
]

function NotificationEventRow({ event }: { event: string }) {
  return (
    <Card size="small" style={{ marginBottom: 8 }} title={<Typography.Text code>{event}</Typography.Text>}>
      <Form.List name={['notifications_' + event, 'channels']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Flex key={key} gap={8} align="flex-end" style={{ marginBottom: 8 }}>
                <Form.Item label="Channel" name={[name, 'channel']} rules={[{ required: true }]} style={{ flex: 0, minWidth: 120 }}>
                  <Select options={CHANNEL_OPTIONS} placeholder="email" />
                </Form.Item>
                <Form.Item label="Template (optional)" name={[name, 'template']} style={{ flex: 1 }}>
                  <Input placeholder="https://webhook.url or message text" />
                </Form.Item>
                <Button danger size="small" onClick={() => remove(name)}>×</Button>
              </Flex>
            ))}
            <Button size="small" onClick={() => add({ channel: 'email' })}>+ Add Channel</Button>
          </>
        )}
      </Form.List>
    </Card>
  )
}
```

**Implementation note on notifications form state:**

The `TenantConfig.notifications` shape is an array: `[{ event, channels: [{channel, template?}] }]`. Representing this in Ant Design Form requires a path-per-event approach. Two options:

**Option A (recommended):** Store notifications flat in form state as `notifications_claim_submitted`, `notifications_approved`, etc., then reassemble in `handleFinish`:
```typescript
const notifications = NOTIFICATION_EVENTS.map((event) => ({
  event,
  channels: values[`notifications_${event}`]?.channels ?? [],
})).filter((n) => n.channels.length > 0)
```

**Option B:** Use `Form.List` at the top level for notifications, then nested `Form.List` for channels. More complex to manage.

Use Option A — simpler and avoids deeply nested `Form.List` path management.

## Expectation
The form shows an Approval Rules card with InputNumber for threshold and a dynamic tier builder (add/remove rows with tier name, greaterThan, smallerThan, isPrimary switch). Notifications card shows one sub-card per event (4 total), each with an add/remove channel list and optional template input.

## Acceptance Criteria
- [ ] Approval Rules: `InputNumber` for autoApprovalThreshold
- [ ] Approval tiers: `Form.List` with add/remove; each row has tier name, greaterThan, smallerThan, isPrimary Switch
- [ ] Notifications: 4 event sub-cards, each with a channel list (add/remove)
- [ ] Channel has Select (email/sms/webhook) + optional template Input
- [ ] Form values correctly assembled into `TenantConfig.notifications` array in `handleFinish`
- [ ] No raw HTML for text

## Dependencies
- Depends on: T005 (TenantForm shell)
- Blocks: T007, T008

## References
- Architecture: TenantConfig JSONB Shape — `approvalRules`, `notifications`
- Standards: Ant Design Form.List for dynamic arrays; InputNumber for numeric fields; Select for enums
