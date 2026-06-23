import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'
const EMAIL = 'admin@papaya.dev'
const PASSWORD = 'Admin@1234'

// Helper: login and get to /tenants
async function loginAndNavigate(page: Page) {
  await page.goto(BASE + '/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/tenants', { timeout: 15000 })
}

// Helper: clear auth token so we start fresh (keeps us on /login)
async function clearAuth(page: Page) {
  await page.goto(BASE + '/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForURL('**/login', { timeout: 10000 })
}

// Helper: click an Ant Design v6 Select (which uses .ant-select-content, not .ant-select-selector)
// and pick an option matching the given text
async function selectAntOption(page: Page, selectIndex: number, optionText: string | RegExp) {
  const selectContent = page.locator('.ant-select-content').nth(selectIndex)
  await selectContent.click()
  await page.waitForTimeout(300)
  const option = page.locator('.ant-select-item-option').filter({ hasText: optionText }).first()
  await option.click()
  await page.waitForTimeout(300)
}

test.describe('Papaya Admin UI - QA Test Suite', () => {

  // ─── Test 1: Navigate to / redirects to /login ───────────────────────────
  test('TC01: Navigate to / should redirect to /login', async ({ page }) => {
    // Clear any existing auth
    await page.goto(BASE + '/login')
    await page.evaluate(() => localStorage.clear())
    // Navigate to root
    await page.goto(BASE + '/')
    // Should end up at /login (because no token, AdminShell redirects)
    await page.waitForURL(/\/login/, { timeout: 15000 })
    expect(page.url()).toContain('/login')
  })

  // ─── Test 2: Login with wrong password shows error ────────────────────────
  test('TC02: Login wrong password shows error message', async ({ page }) => {
    // Navigate fresh to login page
    await page.goto(BASE + '/login')
    await page.evaluate(() => localStorage.clear())
    // Wait for the form to be fully rendered
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', 'WrongPassword123')
    await page.click('button[type="submit"]')
    // Ant Design v6: error message renders as .ant-message-notice-error (appears briefly ~3s)
    await page.waitForSelector('.ant-message-notice-error', {
      timeout: 10000,
      state: 'attached',
    })
    await expect(page.locator('.ant-message-notice-error').first()).toBeAttached({ timeout: 5000 })
  })

  // ─── Test 3: Login with valid credentials redirects to /tenants ───────────
  test('TC03: Login with admin credentials redirects to /tenants', async ({ page }) => {
    await clearAuth(page)
    await loginAndNavigate(page)
    expect(page.url()).toContain('/tenants')
  })

  // ─── Test 4: Tenants page shows at least 3 rows ───────────────────────────
  test('TC04: Tenants page shows at least 3 rows in the table', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })
    const rows = page.locator('.ant-table-tbody tr.ant-table-row')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  // ─── Test 5: Click "New Tenant" navigates to /tenants/new ────────────────
  test('TC05: Click New Tenant button navigates to /tenants/new', async ({ page }) => {
    await loginAndNavigate(page)
    await page.click('button:has-text("New Tenant")')
    await page.waitForURL('**/tenants/new', { timeout: 10000 })
    expect(page.url()).toContain('/tenants/new')
  })

  // ─── Test 6: Fill form and save new tenant "QA Test Tenant" ──────────────
  test('TC06: Fill and save new tenant QA Test Tenant shows success and navigates back', async ({ page }) => {
    await loginAndNavigate(page)
    await page.click('button:has-text("New Tenant")')
    await page.waitForURL('**/tenants/new', { timeout: 10000 })
    // Wait for form to render
    await page.waitForSelector('input[placeholder="e.g. SafeGuard"]', { timeout: 10000 })

    const tenantName = 'QA Test Tenant'

    // Tenant Name (in Branding card)
    await page.fill('input[placeholder="e.g. SafeGuard"]', tenantName)
    // Company Name
    await page.fill('input[placeholder="SafeGuard Insurance"]', 'QA Test Company')

    // Enable OUTPATIENT claim type
    // Each claim type is in its own ant-col > ant-card. The OUTPATIENT col has only OUTPATIENT tag.
    const outpatientCol = page.locator('.ant-col').filter({
      has: page.locator('.ant-tag', { hasText: /^OUTPATIENT$/ }),
    }).first()
    const outpatientCard = outpatientCol.locator('.ant-card')
    const outpatientSwitch = outpatientCard.locator('button.ant-switch').first()
    if (await outpatientSwitch.getAttribute('aria-checked') !== 'true') {
      await outpatientSwitch.click()
      await page.waitForTimeout(800) // Wait for required docs section to render
    }

    // Add a required document for OUTPATIENT (validation requires at least 1)
    const addDocBtn = outpatientCard.locator('button:has-text("Add")').first()
    await addDocBtn.click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder="e.g. Medical Report"]').first().fill('Medical Report')

    // Auto-approval threshold
    const thresholdInput = page.locator('input#approvalRules_autoApprovalThreshold')
    await thresholdInput.click({ clickCount: 3 })
    await thresholdInput.fill('5000')

    // Add one approval tier with Primary fallback enabled
    await page.click('button:has-text("Add Tier")')
    await page.waitForTimeout(500)
    await page.locator('input[placeholder="assessor"]').first().fill('assessor')

    // Enable "Primary fallback" switch on the tier
    const primarySwitch = page.locator('.ant-form-item').filter({
      has: page.locator('label[title="Primary fallback"]'),
    }).locator('button.ant-switch').first()
    if (await primarySwitch.getAttribute('aria-checked') !== 'true') {
      await primarySwitch.click()
      await page.waitForTimeout(200)
    }

    // SLA timezone: NOT pre-filled for new tenants — must explicitly select it
    // The timezone select content shows the placeholder "Asia/Ho_Chi_Minh" but isn't set in form
    const tzSelectContent = page.locator('.ant-select').filter({
      has: page.locator('input#sla_timezone'),
    }).locator('.ant-select-content')
    await tzSelectContent.click()
    await page.waitForTimeout(300)
    await page.locator('.ant-select-item-option').filter({ hasText: /Ho_Chi_Minh/ }).first().click()
    await page.waitForTimeout(300)

    // Scroll to bottom and submit
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await page.click('button:has-text("Save Configuration")')

    // Wait for redirect to /tenants
    await page.waitForURL('**/tenants', { timeout: 25000 })
    expect(page.url()).toContain('/tenants')
  })

  // ─── Test 7: New tenant "QA Test Tenant" appears in the list ─────────────
  test('TC07: New tenant QA Test Tenant appears in tenant list', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })
    const searchInput = page.locator('input[placeholder="Search tenants…"]')
    await searchInput.fill('QA Test Tenant')
    await page.waitForTimeout(600)
    const tenantRow = page.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: 'QA Test Tenant' })
    await expect(tenantRow.first()).toBeVisible({ timeout: 10000 })
  })

  // ─── Test 8: Click Edit on "QA Test Tenant" → detail page loads ──────────
  test('TC08: Click Edit on QA Test Tenant navigates to detail page with Configuration tab', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })
    await page.locator('input[placeholder="Search tenants…"]').fill('QA Test Tenant')
    await page.waitForTimeout(600)

    const tenantRow = page.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: 'QA Test Tenant' }).first()
    const editBtn = tenantRow.locator('button').filter({ has: page.locator('.anticon-edit') })
    await editBtn.click()

    await page.waitForURL(/\/tenants\/.+/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/tenants\/.+/)
    await expect(page.locator('.ant-tabs-tab').filter({ hasText: 'Configuration' }).first()).toBeVisible({ timeout: 10000 })
  })

  // ─── Test 9: Configuration tab pre-populates tenant name ──────────────────
  test('TC09: Configuration tab pre-populates tenant name field', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })
    await page.locator('input[placeholder="Search tenants…"]').fill('QA Test Tenant')
    await page.waitForTimeout(600)

    const tenantRow = page.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: 'QA Test Tenant' }).first()
    const editBtn = tenantRow.locator('button').filter({ has: page.locator('.anticon-edit') })
    await editBtn.click()
    await page.waitForURL(/\/tenants\/.+/, { timeout: 10000 })

    // Wait for form to load with existing data (API call populates the form)
    await page.waitForSelector('input[placeholder="e.g. SafeGuard"]', { timeout: 10000 })
    await page.waitForTimeout(800) // Allow form to populate via useEffect
    const nameInput = page.locator('input[placeholder="e.g. SafeGuard"]')
    const value = await nameInput.inputValue()
    expect(value).toBe('QA Test Tenant')
  })

  // ─── Test 10: /diff page has both tenant A and B selects ─────────────────
  test('TC10: /diff page has both Tenant A and Tenant B selects', async ({ page }) => {
    await loginAndNavigate(page)
    await page.goto(BASE + '/diff')
    await page.waitForSelector('text=Config Diff', { timeout: 10000 })

    // Check labels
    await expect(page.locator('strong:has-text("Tenant A")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('strong:has-text("Tenant B")').first()).toBeVisible({ timeout: 5000 })

    // In AntD v6, Select placeholder uses .ant-select-placeholder (not .ant-select-selection-placeholder)
    await page.waitForSelector('.ant-select-placeholder', { timeout: 10000 })
    const placeholders = page.locator('.ant-select-placeholder')
    const count = await placeholders.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  // ─── Test 11: Select SafeGuard and HealthFirst, Compare, see diff table ───
  test('TC11: Select SafeGuard and HealthFirst, compare, see diff table', async ({ page }) => {
    await loginAndNavigate(page)
    await page.goto(BASE + '/diff')
    // Wait for page and selects to load
    await page.waitForSelector('.ant-select-placeholder', { timeout: 10000 })
    await page.waitForTimeout(1000) // Extra wait for API to populate options

    // Tenant A select: click the first .ant-select-content
    const selectContents = page.locator('.ant-select-content')
    await selectContents.nth(0).click()
    await page.waitForTimeout(300)
    await page.locator('.ant-select-item-option').filter({ hasText: /^SafeGuard$/ }).click()
    await page.waitForTimeout(500)

    // Tenant B select: second .ant-select-content
    await selectContents.nth(1).click()
    await page.waitForTimeout(300)
    await page.locator('.ant-select-item-option').filter({ hasText: /^HealthFirst$/ }).click()
    await page.waitForTimeout(500)

    // Compare button should be enabled
    const compareBtn = page.locator('button:has-text("Compare")')
    await expect(compareBtn).toBeEnabled({ timeout: 5000 })
    await compareBtn.click()

    // Wait for diff results
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 20000 })
    const diffRows = page.locator('.ant-table-tbody tr.ant-table-row')
    const count = await diffRows.count()
    expect(count).toBeGreaterThan(0)
  })

  // ─── Test 12: SafeGuard Version History tab shows at least 1 version ──────
  test('TC12: SafeGuard tenant Version History tab shows at least 1 version', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })

    // Click SafeGuard row to navigate to detail page
    await page.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: 'SafeGuard' }).first().click()
    await page.waitForURL(/\/tenants\/.+/, { timeout: 10000 })

    // Click Version History tab
    await page.locator('.ant-tabs-tab').filter({ hasText: 'Version History' }).first().click()

    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })
    const count = await page.locator('.ant-table-tbody tr.ant-table-row').count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  // ─── Test 13: Version History tab has eye (preview) button ────────────────
  test('TC13: Version History tab shows eye icon preview button', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })

    await page.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: 'SafeGuard' }).first().click()
    await page.waitForURL(/\/tenants\/.+/, { timeout: 10000 })

    await page.locator('.ant-tabs-tab').filter({ hasText: 'Version History' }).first().click()
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })

    // Eye icon (EyeOutlined) button in the Preview column
    await expect(page.locator('.anticon-eye').first()).toBeVisible({ timeout: 10000 })
  })

  // ─── Test 14: ClaimTester tab → submit claim → result appears ─────────────
  test('TC14: SafeGuard Claim Tester tab submit a claim result section appears', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 10000 })

    await page.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: 'SafeGuard' }).first().click()
    await page.waitForURL(/\/tenants\/.+/, { timeout: 10000 })

    // Click Claim Tester tab
    await page.locator('.ant-tabs-tab').filter({ hasText: 'Claim Tester' }).first().click()
    await page.waitForSelector('text=Test Input', { timeout: 10000 })
    await page.waitForTimeout(500)

    // Select claim type: find the select with "Select type…" placeholder (AntD v6: .ant-select-placeholder)
    // and click its .ant-select-content parent
    const claimTypeSelectContent = page.locator('.ant-select-content').filter({
      has: page.locator('.ant-select-placeholder', { hasText: 'Select type…' }),
    }).first()
    await claimTypeSelectContent.click()
    await page.waitForTimeout(300)
    await page.locator('.ant-select-item-option').first().click()
    await page.waitForTimeout(300)

    // Fill amount (first ant-input-number-input after the claim type select)
    const amountInput = page.locator('input.ant-input-number-input[id*="amount"]').first()
    await amountInput.click({ clickCount: 3 })
    await amountInput.fill('25000')

    // Fill Employee ID custom field if present (SafeGuard has it as required)
    const employeeIdInput = page.locator('input[placeholder="Employee ID"]')
    if (await employeeIdInput.count() > 0) {
      await employeeIdInput.first().fill('EMP001')
    }

    // Submit
    await page.click('button:has-text("Process Claim")')

    // Result: wait for SLA Deadline statistic to appear
    await page.waitForSelector('.ant-statistic', { timeout: 20000 })
    const slaStatistic = page.locator('.ant-statistic').filter({ hasText: /SLA|Deadline/ })
    await expect(slaStatistic.first()).toBeVisible({ timeout: 15000 })
  })

  // ─── Test 15: Show Deleted toggle on /tenants page ────────────────────────
  test('TC15: Show Deleted toggle on /tenants page is functional', async ({ page }) => {
    await loginAndNavigate(page)
    await page.waitForSelector('.ant-table-tbody', { timeout: 10000 })

    // "Show deleted" label text
    await expect(page.locator('span:has-text("Show deleted")').first()).toBeVisible({ timeout: 5000 })

    // The switch is inside the same .ant-space as the "Show deleted" text
    const spaceContainer = page.locator('.ant-space').filter({ hasText: 'Show deleted' }).first()
    const showDeletedSwitch = spaceContainer.locator('button.ant-switch').first()
    await expect(showDeletedSwitch).toBeVisible({ timeout: 5000 })

    const beforeState = await showDeletedSwitch.getAttribute('aria-checked')
    await showDeletedSwitch.click()
    await page.waitForTimeout(1500)
    const afterState = await showDeletedSwitch.getAttribute('aria-checked')

    // State must have toggled
    expect(afterState).not.toBe(beforeState)
  })

})
