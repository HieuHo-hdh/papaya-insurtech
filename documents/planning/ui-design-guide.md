# UI Design Guide — Papaya Admin

**Stack:** Next.js 16 · Ant Design 6.4 · Tailwind v4  
**Audience:** FE developer redesigning the existing screens  
**Goal:** Modern, user-friendly, responsive admin UI — no new dependencies beyond what is already installed

---

## 0. Ant Design 6.4 Reference

This section documents what changed in AntD 6.x and the exact API patterns to use. Read this before writing any component.

### 0.1 What Changed from AntD 5 → 6

| Area | AntD 5 (old) | AntD 6.4 (current) |
|------|-------------|---------------------|
| Global context | `message.useMessage()` per component | `App.useApp()` from nearest `<App>` |
| Statistic color | `valueStyle={{ color }}` | `styles={{ content: { color } }}` |
| Dropdown trigger | `overlay={<Menu />}` | `menu={{ items: [...] }}` |
| Collapse panels | `<Collapse.Panel key title>` children | `<Collapse items={[{ key, label, children }]} />` |
| Steps items | `<Steps.Step title>` children | `<Steps items={[{ title, description }]} />` |
| Drawer inner styles | `bodyStyle={{ }}` `headerStyle={{ }}` | `styles={{ body: {}, header: {}, mask: {} }}` |
| Modal inner styles | `bodyStyle={{ }}` | `styles={{ body: {}, header: {}, footer: {} }}` |
| PageHeader | `<PageHeader>` (removed in 5) | Use `<Flex>` manually |
| Grid breakpoints | `import useBreakpoint from 'antd/es/grid/hooks/useBreakpoint'` | `const { useBreakpoint } = Grid` then `useBreakpoint()` |
| Menu dark bg | manual inline style | theme `components.Menu.darkItemBg` token |
| Layout bg tokens | `siderBg` / `triggerBg` in components | `bodyBg` / `headerBg` in `components.Layout` |

### 0.2 `<App>` — Global Context (mandatory wrapper)

Place `<App>` once inside `<ConfigProvider>` so any descendant can call `App.useApp()`:

```tsx
// AntdProvider.tsx
<ConfigProvider theme={...}>
  <App>
    {children}
  </App>
</ConfigProvider>
```

In any component, get all three feedback APIs from the nearest `<App>`:

```tsx
import { App } from 'antd'

function MyComponent() {
  const { message, notification, modal } = App.useApp()

  // message — transient toast
  message.success('Saved!')
  message.error('Failed', 3)   // 3 second duration

  // notification — persistent panel (top-right by default)
  notification.success({ message: 'Saved', description: 'Config v3 created.' })
  notification.error({ message: 'Error', description: err.message, duration: 0 })

  // modal — imperative confirm dialog
  modal.confirm({ title: 'Delete?', onOk: handleDelete })
}
```

> **Why not `message.useMessage()`?**  
> It requires `{contextHolder}` rendered in JSX. With `App.useApp()` the context is injected once at the `<App>` boundary — no per-component context holder needed.

### 0.3 `Statistic` — Style Tokens

`valueStyle` is **removed** in AntD 6. Use `styles`:

```tsx
// ❌ AntD 5 (broken in 6)
<Statistic valueStyle={{ color: '#16A34A' }} value={42} />

// ✅ AntD 6
<Statistic styles={{ content: { color: '#16A34A', fontWeight: 600 } }} value={42} />
```

All sub-element style overrides follow the same `styles` object pattern:

```tsx
// Available keys: title | content
<Statistic
  styles={{
    title:   { fontSize: 13, color: '#6B7280' },
    content: { fontSize: 28, fontWeight: 700, color: '#4F46E5' },
  }}
/>
```

### 0.4 `Dropdown` — Menu Prop

```tsx
// ❌ AntD 4 (removed)
<Dropdown overlay={<Menu items={[...]} />}>

// ✅ AntD 6
<Dropdown
  menu={{
    items: [
      { key: '1', label: 'Profile', icon: <UserOutlined /> },
      { key: '2', label: 'Sign out', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
    ],
  }}
  placement="bottomRight"
>
  <Button>Admin</Button>
</Dropdown>
```

Item shape: `{ key, label, icon?, danger?, disabled?, onClick?, children? }`.  
Use `type: 'divider'` for a separator and `type: 'group'` for a labeled group.

### 0.5 `Collapse` — Items API

```tsx
// ❌ AntD 4 / early 5
<Collapse>
  <Collapse.Panel key="1" header="Title">content</Collapse.Panel>
</Collapse>

// ✅ AntD 6
<Collapse
  defaultActiveKey={['1']}
  items={[
    {
      key:      '1',
      label:    'Title',           // replaces header
      children: <p>content</p>,
      extra:    <EditOutlined />,  // optional right-side element
    },
  ]}
/>
```

Useful props: `accordion` (only one open at a time), `size="small"`, `ghost` (no background/border).

### 0.6 `Steps` — Items API

```tsx
// ❌ AntD 4
<Steps current={1}>
  <Steps.Step title="Done" />
  <Steps.Step title="In Progress" status="process" />
</Steps>

// ✅ AntD 6
<Steps
  current={1}
  items={[
    { title: 'Done',        description: 'Completed on Mon' },
    { title: 'In Progress', description: 'Est. 2h',         status: 'process' },
    { title: 'Pending',     description: 'Blocked',         status: 'wait'    },
  ]}
/>
```

Per-item `status` overrides the global `current`-based auto-status.  
Valid statuses: `'wait' | 'process' | 'finish' | 'error'`.  
Use `direction="vertical" size="small"` for compact vertical flows (e.g. approval tiers).

### 0.7 `Drawer` — Styles Prop

```tsx
// ❌ AntD 5 (deprecated props)
<Drawer bodyStyle={{ padding: 0 }} headerStyle={{ background: '#1e1b4b' }}>

// ✅ AntD 6
<Drawer
  styles={{
    body:   { padding: 0, background: '#1e1b4b' },
    header: { background: '#4338CA', borderBottom: '1px solid #3730a3' },
    mask:   { backdropFilter: 'blur(2px)' },
  }}
>
```

Same pattern applies to `Modal`:
```tsx
<Modal styles={{ body: { padding: '24px' }, header: { borderBottom: 'none' } }}>
```

### 0.8 `Grid.useBreakpoint()` — Correct Import

```tsx
// ❌ Deep import (may break with bundler tree-shaking)
import useBreakpoint from 'antd/es/grid/hooks/useBreakpoint'

// ✅ AntD 6 — destructure from Grid
import { Grid } from 'antd'
const { useBreakpoint } = Grid

// Inside component:
const screens = useBreakpoint()
// screens.xs / screens.sm / screens.md / screens.lg / screens.xl / screens.xxl
const isMobile = !screens.md
```

### 0.9 Theme Token System (`ConfigProvider`)

Full structure of `ThemeConfig`:

```ts
import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    // Global semantic tokens
    colorPrimary:        '#4F46E5',
    colorSuccess:        '#16A34A',
    colorWarning:        '#D97706',
    colorError:          '#DC2626',
    colorInfo:           '#0284C7',
    colorTextBase:       '#111827',
    colorBgBase:         '#FFFFFF',
    borderRadius:        8,
    fontFamily:          'Inter, -apple-system, sans-serif',
    fontSize:            14,
    lineHeight:          1.5715,
  },
  components: {
    // Per-component token overrides
    Layout: {
      headerBg:       '#ffffff',
      bodyBg:         '#F9FAFB',
      siderBg:        '#1e1b4b',
    },
    Menu: {
      darkItemBg:          '#1e1b4b',
      darkItemSelectedBg:  '#4F46E5',
      darkItemHoverBg:     '#312e81',
      darkSubMenuItemBg:   '#1e1b4b',
      darkItemColor:       '#c7d2fe',
      darkItemSelectedColor: '#ffffff',
    },
    Button: {
      borderRadius: 8,
    },
    Card: {
      borderRadius: 12,
    },
    Table: {
      headerBg:       '#F9FAFB',
      rowHoverBg:     '#F5F3FF',
      borderColor:    '#E5E7EB',
    },
  },
  algorithm: undefined,  // or theme.darkAlgorithm for full dark mode
}
```

Tenant-specific branding overrides only `colorPrimary` and `colorInfo` (via `useTenantTheme` hook).

### 0.10 `Flex` Component

`<Flex>` is the preferred layout primitive in AntD 6 (replaces `<Space>` for most cases):

```tsx
// Horizontal row, centered
<Flex align="center" gap={12}>...</Flex>

// Vertical stack
<Flex vertical gap={16}>...</Flex>

// Space-between header bar
<Flex justify="space-between" align="center">...</Flex>

// Wrap on overflow
<Flex wrap="wrap" gap={8}>...</Flex>
```

Use `<Space>` only when you need `size="large"` preset or `split` separator. For everything else, prefer `<Flex>`.

### 0.11 `Form` — Key Patterns in AntD 6

```tsx
// Watch a field reactively (re-renders only on that field change)
const value = Form.useWatch(['section', 'field'], form)

// Programmatic field value set
form.setFieldValue(['nested', 'path'], newValue)

// Full values read
const all = form.getFieldsValue()

// Validate specific fields only
await form.validateFields(['email', 'password'])

// Set field-level errors manually (e.g. from server)
form.setFields([{ name: 'email', errors: ['Already in use'] }])
```

`valuePropName` for non-standard inputs:
```tsx
<Form.Item name="active" valuePropName="checked">  {/* Switch, Checkbox */}
<Form.Item name="file"   valuePropName="fileList">  {/* Upload */}
```

### 0.12 Common Gotchas

| Gotcha | Safe pattern |
|--------|-------------|
| `<Tag>` inside `<Flex>` adds unwanted margin | Add `style={{ margin: 0 }}` to each `<Tag>` |
| `<Table>` borders look odd without explicit `style` | Add `style={{ background: '#fff', borderRadius: 8 }}` to `<Table>` |
| `Steps` items `content` key does nothing | Use `description` (not `content`) |
| `Collapse` `header` prop on item | Renamed to `label` in AntD 6 |
| `message.useMessage()` `contextHolder` forgotten | Use `App.useApp()` instead to avoid this entirely |
| `Grid.useBreakpoint()` returns `{}` on first render (SSR) | Guard: `const isMobile = screens.md === false` (not `!screens.md` on first render) |
| `ColorPicker` value is a `Color` object, not a hex string | Use `onChange={(_, hex) => setFieldValue(path, hex)}` to store as string |
| `Form.Item` with `noStyle` still renders a `<div>` | Use `noStyle` + `style={{ display: 'contents' }}` if the wrapper div breaks layout |
| `Statistic` `valueStyle` silently ignored | Use `styles={{ content: { ... } }}` |

---

## 1. Design Tokens

### Color Palette

Define these in `fe/lib/theme.ts` as the default Ant Design token overrides (passed to `ConfigProvider`):

```ts
export const DEFAULT_THEME_TOKENS = {
  colorPrimary:   '#4F46E5',   // indigo-600 — primary actions, active nav
  colorSuccess:   '#16A34A',   // green-600
  colorWarning:   '#D97706',   // amber-600
  colorError:     '#DC2626',   // red-600
  colorInfo:      '#0284C7',   // sky-600
  borderRadius:   8,
  fontFamily:     'Inter, -apple-system, sans-serif',
}
```

Page background: `bg-gray-50` (`#F9FAFB`).  
Card/panel background: `bg-white`.  
Border color: `border-gray-200` (`#E5E7EB`).

### Spacing Scale

Always use Tailwind spacing. Map Ant Design `gap` props to the same scale:

| Use case                | Tailwind          | AntD gap |
|-------------------------|-------------------|----------|
| Inside a card           | `p-6`             | —        |
| Between page sections   | `gap-6`           | 24       |
| Between form items      | default Form item | —        |
| Between inline elements | `gap-2` / `gap-3` | 8 / 12   |
| Page horizontal padding | `px-6` on Content | 24       |

### Typography

Use `Typography.*` from Ant Design exclusively — no raw `<h1>` or `<p>`.

| Role               | Component                              |
|--------------------|----------------------------------------|
| Page title         | `<Typography.Title level={4}>`         |
| Section title      | `<Typography.Title level={5}>`         |
| Card subtitle/hint | `<Typography.Text type="secondary">`   |
| Inline code path   | `<Typography.Text code>`               |
| Clickable name     | `<Typography.Link>`                    |
| Body text          | `<Typography.Text>`                    |

---

## 2. Layout System

### Admin Shell — `components/layout/AdminShell.tsx`

**Current:** plain white sider + header.  
**Target:** dark sider with brand identity; header with breadcrumbs + user area.

```
┌─────────────────────────────────────────────────────┐
│  ███ LOGO  │  Breadcrumb                  👤 Admin ▾ │  ← Header (h-14, white, shadow-sm)
│  ─────────  │                                         │
│  🏢 Tenants │                                         │
│  ⚖ Diff    │          <children>                     │
│            │                                         │
│   [footer] │                                         │
└─────────────────────────────────────────────────────┘
```

Key changes:
- `Sider theme="dark"` width `220`; add a logo block at top with gradient `bg-indigo-600` text
- Replace plain `<Typography.Link onClick={logout}>` with `<Dropdown>` menu (Profile / Logout)
- Add `<Breadcrumb>` in the Header using `usePathname()` to auto-generate items
- `Content` gets `bg-gray-50 min-h-screen p-6`
- Add `Footer` at bottom of Sider with version number in `text-xs text-gray-500`

```tsx
// Sider logo block
<div className="h-14 flex items-center px-5 bg-indigo-700">
  <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
    🍍 Papaya Admin
  </Typography.Title>
</div>
```

Menu icon map (use Ant Design icons):
```tsx
import { TeamOutlined, DiffOutlined } from '@ant-design/icons'

const NAV_ITEMS = [
  { key: '/tenants', label: 'Tenants',     icon: <TeamOutlined /> },
  { key: '/diff',    label: 'Config Diff', icon: <DiffOutlined /> },
]
```

Header user area:
```tsx
<Dropdown menu={{ items: [{ key: 'logout', label: 'Sign out', danger: true, onClick: handleLogout }] }}>
  <Flex align="center" gap={8} className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg">
    <Avatar size="small" className="bg-indigo-600">A</Avatar>
    <Typography.Text strong>Admin</Typography.Text>
    <DownOutlined className="text-xs text-gray-400" />
  </Flex>
</Dropdown>
```

### Responsive — Mobile Sider

Wrap Sider in a `<Drawer>` on screens < `md`. Use `useBreakpoint()` from `Grid` (see §0.8):

```tsx
const { useBreakpoint } = Grid
const screens = useBreakpoint()
const isMobile = screens.md === false  // guard against undefined on first render

// Render sider as Drawer on mobile; fixed Sider on desktop
```

Add a hamburger `<Button icon={<MenuOutlined />}>` in the Header shown only on mobile.

---

## 3. Login Page — `app/(auth)/login/page.tsx`

**Current:** centered card on gray background.  
**Target:** split-screen layout.

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   Brand panel       │   Sign-in form      │
│   indigo bg         │   white bg          │
│   logo + tagline    │   email + password  │
│                     │   + Sign In button  │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

Implementation:
```tsx
<div className="min-h-screen flex">
  {/* Left — hidden on mobile */}
  <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-indigo-600 p-12 gap-6">
    <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>Papaya Admin</Typography.Title>
    <Typography.Text style={{ color: '#c7d2fe', textAlign: 'center' }}>
      Multi-tenant insurance configuration platform
    </Typography.Text>
  </div>

  {/* Right — full width on mobile */}
  <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 bg-white">
    <div className="w-full max-w-sm">
      <Typography.Title level={3} className="mb-8">Sign in</Typography.Title>
      <Form ... />
    </div>
  </div>
</div>
```

Form tweaks:
- Remove outer `<Card>` — the white right panel is the card
- Keep `size="large"` on inputs
- Add a loading `Spin` overlay on submit instead of just button loading state

---

## 4. Tenant List — `app/(admin)/tenants/page.tsx`

**Current:** title + table only.  
**Target:** summary stats → search bar → table with richer rows.

### 4.1 Stats Row

Three `<Statistic>` cards above the table:

```tsx
<Row gutter={[16, 16]} className="mb-6">
  <Col xs={24} sm={8}>
    <Card>
      <Statistic title="Total Tenants" value={total} prefix={<TeamOutlined />} />
    </Card>
  </Col>
  <Col xs={24} sm={8}>
    <Card>
      <Statistic title="Active Configs" value={total} styles={{ content: { color: '#16A34A' } }} />
    </Card>
  </Col>
  <Col xs={24} sm={8}>
    <Card>
      <Statistic title="Claim Types Covered" value={5} suffix="/ 5" />
    </Card>
  </Col>
</Row>
```

### 4.2 Action Bar

Replace the simple title/button `<Flex>` with a toolbar row:

```tsx
<Flex justify="space-between" align="center" className="mb-4" wrap="wrap" gap={12}>
  <Input.Search
    placeholder="Search tenants…"
    allowClear
    style={{ width: 280 }}
    onChange={(e) => setSearch(e.target.value)}
  />
  <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/tenants/new')}>
    New Tenant
  </Button>
</Flex>
```

### 4.3 Table Columns

Make rows clickable (`onRow`); add an avatar with company initials:

```tsx
{
  title: 'Tenant',
  render: (_, record) => (
    <Flex align="center" gap={12}>
      <Avatar style={{ backgroundColor: '#4F46E5' }}>
        {record.name.charAt(0).toUpperCase()}
      </Avatar>
      <Flex vertical gap={2}>
        <Typography.Text strong>{record.name}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.id}</Typography.Text>
      </Flex>
    </Flex>
  ),
},
```

Add a `<Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>` status column.

Table `onRow`:
```tsx
onRow={(record) => ({ onClick: () => router.push(`/tenants/${record.id}`), className: 'cursor-pointer' })}
```

Remove the separate "Edit" button from actions (row click handles it). Keep only the Popconfirm Delete.

---

## 5. Tenant Detail — `app/(admin)/tenants/[id]/page.tsx`

**Current:** linear vertical flex — Form → Divider → History → Divider → ClaimTester.  
**Target:** sticky page header + Tabs layout.

### 5.1 Page Header

```tsx
<PageHeader> // Use Flex as AntD 6 removed PageHeader
<Flex align="center" justify="space-between" className="mb-6 pb-4 border-b border-gray-200">
  <Flex align="center" gap={12}>
    <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/tenants')} />
    <Flex vertical gap={2}>
      <Typography.Title level={4} style={{ margin: 0 }}>{tenant?.name}</Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Tenant ID: {id}</Typography.Text>
    </Flex>
  </Flex>
  {/* Save button moved here from inside TenantForm */}
  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => form.submit()}>
    Save Config
  </Button>
</Flex>
```

### 5.2 Tabs Layout

Replace the three linear sections with `<Tabs>`:

```tsx
<Tabs
  defaultActiveKey="config"
  items={[
    {
      key: 'config',
      label: <span><SettingOutlined /> Configuration</span>,
      children: <TenantForm ... />,
    },
    {
      key: 'history',
      label: <span><HistoryOutlined /> Version History</span>,
      children: <VersionHistory tenantId={id} onRollback={loadTenant} />,
    },
    {
      key: 'tester',
      label: <span><ExperimentOutlined /> Claim Tester</span>,
      children: activeConfig ? <ClaimTester tenantId={id} config={activeConfig} /> : null,
      disabled: !activeConfig,
    },
  ]}
/>
```

---

## 6. TenantForm — `components/tenants/TenantForm.tsx`

**Current:** flat vertical form dump.  
**Target:** sectioned cards with icons and sticky save footer.

### 6.1 Section Card Pattern

Wrap each logical group in a `<Card>` with a title using an icon:

```tsx
<Card
  title={
    <Flex align="center" gap={8}>
      <BgColorsOutlined style={{ color: '#4F46E5' }} />
      <Typography.Text strong>Branding</Typography.Text>
    </Flex>
  }
  className="mb-4"
>
  {/* branding fields */}
</Card>
```

Sections and their icons:
| Section         | Icon                    |
|----------------|-------------------------|
| Branding        | `BgColorsOutlined`      |
| Claim Types     | `FileProtectOutlined`   |
| Approval Rules  | `AuditOutlined`         |
| Notifications   | `BellOutlined`          |
| SLA             | `ClockCircleOutlined`   |
| Custom Fields   | `FormOutlined`          |

### 6.2 Claim Types — Card Grid

Replace vertical list with a `<Row gutter={[12,12]}` of claim type cards:

```tsx
<Row gutter={[12, 12]}>
  {ALL_CLAIM_TYPES.map((type) => (
    <Col xs={24} sm={12} key={type}>
      <Card
        size="small"
        style={{ borderColor: enabled ? '#4F46E5' : '#E5E7EB', background: enabled ? '#EEF2FF' : '#fff' }}
      >
        <Flex justify="space-between" align="center">
          <Typography.Text strong>{type}</Typography.Text>
          <Form.Item name={['claimTypes', type, 'enabled']} valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
        {/* document fields below the toggle */}
      </Card>
    </Col>
  ))}
</Row>
```

### 6.3 Approval Tiers — Visual Table

Use `<Form.List name={['approvalRules', 'approvalTiers']}>` with `<Table>` instead of repeated `<Space>` blocks:

Each tier row should show: **Tier name** | **Range (> X ≤ Y)** | **Primary** | **Delete**.

### 6.4 Notifications — Collapse

Group each event into a `<Collapse>` panel so the form stays compact:

```tsx
<Collapse
  items={NOTIFICATION_EVENTS.map((event) => ({
    key: event,
    label: <Flex align="center" gap={8}><Tag>{event}</Tag><Typography.Text type="secondary">…channels configured</Typography.Text></Flex>,
    children: <NotificationEventFields event={event} />,
  }))}
/>
```

---

## 7. Config Diff — `app/(admin)/diff/page.tsx`

**Current:** card + table.  
**Target:** VS Code-inspired diff viewer.

### 7.1 Selection Area

Use `<Steps>` progress indicator above the selects to make the flow obvious:

```
① Pick Tenant A  →  ② Pick Tenant B  →  ③ Compare
```

```tsx
<Steps
  current={tenantA && tenantB ? 2 : tenantA ? 1 : 0}
  size="small"
  className="mb-6"
  items={[
    { title: 'Tenant A', description: nameA },
    { title: 'Tenant B', description: nameB },
    { title: 'Result', description: `${diffs.length} diffs` },
  ]}
/>
```

### 7.2 Diff Table — Row-Level Coloring

Add `rowClassName` to highlight changed rows:

```tsx
rowClassName={() => 'bg-amber-50 hover:bg-amber-100'} // all rows are diffs
```

Add a category filter above the table using `<Segmented>` or `<Select mode="multiple">` to filter by path prefix (e.g. `branding`, `approvalRules`, `sla`):

```tsx
const categories = [...new Set(diffs.map((d) => d.path.split('.')[0]))]
<Select
  mode="multiple"
  placeholder="Filter by section…"
  options={categories.map((c) => ({ label: c, value: c }))}
  onChange={setFilter}
  allowClear
  style={{ width: 300 }}
/>
```

### 7.3 DiffValue Enhancement

Wrap the entire diff row to show a subtle left border for changed values:

```tsx
// In the valueA / valueB cell, add a wrapper:
<div style={{ borderLeft: `3px solid ${highlight === 'a' ? '#3B82F6' : '#8B5CF6'}`, paddingLeft: 8 }}>
  {/* existing DiffValue content */}
</div>
```

---

## 8. Claim Tester — `components/claims/ClaimTester.tsx`

**Current:** form on top, Descriptions result below.  
**Target:** two-column split: form left, live result right.

### 8.1 Two-Column Layout

```tsx
<Row gutter={[24, 24]}>
  <Col xs={24} lg={10}>
    <Card title={<span><FormOutlined /> Test Input</span>}>
      {/* Form */}
    </Card>
  </Col>
  <Col xs={24} lg={14}>
    <Card title={<span><CheckCircleOutlined /> Result</span>}>
      {result ? <ClaimResult result={result} /> : (
        <Empty description="Submit a claim to see results" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  </Col>
</Row>
```

### 8.2 ClaimResult — Enhanced Display

Replace flat Descriptions with metric cards + timeline:

```tsx
// SLA as a Statistic
<Statistic
  title="SLA Deadline"
  value={dayjs(result.slaDeadline).format('DD MMM YYYY HH:mm')}
  prefix={<ClockCircleOutlined />}
  styles={{ content: { color: '#D97706' } }}
/>

// Approval as Steps
{result.approvalTiers.length === 0
  ? <Result status="success" title="Auto-approved" subTitle="Below auto-approval threshold" />
  : <Steps direction="vertical" items={
        result.approvalTiers.map((t, i) => ({
          title: t.tier, status: 'process', icon: <AuditOutlined />
        }))
      }
    />
}

// Required Docs as Checklist
<List
    dataSource={result.requiredDocuments}
  renderItem={(doc) => (
    <List.Item>
      <CheckCircleOutlined style={{ color: '#16A34A', marginRight: 8 }} />
      {doc}
    </List.Item>
  )}
/>
```

---

## 9. Loading & Empty States

### Skeleton Loading

Replace `<Spin>` page-level loaders with `<Skeleton>` that matches the layout:

```tsx
// Tenants table loading
{loading
  ? <Skeleton active paragraph={{ rows: 8 }} />
  : <Table ... />
}

// Tenant detail page loading
{fetching
  ? <Flex vertical gap={16}><Skeleton active /><Skeleton active /></Flex>
  : <Tabs ... />
}
```

### Empty States

Always provide an action in the `<Empty>`:

```tsx
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description="No tenants yet"
>
  <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/tenants/new')}>
    Create your first tenant
  </Button>
</Empty>
```

---

## 10. Notification / Feedback

Replace all `messageApi.success/error` toast calls with more contextual feedback:

| Event                  | Component                                 |
|------------------------|-------------------------------------------|
| Save success           | `notification.success` (top-right, 4s)   |
| Save error             | `notification.error` with description    |
| Delete confirm result  | `message.success` (transient, 2s)         |
| Validation error       | `Alert` inline above the form submit btn |
| Network error          | `Result status="error"` full-page        |

Use `App.useApp()` from Ant Design 6 to avoid multiple context holders:

```tsx
// In layout.tsx:
<App>
  {children}
</App>

// In any component:
const { message, notification } = App.useApp()
```

---

## 11. Responsive Breakpoints

Use Ant Design's `useBreakpoint()` hook alongside Tailwind responsive classes:

| Screen | Tailwind prefix | Behavior                              |
|--------|-----------------|---------------------------------------|
| < 768px  | (default)     | Sider → Drawer; single-col forms     |
| ≥ 768px  | `md:`         | Sider visible; 2-col claim tester    |
| ≥ 1024px | `lg:`         | Full layout; stat cards in 3-col row |

Form `layout` prop: `vertical` always (safe for all widths).  
`<Row gutter>` with `xs={24} sm={12} lg={8}` for multi-column card grids.  
`<Table scroll={{ x: 600 }}>` on all tables so they scroll horizontally on mobile.

---

## 12. File Change Summary

| File | Change |
|------|--------|
| `components/layout/AdminShell.tsx` | Dark sider, breadcrumb, avatar dropdown, mobile drawer |
| `app/(auth)/login/page.tsx` | Split-screen layout |
| `app/(admin)/tenants/page.tsx` | Stats row, search bar, avatar columns, row click |
| `app/(admin)/tenants/[id]/page.tsx` | Page header with back btn, Tabs layout |
| `components/tenants/TenantForm.tsx` | Section cards with icons, claim type grid, collapse notifications |
| `app/(admin)/diff/page.tsx` | Steps progress, category filter, row coloring |
| `components/claims/ClaimTester.tsx` | Two-column layout, Statistic + Steps result |
| `app/layout.tsx` | Wrap with `<App>` for unified notification context |
| `lib/theme.ts` | Add `DEFAULT_THEME_TOKENS` with indigo primary |
