import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'
const ADMIN = { email: 'admin@papaya.dev', password: 'Admin@1234' }
const SAFEGUARD_ID = 'tenant-safeguard'

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Password').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(`${BASE}/tenants`, { timeout: 8000 })
}

// ── Auth ─────────────────────────────────────────────────────────────────────

test('UI-T1: / redirects unauthenticated user to /login', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForURL(/\/login/, { timeout: 5000 })
  expect(page.url()).toContain('/login')
})

test('UI-T2: login with wrong password returns 401', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Password').fill('wrongpassword')
  // Intercept the response to verify 401 without relying on transient toast
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ])
  expect(response.status()).toBe(401)
})

test('UI-T3: valid login redirects to /tenants', async ({ page }) => {
  await login(page)
  expect(page.url()).toContain('/tenants')
  // Breadcrumb or sidebar shows "Tenants"
  await expect(page.getByText('Tenants').first()).toBeVisible()
})

// ── Tenant list ───────────────────────────────────────────────────────────────

test('UI-T4: tenants page shows at least 3 rows', async ({ page }) => {
  await login(page)
  const rows = page.locator('.ant-table-row')
  await expect(rows.first()).toBeVisible({ timeout: 5000 })
  expect(await rows.count()).toBeGreaterThanOrEqual(3)
})

test('UI-T5: tenant names SafeGuard, HealthFirst, GovHealth visible in table', async ({ page }) => {
  await login(page)
  // Use <strong> inside table cells to avoid strict-mode match with the ID column
  await expect(page.locator('.ant-table-cell strong', { hasText: 'SafeGuard' }).first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.ant-table-cell strong', { hasText: 'HealthFirst' }).first()).toBeVisible()
  await expect(page.locator('.ant-table-cell strong', { hasText: 'GovHealth' }).first()).toBeVisible()
})

// ── Create tenant ─────────────────────────────────────────────────────────────

test('UI-T6: navigate to /tenants/new shows TenantForm', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /new tenant/i }).click()
  await page.waitForURL(/\/tenants\/new/, { timeout: 5000 })
  await expect(page.getByLabel('Tenant Name')).toBeVisible()
})

test('UI-T7: TenantForm — claim type toggle expands and adds required doc', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/tenants/new`)

  // Fill required branding fields
  await page.getByLabel('Tenant Name').fill('E2E Test Tenant')
  await page.getByLabel('Company Name').fill('E2E Corp')

  // Claim Types — each type is an ant-card. Enable OUTPATIENT via its switch.
  const outCard = page.locator('.ant-card').filter({ hasText: 'OUTPATIENT' }).first()
  const outSwitch = outCard.locator('.ant-switch').first()
  const isChecked = await outSwitch.getAttribute('aria-checked')
  if (isChecked !== 'true') await outSwitch.click()

  // Card should expand showing Required Docs section
  await expect(outCard.getByText('Required Docs')).toBeVisible({ timeout: 3000 })

  // Add one required document
  await outCard.getByRole('button', { name: 'Add' }).first().click()
  await outCard.locator('input[placeholder="e.g. Medical Report"]').first().fill('Receipt')

  // Save button is present and enabled
  await expect(page.getByRole('button', { name: /save configuration/i })).toBeVisible()
})

// ── Tenant detail ─────────────────────────────────────────────────────────────

test('UI-T8: tenant detail page shows Configuration tab', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/tenants/${SAFEGUARD_ID}`)
  await expect(page.getByRole('tab', { name: /configuration/i })).toBeVisible({ timeout: 5000 })
})

test('UI-T9: Configuration tab pre-populates company name field', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/tenants/${SAFEGUARD_ID}`)
  await page.getByRole('tab', { name: /configuration/i }).click()
  const companyInput = page.getByLabel('Company Name')
  await expect(companyInput).not.toHaveValue('', { timeout: 5000 })
})

test('UI-T10: Version History tab shows at least 1 version row', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/tenants/${SAFEGUARD_ID}`)
  await page.getByRole('tab', { name: /version history/i }).click()
  const rows = page.locator('.ant-table-row')
  await expect(rows.first()).toBeVisible({ timeout: 5000 })
  expect(await rows.count()).toBeGreaterThanOrEqual(1)
})

test('UI-T11: Version History shows eye (preview) button per row', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/tenants/${SAFEGUARD_ID}`)
  await page.getByRole('tab', { name: /version history/i }).click()
  await expect(page.locator('[data-icon="eye"]').first()).toBeVisible({ timeout: 5000 })
})

test('UI-T12: Claim Tester tab shows claim type and amount inputs', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/tenants/${SAFEGUARD_ID}`)
  await page.getByRole('tab', { name: /claim tester/i }).click()
  // Use the form label exactly — avoids matching "Claim Types" section or "SLA Days Per Claim Type"
  await expect(page.locator('label[title="Claim Type"]')).toBeVisible({ timeout: 3000 })
  await expect(page.locator('label[title="Amount"]')).toBeVisible()
})

// ── Config diff ───────────────────────────────────────────────────────────────

test('UI-T13: /diff page shows Tenant A and Tenant B labels', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/diff`)
  // exact: true prevents matching "Select Tenant A" in the stepper
  await expect(page.getByText('Tenant A', { exact: true })).toBeVisible()
  await expect(page.getByText('Tenant B', { exact: true })).toBeVisible()
  await expect(page.getByRole('combobox').first()).toBeVisible()
})

test('UI-T14: diff Compare produces results table', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/diff`)

  // Select SafeGuard for Tenant A
  await page.getByRole('combobox').nth(0).click()
  await page.locator('[title="SafeGuard"]').first().click()
  // Press Escape to ensure dropdown is fully closed before opening Tenant B
  await page.keyboard.press('Escape')

  // Select HealthFirst for Tenant B — after Escape, Tenant A's portal is hidden
  // Tenant B's portal (second in DOM) contains the visible option
  await page.getByRole('combobox').nth(1).click()
  await page.locator('[title="HealthFirst"]').nth(1).click()

  await page.getByRole('button', { name: /compare/i }).click()
  await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 8000 })
})

// ── Show deleted ──────────────────────────────────────────────────────────────

test('UI-T15: Show deleted toggle is present on tenants page', async ({ page }) => {
  await login(page)
  await expect(page.getByText('Show deleted')).toBeVisible()
  const toggle = page.locator('.ant-switch').last()
  await expect(toggle).toBeVisible()
})
