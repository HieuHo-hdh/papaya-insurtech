# T003: FE — VersionHistory: Config Preview Drawer

**Module:** M11 · refactor-validation
**Story:** S3
**Tags:** FE
**Status:** done
**Size:** M

## Description
Add a "Preview" button to each non-active version row in `VersionHistory` that fetches and displays the version's config in a read-only Ant Design Drawer before the user decides to roll back.

## Detail

**File:** `source/fe/components/tenants/VersionHistory.tsx`

### Why
Users currently see only version number + timestamp. Rolling back is irreversible (creates a new version) — users should be able to inspect a config before committing.

### API
`tenantsApi.getVersion(tenantId, versionId)` already exists and returns `VersionRow` (`{ id, version, config: TenantConfig, isActive, createdAt }`). No new endpoint needed.

### Drawer content — structured read-only summary (NOT raw JSON, NOT full TenantForm)

Render inside an Ant Design `<Drawer title="Config Preview — v{N}" width={640}>`:

**Section 1 — Branding**
- Company name, logo URL (if present), primary/secondary color swatches (small colored `<div>` blocks)

**Section 2 — Claim Types**
- For each enabled claim type: `<Tag color={CLAIM_TYPE_COLORS[ct]}>{ct}</Tag>` + list of requiredDocuments

**Section 3 — Approval Rules**
- Auto-approval threshold (formatted number)
- Tiers table: columns Tier Name | Greater Than | Smaller Than | Primary

**Section 4 — SLA**
- Timezone, weekdays (tags), per-claim-type days (small table)

**Section 5 — Custom Fields**
- If none: "None configured". If present: table with Name | Label | Type | Required columns.

Use Ant Design `<Descriptions>`, `<Tag>`, and `<Table>` — no raw HTML for layout per coding standards.

### State additions
```typescript
const [previewVersion, setPreviewVersion] = useState<VersionRow | null>(null)
const [previewLoading, setPreviewLoading] = useState(false)

const handlePreview = async (record: VersionRow) => {
  setPreviewLoading(true)
  const res = await tenantsApi.getVersion(tenantId, record.id)
  if (isSuccess(res.code) && res.data) setPreviewVersion(res.data)
  setPreviewLoading(false)
}
```

### Column addition
Add a "Preview" column (eye icon button, `<EyeOutlined />`) before the existing "Action" column. Active version row: show preview button too (user may want to inspect current config). Rollback button stays on non-active rows only.

### Drawer close
`onClose={() => setPreviewVersion(null)}` — clears state, Drawer unmounts content.

## Expectation
- Clicking the eye icon on any version row shows a structured Drawer with that version's config
- Drawer renders branding, enabled claim types, approval rules, SLA, custom fields
- Closing the Drawer clears state with no console errors
- No raw JSON displayed anywhere in the Drawer

## Acceptance Criteria
- [ ] Eye icon button present on every version row (active and non-active)
- [ ] Click fetches the version via `tenantsApi.getVersion` and opens Drawer
- [ ] Drawer shows all 5 config sections in structured read-only format
- [ ] Loading state shown on the eye button while fetching
- [ ] Closing the Drawer resets `previewVersion` to null
- [ ] Existing rollback behavior unchanged
- [ ] No raw HTML used for layout inside the Drawer (Ant Design components only)

## Dependencies
- Depends on: T001 (done)
- Blocks: none

## References
- Architecture: `documents/planning/architecture.md` — Config versions, immutable append-only
- Standards: `documents/planning/coding-standards.md` — FE: no raw HTML for text/layout, Ant Design components

## Questions

## QA Report
