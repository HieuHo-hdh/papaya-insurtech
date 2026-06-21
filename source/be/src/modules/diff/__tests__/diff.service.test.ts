/**
 * TL Sample — diff service (ts-jest Prisma mock pattern)
 *
 * flatDiff branches covered via diffConfigs() payloads:
 *   ✓ Arrays that differ → single entry with full arrays as valueA/valueB
 *   ✓ Arrays that are equal → omitted
 *   ✓ Nested object recursion → leaf path "branding.companyName"
 *   ✓ Key in A but absent in B → diff entry with valueB=undefined
 *   ✓ Equal primitives → omitted
 *   ✓ Identical configs → empty diffs
 */
import { diffConfigs } from '../diff.service'
import { AppError } from '@/utils/AppError'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import type { TenantConfig } from '@/shared/types'

// ── Prisma mocks ──────────────────────────────────────────────────────────────

// eslint-disable-next-line no-var
var mockConfigFindFirst: jest.Mock

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    tenantConfig: { findFirst: (mockConfigFindFirst = jest.fn()) },
  })),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeConfig = (overrides: Partial<TenantConfig> = {}): TenantConfig => ({
  branding: { companyName: 'Corp A', primaryColor: '#aaaaaa', secondaryColor: '#bbbbbb' },
  claimTypes: { OUTPATIENT: { enabled: true, requiredDocuments: ['Receipt'], optionalDocuments: [] } },
  approvalRules: { autoApprovalThreshold: 1000, approvalTiers: [{ tier: 'manager', isPrimary: true }] },
  notifications: [],
  sla: { timezone: 'UTC', weekdays: ['MON'], holidays: [], perClaimType: { OUTPATIENT: 5 }, escalationContacts: [] },
  customFields: [],
  ...overrides,
})

const CONFIG_A = makeConfig()
const CONFIG_B = makeConfig({ branding: { companyName: 'Corp B', primaryColor: '#aaaaaa', secondaryColor: '#cccccc' } })

const setupMocks = (configA: TenantConfig | null, configB: TenantConfig | null) => {
  mockConfigFindFirst
    .mockResolvedValueOnce(configA ? { config: configA } as never : null as never)
    .mockResolvedValueOnce(configB ? { config: configB } as never : null as never)
}

// ─────────────────────────────────────────────────────────────────────────────

describe('diffConfigs()', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws AppError 404 when tenant A has no active config', async () => {
    setupMocks(null, CONFIG_B)
    await expect(diffConfigs('tenant-a', 'tenant-b')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws AppError 404 when tenant B has no active config', async () => {
    setupMocks(CONFIG_A, null)
    await expect(diffConfigs('tenant-a', 'tenant-b')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns tenantA, tenantB, and diffs array', async () => {
    setupMocks(CONFIG_A, CONFIG_B)
    const result = await diffConfigs('a', 'b')

    expect(result.tenantA).toEqual(CONFIG_A)
    expect(result.tenantB).toEqual(CONFIG_B)
    expect(Array.isArray(result.diffs)).toBe(true)
  })

  it('detects nested scalar diff at "branding.companyName"', async () => {
    setupMocks(CONFIG_A, CONFIG_B)
    const { diffs } = await diffConfigs('a', 'b')
    const entry = diffs.find((d) => d.path === 'branding.companyName')

    expect(entry).toBeDefined()
    expect(entry?.valueA).toBe('Corp A')
    expect(entry?.valueB).toBe('Corp B')
  })

  it('omits paths where values are identical ("branding.primaryColor" is same in both)', async () => {
    setupMocks(CONFIG_A, CONFIG_B)
    const { diffs } = await diffConfigs('a', 'b')
    expect(diffs.find((d) => d.path === 'branding.primaryColor')).toBeUndefined()
  })

  it('represents differing arrays as a single entry (not element-by-element)', async () => {
    const configWithMoreDocs = makeConfig({
      claimTypes: { OUTPATIENT: { enabled: true, requiredDocuments: ['Report', 'ID'], optionalDocuments: [] } },
    })
    setupMocks(CONFIG_A, configWithMoreDocs)

    const { diffs } = await diffConfigs('a', 'b')
    const entry = diffs.find((d) => d.path.includes('requiredDocuments'))

    expect(entry).toBeDefined()
    expect(Array.isArray(entry?.valueB)).toBe(true)
  })

  it('detects key present in A but absent in B', async () => {
    const configBNoTz = { ...CONFIG_B, sla: { ...CONFIG_B.sla, timezone: undefined as unknown as string } }
    setupMocks(CONFIG_A, configBNoTz)

    const { diffs } = await diffConfigs('a', 'b')
    const entry = diffs.find((d) => d.path === 'sla.timezone')

    expect(entry).toBeDefined()
    expect(entry?.valueA).toBe('UTC')
    expect(entry?.valueB).toBeUndefined()
  })

  it('returns empty diffs when both configs are identical', async () => {
    setupMocks(CONFIG_A, CONFIG_A)
    const { diffs } = await diffConfigs('a', 'b')
    expect(diffs).toHaveLength(0)
  })
})
