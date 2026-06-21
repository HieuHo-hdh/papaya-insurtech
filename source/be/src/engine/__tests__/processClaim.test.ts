/**
 * TL Sample — processClaim engine orchestration (ts-jest Prisma mock pattern)
 *
 * Mocks only Prisma; real resolver functions run so wiring bugs surface here.
 * See tenants.service.test.ts header for the ts-jest mock pattern explanation.
 */
import { processClaim } from '../processClaim'
import { AppError } from '@/utils/AppError'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { safeguardConfig, healthfirstConfig, govhealthConfig } from './fixtures'

// ── Prisma mocks ──────────────────────────────────────────────────────────────

// eslint-disable-next-line no-var
var mockTenantFindFirst: jest.Mock
// eslint-disable-next-line no-var
var mockConfigFindFirst: jest.Mock

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    tenant: { findFirst: (mockTenantFindFirst = jest.fn()) },
    tenantConfig: { findFirst: (mockConfigFindFirst = jest.fn()) },
  })),
}))

jest.mock('@/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-at-least-16-chars', PORT: 3001, NODE_ENV: 'test' },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const FAKE_TENANT = { id: 'tenant-1', name: 'SafeGuard', deletedAt: null }

const setupPrisma = (config: typeof safeguardConfig) => {
  mockTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)
  mockConfigFindFirst.mockResolvedValue({ config } as never)
}

// ─────────────────────────────────────────────────────────────────────────────

describe('processClaim()', () => {
  beforeEach(() => { jest.clearAllMocks() })

  // ── Error paths ─────────────────────────────────────────────────────────────

  it('throws AppError 404 when tenant does not exist', async () => {
    mockTenantFindFirst.mockResolvedValue(null as never)
    await expect(
      processClaim('missing', { claimType: 'OUTPATIENT', amount: 1000, customFields: {} })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Tenant not found' })
  })

  it('throws AppError 404 when tenant has no active config', async () => {
    mockTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockConfigFindFirst.mockResolvedValue(null as never)
    await expect(
      processClaim('tenant-1', { claimType: 'OUTPATIENT', amount: 1000, customFields: {} })
    ).rejects.toMatchObject({ statusCode: 404, message: 'No active config for tenant' })
  })

  it('throws AppError 400 with field errors when required custom fields are missing', async () => {
    setupPrisma(safeguardConfig) // SafeGuard requires employee_id

    const err = await processClaim('tenant-1', {
      claimType: 'OUTPATIENT',
      amount: 1000,
      customFields: {},
    }).catch((e) => e)

    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('Custom field validation failed')
    expect(err.details?.employee_id).toBeDefined()
  })

  it('throws 400 when claim type is disabled (SafeGuard: MATERNITY disabled)', async () => {
    setupPrisma(safeguardConfig)
    await expect(
      processClaim('tenant-1', {
        claimType: 'MATERNITY',
        amount: 1000,
        customFields: { employee_id: 'EMP001' },
      })
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  // ── Happy paths ─────────────────────────────────────────────────────────────

  it('SafeGuard OUTPATIENT: auto-approved when amount ≤ 20000, returns correct docs', async () => {
    setupPrisma(safeguardConfig)
    const result = await processClaim('tenant-1', {
      claimType: 'OUTPATIENT',
      amount: 1000,
      customFields: { employee_id: 'EMP001' },
    })

    expect(result.requiredDocuments).toEqual(['Medical Report', 'Receipt'])
    expect(result.approvalTiers).toEqual([])           // auto-approved
    expect(result.customFieldsRequired).toHaveLength(1)
    expect(result.slaDeadline).toMatch(/^\d{4}-\d{2}-\d{2}T/) // ISO format
    expect(Array.isArray(result.notifications)).toBe(true)
  })

  it('SafeGuard: amount > 20000 routes to assessor tier', async () => {
    setupPrisma(safeguardConfig)
    const result = await processClaim('tenant-1', {
      claimType: 'OUTPATIENT',
      amount: 30000,
      customFields: { employee_id: 'EMP001' },
    })
    expect(result.approvalTiers).toEqual([{ tier: 'assessor' }])
  })

  it('HealthFirst: no required custom fields, MATERNITY enabled', async () => {
    mockTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockConfigFindFirst.mockResolvedValue({ config: healthfirstConfig } as never)

    const result = await processClaim('tenant-1', {
      claimType: 'MATERNITY',
      amount: 2000,
      customFields: {},
    })

    expect(result.customFieldsRequired).toHaveLength(0)
    expect(result.requiredDocuments).toContain('Birth Certificate')
  })

  it('GovHealth: always routes to committee (threshold=0)', async () => {
    mockTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockConfigFindFirst.mockResolvedValue({ config: govhealthConfig } as never)

    const result = await processClaim('tenant-1', {
      claimType: 'OUTPATIENT',
      amount: 1,
      customFields: { department: 'Finance', budget_code: 'BC001' },
    })

    expect(result.approvalTiers).toEqual([{ tier: 'committee' }])
  })

  // ── Invariant ───────────────────────────────────────────────────────────────

  it('same claim input (amount=10000, OUTPATIENT) produces different outputs per tenant', async () => {
    const runFor = async (config: typeof safeguardConfig) => {
      mockTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)
      mockConfigFindFirst.mockResolvedValue({ config } as never)
      return processClaim('tenant-1', {
        claimType: 'OUTPATIENT',
        amount: 10000,
        customFields: { employee_id: 'EMP001', department: 'IT', budget_code: 'BC001' },
      })
    }

    const sg = await runFor(safeguardConfig)
    const hf = await runFor(healthfirstConfig)
    const gh = await runFor(govhealthConfig)

    // 10000 ≤ 20000 (SafeGuard auto) | > 5000 (HealthFirst assessor) | threshold=0 (GovHealth committee)
    expect(sg.approvalTiers).toEqual([])
    expect(hf.approvalTiers).toEqual([{ tier: 'assessor' }])
    expect(gh.approvalTiers).toEqual([{ tier: 'committee' }])

    expect(sg.requiredDocuments).not.toEqual(gh.requiredDocuments)

    expect(sg.customFieldsRequired).toHaveLength(1)
    expect(hf.customFieldsRequired).toHaveLength(0)
    expect(gh.customFieldsRequired).toHaveLength(2)
  })
})
