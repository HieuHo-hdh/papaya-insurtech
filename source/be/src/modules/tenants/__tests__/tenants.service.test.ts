/**
 * TL Sample — tenants service (canonical Prisma mock pattern for ts-jest)
 *
 * ts-jest PRISMA MOCK RULES:
 *   1. Declare mock variables with `var` (not let/const) — var is hoisted without
 *      TDZ so the jest.mock() factory can assign to them before module eval reaches
 *      the declaration line. This is the ts-jest equivalent of babel-jest's
 *      "mock prefix" hoisting.
 *   2. Assign mocks INSIDE the PrismaClient constructor implementation:
 *      `$transaction: (mockTransaction = jest.fn())`.
 *   3. Use block body in beforeEach: `beforeEach(() => { jest.clearAllMocks() })`.
 *   4. Use `as never` on mockResolvedValue/mockRejectedValue (Jest 30 strict types).
 */
import { list, getById, create, update, remove } from '../tenants.service'
import { AppError } from '@/utils/AppError'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import type { TenantConfig } from '@/shared/types'

// ── Prisma mocks (var = hoisted, no TDZ) ─────────────────────────────────────
// eslint-disable-next-line no-var
var mockFindMany: jest.Mock
// eslint-disable-next-line no-var
var mockCount: jest.Mock
// eslint-disable-next-line no-var
var mockFindFirst: jest.Mock
// eslint-disable-next-line no-var
var mockUpdate: jest.Mock
// eslint-disable-next-line no-var
var mockTransaction: jest.Mock

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    tenant: {
      findMany: (mockFindMany = jest.fn()),
      count: (mockCount = jest.fn()),
      findFirst: (mockFindFirst = jest.fn()),
      update: (mockUpdate = jest.fn()),
    },
    $transaction: (mockTransaction = jest.fn()),
  })),
}))

// ── Transaction context (created fresh in beforeEach that needs $transaction) ─

let mockTxTenantCreate: jest.Mock
let mockTxTenantFindFirst: jest.Mock
let mockTxConfigCreate: jest.Mock
let mockTxConfigFindFirst: jest.Mock
let mockTxConfigUpdateMany: jest.Mock

const setupTransaction = () => {
  mockTxTenantCreate = jest.fn()
  mockTxTenantFindFirst = jest.fn()
  mockTxConfigCreate = jest.fn()
  mockTxConfigFindFirst = jest.fn()
  mockTxConfigUpdateMany = jest.fn()
  mockTransaction.mockImplementation((fn: any) => fn({
    tenant: { create: mockTxTenantCreate, findFirst: mockTxTenantFindFirst },
    tenantConfig: {
      create: mockTxConfigCreate,
      findFirst: mockTxConfigFindFirst,
      updateMany: mockTxConfigUpdateMany,
    },
  }))
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FAKE_CONFIG: TenantConfig = {
  branding: { companyName: 'Acme', primaryColor: '#ffffff', secondaryColor: '#000000' },
  claimTypes: { OUTPATIENT: { enabled: true, requiredDocuments: ['Receipt'], optionalDocuments: [] } },
  approvalRules: { autoApprovalThreshold: 1000, approvalTiers: [{ tier: 'manager', isPrimary: true }] },
  notifications: [{ event: 'claim_submitted', channels: [{ channel: 'email' }] }],
  sla: { timezone: 'UTC', weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'], holidays: [], perClaimType: { OUTPATIENT: 5 }, escalationContacts: [] },
  customFields: [],
}

const FAKE_TENANT = {
  id: 'tenant-uuid-1',
  name: 'Acme',
  deletedAt: null,
  createdAt: new Date(),
  configs: [{ id: 'config-uuid-1', version: 1, isActive: true, config: FAKE_CONFIG }],
}

// ─────────────────────────────────────────────────────────────────────────────

describe('tenants.service.list', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('returns tenants array with total, page, and pageSize', async () => {
    mockFindMany.mockResolvedValue([FAKE_TENANT] as never)
    mockCount.mockResolvedValue(1 as never)

    const result = await list(1, 20)

    expect(result.tenants).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('calculates skip = (page-1) * pageSize', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(0 as never)

    await list(3, 5)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 })
    )
  })

  it('only fetches non-deleted tenants (where: { deletedAt: null })', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(0 as never)

    await list(1, 20)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('tenants.service.getById', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('returns the tenant when found', async () => {
    mockFindFirst.mockResolvedValue(FAKE_TENANT as never)
    const result = await getById(FAKE_TENANT.id)
    expect(result).toEqual(FAKE_TENANT)
  })

  it('throws AppError 404 when tenant does not exist', async () => {
    mockFindFirst.mockResolvedValue(null as never)
    await expect(getById('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Tenant not found',
    })
  })

  it('thrown error is AppError instance', async () => {
    mockFindFirst.mockResolvedValue(null as never)
    const err = await getById('x').catch((e) => e)
    expect(err).toBeInstanceOf(AppError)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('tenants.service.create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupTransaction()
  })

  it('creates tenant with the given name inside a transaction', async () => {
    mockTxTenantCreate.mockResolvedValue({ id: 'new-id', name: 'New Tenant' } as never)
    mockTxConfigCreate.mockResolvedValue({} as never)
    mockTxTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)

    await create('New Tenant', FAKE_CONFIG)

    expect(mockTxTenantCreate).toHaveBeenCalledWith({ data: { name: 'New Tenant' } })
  })

  it('creates initial config at version=1 and isActive=true', async () => {
    const newTenant = { id: 'new-id', name: 'New Tenant' }
    mockTxTenantCreate.mockResolvedValue(newTenant as never)
    mockTxConfigCreate.mockResolvedValue({} as never)
    mockTxTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)

    await create('New Tenant', FAKE_CONFIG)

    expect(mockTxConfigCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: newTenant.id, version: 1, isActive: true }),
      })
    )
  })

  it('returns the created tenant with active config', async () => {
    mockTxTenantCreate.mockResolvedValue({ id: 'new-id' } as never)
    mockTxConfigCreate.mockResolvedValue({} as never)
    mockTxTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)

    const result = await create('New Tenant', FAKE_CONFIG)
    expect(result).toEqual(FAKE_TENANT)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('tenants.service.update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupTransaction()
  })

  it('throws AppError 404 when tenant does not exist', async () => {
    mockFindFirst.mockResolvedValue(null as never)
    await expect(update('nonexistent', FAKE_CONFIG)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('deactivates existing active configs before creating new version', async () => {
    mockFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockTxConfigFindFirst.mockResolvedValue({ version: 2 } as never)
    mockTxConfigUpdateMany.mockResolvedValue({ count: 1 } as never)
    mockTxConfigCreate.mockResolvedValue({} as never)
    mockTxTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)

    await update(FAKE_TENANT.id, FAKE_CONFIG)

    expect(mockTxConfigUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
  })

  it('creates new config at version = latestVersion + 1', async () => {
    mockFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockTxConfigFindFirst.mockResolvedValue({ version: 2 } as never)
    mockTxConfigUpdateMany.mockResolvedValue({ count: 1 } as never)
    mockTxConfigCreate.mockResolvedValue({} as never)
    mockTxTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)

    await update(FAKE_TENANT.id, FAKE_CONFIG)

    expect(mockTxConfigCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 3, isActive: true }) })
    )
  })

  it('edge case: version defaults to 1 when no prior config exists', async () => {
    mockFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockTxConfigFindFirst.mockResolvedValue(null as never)
    mockTxConfigUpdateMany.mockResolvedValue({ count: 0 } as never)
    mockTxConfigCreate.mockResolvedValue({} as never)
    mockTxTenantFindFirst.mockResolvedValue(FAKE_TENANT as never)

    await update(FAKE_TENANT.id, FAKE_CONFIG)

    expect(mockTxConfigCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 1 }) })
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('tenants.service.remove', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws AppError 404 when tenant does not exist', async () => {
    mockFindFirst.mockResolvedValue(null as never)
    await expect(remove('nonexistent')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('soft-deletes by setting deletedAt to a Date', async () => {
    mockFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockUpdate.mockResolvedValue({} as never)

    await remove(FAKE_TENANT.id)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FAKE_TENANT.id },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    )
  })

  it('returns void', async () => {
    mockFindFirst.mockResolvedValue(FAKE_TENANT as never)
    mockUpdate.mockResolvedValue({} as never)
    expect(await remove(FAKE_TENANT.id)).toBeUndefined()
  })
})
