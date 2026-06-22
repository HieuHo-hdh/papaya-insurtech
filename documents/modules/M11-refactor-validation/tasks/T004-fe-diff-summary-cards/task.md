# T004: FE — DiffPage: Tenant Summary Cards + Cross-Exclude Dropdowns

**Module:** M11 · refactor-validation
**Story:** S4
**Tags:** FE
**Status:** done
**Size:** M

## Description
Add tenant summary cards that appear once both tenants are selected (before Compare), and prevent the same tenant from being chosen on both sides by cross-filtering the dropdown options.

## Detail

**File:** `source/fe/pages/DiffPage.tsx`

No API changes needed. `TenantRow[]` is already fetched into `tenants` state and includes `.configs[0].config.branding` and `.configs[0].config.claimTypes`.

---

### 1. Cross-exclude dropdown options

Currently both selects share the same `tenantOptions`. Split them:

```typescript
const optionsForA = tenantOptions.filter((o) => o.value !== tenantB)
const optionsForB = tenantOptions.filter((o) => o.value !== tenantA)
```

Pass `optionsForA` to Tenant A `<Select>` and `optionsForB` to Tenant B `<Select>`. The Compare button `disabled` guard `tenantA === tenantB` can be removed once cross-exclusion is in place (it's now impossible to pick the same tenant), but keep it as a safety fallback.

---

### 2. Tenant summary cards

Render a `<Row gutter={16}>` with two `<Col>` (each `span={12}`) between the selection card and the Compare button — visible only when both `tenantA` and `tenantB` are defined.

Each card is an Ant Design `<Card size="small">` containing:

| Element | Source |
|---|---|
| Company name (bold) | `.configs[0]?.config.branding.companyName` |
| Primary color swatch | 16×16 `<div>` styled with `backgroundColor: primaryColor` + hex label |
| Secondary color swatch | same pattern |
| Enabled claim types | `Object.entries(claimTypes).filter([,v] => v.enabled).map([ct] => <Tag color={CLAIM_TYPE_COLORS[ct]}>{ct}</Tag>)` |

The `CLAIM_TYPE_COLORS` map is already defined in `TenantForm.tsx` — copy it into `DiffPage.tsx` (do not import from TenantForm to avoid coupling a page to a form component).

Guard each data access: if tenant has no active config (`.configs[0]` undefined), show `<Typography.Text type="secondary">No active config</Typography.Text>` inside the card.

Card visual treatment:
- Tenant A card: `borderColor: '#3B82F6'` (blue — matches the existing diff highlight color)
- Tenant B card: `borderColor: '#14B8A6'` (cyan — matches existing diff highlight)

---

### Layout position

```
[ Select Card (existing) ]
[ Summary Cards Row ]        ← new, shown when both tenants selected
[ Compare button row ]       ← move button out of Select Card into its own row
```

Wait — the existing layout has the Compare button inside the same `<Card>` as the selects. Keep the button inside the select card for now (it already works), and insert the summary cards **between** the select card and the diff results area.

Render condition: `{tenantA && tenantB && ( <Row>...</Row> )}`

## Expectation
- Selecting tenant A removes it from tenant B's dropdown options (and vice versa)
- Both tenants selected → two side-by-side summary cards appear showing company name, colors, enabled claim types
- Tenant with no active config shows graceful fallback text in its card
- Existing diff flow (Compare → Table) unchanged

## Acceptance Criteria
- [ ] Tenant A option excluded from Tenant B dropdown when A is selected
- [ ] Tenant B option excluded from Tenant A dropdown when B is selected
- [ ] Summary cards appear when both tenants are selected (before Compare is clicked)
- [ ] Each card shows: company name, primary color swatch, secondary color swatch, enabled claim type tags
- [ ] No active config → graceful fallback message inside card
- [ ] Card border colors match existing diff highlight colors (blue / cyan)
- [ ] No raw HTML for layout — Ant Design Row/Col/Card/Tag used
- [ ] Compare button behavior and diff table unchanged

## Dependencies
- Depends on: T001 (done)
- Blocks: none

## References
- Architecture: `documents/planning/architecture.md` — Diff page, config comparison
- Standards: `documents/planning/coding-standards.md` — FE: no raw HTML for layout

## Questions

## QA Report
