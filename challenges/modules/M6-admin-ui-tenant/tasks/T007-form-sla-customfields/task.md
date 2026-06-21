# T007: Tenant Form — SLA + Custom Fields Sections

**Module:** M6 · admin-ui-tenant
**Story:** S8, S9
**Tags:** FE
**Status:** done
**Size:** M

## Description
Add SLA and Custom Fields sections to the shared `TenantForm` component.

## Detail

### SLA section (add to `TenantForm.tsx`)

```tsx
import { Select, Checkbox, DatePicker, InputNumber } from 'antd'

const WEEKDAY_OPTIONS = ['MON','TUE','WED','THU','FRI','SAT','SUN'].map((d) => ({ label: d, value: d }))
const CLAIM_TYPE_OPTIONS: ClaimType[] = ['OUTPATIENT','INPATIENT','DENTAL','MATERNITY','OPTICAL']

const TIMEZONE_OPTIONS = [
  { label: 'Asia/Ho_Chi_Minh (GMT+7)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Asia/Bangkok (GMT+7)',      value: 'Asia/Bangkok'      },
  { label: 'Asia/Singapore (GMT+8)',    value: 'Asia/Singapore'    },
  { label: 'UTC',                       value: 'UTC'               },
  // add more as needed
]

{/* ── SLA ──────────────────────────────────────────── */}
<Card title="SLA" style={{ marginBottom: 16 }}>
  <Form.Item label="Timezone" name={['sla', 'timezone']} rules={[{ required: true }]}>
    <Select options={TIMEZONE_OPTIONS} showSearch placeholder="Asia/Ho_Chi_Minh" />
  </Form.Item>

  <Form.Item label="Business Days" name={['sla', 'weekdays']} rules={[{ required: true, type: 'array', min: 1 }]}>
    <Checkbox.Group options={WEEKDAY_OPTIONS} />
  </Form.Item>

  <Form.Item label="Holidays (skip dates)">
    <Form.List name={['sla', 'holidays']}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <Flex key={key} gap={8} style={{ marginBottom: 4 }}>
              <Form.Item name={name} noStyle rules={[{ pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'YYYY-MM-DD' }]}>
                <DatePicker
                  format="YYYY-MM-DD"
                  onChange={(_, dateStr) => {
                    const list = form.getFieldValue(['sla', 'holidays'])
                    list[name] = dateStr
                    form.setFieldValue(['sla', 'holidays'], list)
                  }}
                />
              </Form.Item>
              <Button danger size="small" onClick={() => remove(name)}>×</Button>
            </Flex>
          ))}
          <Button size="small" onClick={() => add('')}>+ Add Holiday</Button>
        </>
      )}
    </Form.List>
  </Form.Item>

  <Typography.Text strong>SLA Days Per Claim Type</Typography.Text>
  <Typography.Paragraph type="secondary">Set business days for each enabled claim type.</Typography.Paragraph>
  {CLAIM_TYPE_OPTIONS.map((ct) => (
    <Form.Item key={ct} label={ct} name={['sla', 'perClaimType', ct]}>
      <InputNumber min={1} placeholder="5" style={{ width: 120 }} />
    </Form.Item>
  ))}

  <Form.Item label="Escalation Contacts (emails)">
    <Form.List name={['sla', 'escalationContacts']}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <Flex key={key} gap={8} style={{ marginBottom: 4 }}>
              <Form.Item name={name} noStyle rules={[{ type: 'email', message: 'Must be a valid email' }]}>
                <Input placeholder="sla@company.com" style={{ width: 280 }} />
              </Form.Item>
              <Button danger size="small" onClick={() => remove(name)}>×</Button>
            </Flex>
          ))}
          <Button size="small" onClick={() => add('')}>+ Add Contact</Button>
        </>
      )}
    </Form.List>
  </Form.Item>
</Card>
```

**Notes on `perClaimType`:**
- Fields are optional — only include in the submitted config if value is present (`!== undefined`)
- In `handleFinish`, filter out undefined entries:
```typescript
const perClaimType = Object.fromEntries(
  Object.entries(values.sla.perClaimType ?? {}).filter(([, v]) => v !== undefined && v !== null)
)
```

---

### Custom Fields section (add to `TenantForm.tsx`)

```tsx
const FIELD_TYPE_OPTIONS = [
  { label: 'Text',      value: 'text'      },
  { label: 'Text Area', value: 'text_area' },
  { label: 'Number',    value: 'number'    },
  { label: 'DateTime',  value: 'date_time' },
  { label: 'Boolean',   value: 'boolean'   },
  { label: 'Select',    value: 'select'    },
]

{/* ── Custom Fields ────────────────────────────────── */}
<Card title="Custom Fields" style={{ marginBottom: 16 }}>
  <Form.List name="customFields">
    {(fields, { add, remove }) => (
      <>
        {fields.map(({ key, name }) => (
          <CustomFieldRow key={key} name={name} onRemove={() => remove(name)} />
        ))}
        <Button onClick={() => add({ name: '', label: '', required: false, type: 'text' })}>
          + Add Custom Field
        </Button>
      </>
    )}
  </Form.List>
</Card>
```

### `CustomFieldRow` sub-component

```tsx
function CustomFieldRow({ name, onRemove }: { name: number; onRemove: () => void }) {
  const form = Form.useFormInstance()
  const fieldType = Form.useWatch(['customFields', name, 'type'], form) ?? 'text'

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Flex gap={8} wrap="wrap" align="flex-end">
        <Form.Item label="Name (key)" name={[name, 'name']} rules={[{ required: true }]} style={{ flex: 1, minWidth: 120 }}>
          <Input placeholder="employee_id" />
        </Form.Item>
        <Form.Item label="Label (display)" name={[name, 'label']} rules={[{ required: true }]} style={{ flex: 1, minWidth: 120 }}>
          <Input placeholder="Employee ID" />
        </Form.Item>
        <Form.Item label="Type" name={[name, 'type']} rules={[{ required: true }]} style={{ flex: 0, minWidth: 120 }}>
          <Select options={FIELD_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item label="Required" name={[name, 'required']} valuePropName="checked" style={{ flex: 0 }}>
          <Switch />
        </Form.Item>
      </Flex>

      {/* Conditional constraints */}
      {(fieldType === 'text' || fieldType === 'text_area') && (
        <Form.Item label="Max Length" name={[name, 'maxLength']}>
          <InputNumber min={1} style={{ width: 120 }} />
        </Form.Item>
      )}
      {fieldType === 'number' && (
        <Flex gap={8}>
          <Form.Item label="Min" name={[name, 'min']}>
            <InputNumber style={{ width: 100 }} />
          </Form.Item>
          <Form.Item label="Max" name={[name, 'max']}>
            <InputNumber style={{ width: 100 }} />
          </Form.Item>
        </Flex>
      )}
      {fieldType === 'select' && (
        <Form.Item label="Options (comma-separated)" name={[name, 'options']}>
          <Input placeholder="option1, option2, option3" />
        </Form.Item>
      )}

      <Button danger size="small" onClick={onRemove}>Remove Field</Button>
    </Card>
  )
}
```

**Note on `select` options:** Store as comma-separated string in form input for simplicity. In `handleFinish`, split:
```typescript
if (field.type === 'select' && typeof field.options === 'string') {
  field.options = field.options.split(',').map((s: string) => s.trim()).filter(Boolean)
}
```

## Expectation
The form shows an SLA card (timezone Select, weekday checkboxes, holiday date pickers, per-claim-type SLA InputNumbers, escalation email list) and a Custom Fields card (add/remove field rows with type-conditional constraint inputs).

## Acceptance Criteria
- [ ] SLA: timezone Select, Checkbox.Group for weekdays, DatePicker list for holidays
- [ ] SLA: InputNumber per claim type for business days (optional, only submitted if set)
- [ ] SLA: email list for escalation contacts
- [ ] Custom Fields: `Form.List` with add/remove rows
- [ ] Each custom field has name, label, type Select, required Switch
- [ ] Conditional constraints show based on type: maxLength for text/text_area, min/max for number, options input for select
- [ ] `select` options parsed from comma-separated string
- [ ] No raw HTML for text

## Dependencies
- Depends on: T005, T006 (TenantForm sections)
- Blocks: T008

## References
- Architecture: TenantConfig JSONB Shape — `sla`, `customFields`
- Standards: Ant Design DatePicker, Checkbox.Group, Select; Form.List for dynamic arrays
