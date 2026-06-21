/**
 * TL Sample — versions service (ts-jest Prisma mock with var hoisting pattern)
 */
import { listVersions, getVersion, rollback } from '../versions.service'
import { AppError } from '@/utils/AppError'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// eslint-disable-next-line no-var
var mockTenantFindFirst: jest.Mock
// eslint-disable-next-line no-var
var mockConfigFindMany: jest.Mock
// eslint-disable-next-line no-var
var mockConfigCount: jest.Mock
// eslint-disable-next-line no-var
var mockConfigFindFirst: jest.Mock
// eslint-disable-next-line no-var
var mockTransaction: jest.Mock

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    tenant: { findFirst: (mockTenantFindFirst = jest.fn()) },
    tenantConfig: {
      findMany: (mockConfigFindMany = jest.fn()),
      count: (mockConfigCount = jest.fn()),
      findFirst: (mockConfigFindFirst = jest.fn()),
    },
    $transaction: (mockTransaction = jest.fn()),
  })),
}))

let mockTxConfigFindFirst: jest.Mock
let mockTxConfigUpdateMany: jest.Mock
let mockTxConfigCreate: jest.Mock

const setupTransaction = () => {
  mockTxConfigFindFirst = jest.fn()
  mockTxConfigUpdateMany = jest.fn()
  mockTxConfigCreate = jest.fn()
  mockTransaction.mockImplementation((fn: any) => fn({
    tenantConfig: {
      findFirst: mockTxConfigFindFirst,
      updateMany: mockTxConfigUpdateMany,
      create: mockTxConfigCreate,
    },
  }))
}

const TENANT = { id: 'tenant-1', name: 'Acme', deletedAt: null }
const V1 = { id: 'v-uuid-1', tenantId: 'tenant-1', version: 1, isActive: false, config: {} }
const V2 = { id: 'v-uuid-2', tenantId: 'tenant-1', version: 2, isActive: true, config: {} }

// ─────────────────────────────────────────────────────────────────────────────

describe('versions.service.listVersions', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws 404 when tenant does not exist', async () => {
    mockTenantFindFirst.mockResolvedValue(null as never)
    await expect(listVersions('missing', 1, 20)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Tenant not found',
    })
  })

  it('returns paginated versions for the tenant', async () => {
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindMany.mockResolvedValue([V2, V1] as never)
    mockConfigCount.mockResolvedValue(2 as never)

    const result = await listVersions('tenant-1', 1, 20)

    expect(result.versions).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it('queries versions ordered by version desc', async () => {
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindMany.mockResolvedValue([] as never)
    mockConfigCount.mockResolvedValue(0 as never)

    await listVersions('tenant-1', 1, 20)

    expect(mockConfigFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { version: 'desc' } })
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('versions.service.getVersion', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws 404 when tenant does not exist', async () => {
    mockTenantFindFirst.mockResolvedValue(null as never)
    await expect(getVersion('missing', 'v1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when version does not exist', async () => {
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindFirst.mockResolvedValue(null as never)
    await expect(getVersion('tenant-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Version not found',
    })
  })

  it('returns the version when found', async () => {
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindFirst.mockResolvedValue(V1 as never)

    const result = await getVersion('tenant-1', 'v-uuid-1')
    expect(result).toEqual(V1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('versions.service.rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupTransaction()
  })

  it('throws 404 when tenant does not exist', async () => {
    mockTenantFindFirst.mockResolvedValue(null as never)
    await expect(rollback('missing', 'v1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when target version does not exist', async () => {
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindFirst.mockResolvedValue(null as never)
    await expect(rollback('tenant-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Version not found',
    })
  })

  it('deactivates current active configs before creating new version', async () => {
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindFirst.mockResolvedValue(V1 as never)
    mockTxConfigFindFirst.mockResolvedValue({ version: 2 } as never)
    mockTxConfigUpdateMany.mockResolvedValue({ count: 1 } as never)
    mockTxConfigCreate.mockResolvedValue({} as never)

    await rollback('tenant-1', 'v-uuid-1')

    expect(mockTxConfigUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
  })

  it('creates new version = latest + 1, copying target config', async () => {
    const newVersion = { ...V1, id: 'v-uuid-3', version: 3, isActive: true }
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindFirst.mockResolvedValue(V1 as never)
    mockTxConfigFindFirst.mockResolvedValue({ version: 2 } as never)
    mockTxConfigUpdateMany.mockResolvedValue({ count: 1 } as never)
    mockTxConfigCreate.mockResolvedValue(newVersion as never)

    const result = await rollback('tenant-1', 'v-uuid-1')

    expect(mockTxConfigCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 3, isActive: true, config: V1.config }),
      })
    )
    expect(result).toMatchObject({ version: 3, isActive: true })
  })

  it('defaults nextVersion to 1 when no prior version exists in transaction', async () => {
    const newVersion = { ...V1, id: 'v-uuid-3', version: 1, isActive: true }
    mockTenantFindFirst.mockResolvedValue(TENANT as never)
    mockConfigFindFirst.mockResolvedValue(V1 as never)
    mockTxConfigFindFirst.mockResolvedValue(null as never)
    mockTxConfigUpdateMany.mockResolvedValue({ count: 0 } as never)
    mockTxConfigCreate.mockResolvedValue(newVersion as never)

    await rollback('tenant-1', 'v-uuid-1')

    expect(mockTxConfigCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 1 }) })
    )
  })
})
