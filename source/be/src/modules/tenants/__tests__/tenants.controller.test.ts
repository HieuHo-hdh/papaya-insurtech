/**
 * TL Sample — tenants controller
 *
 * FE API contract:
 *   GET    /tenants       → paginated({ data: Tenant[], total, page, pageSize })
 *   GET    /tenants/:id   → success(Tenant)
 *   POST   /tenants       → 201 success(Tenant)
 *   PUT    /tenants/:id   → success(Tenant)
 *   DELETE /tenants/:id   → success(null, 'Tenant deleted')
 */
import type { Request, Response } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../tenants.service', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))

import { list, getById, create, update, remove } from '../tenants.controller'
import * as tenantService from '../tenants.service'

const mockList = jest.mocked(tenantService.list)
const mockGetById = jest.mocked(tenantService.getById)
const mockCreate = jest.mocked(tenantService.create)
const mockUpdate = jest.mocked(tenantService.update)
const mockRemove = jest.mocked(tenantService.remove)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (overrides: Partial<{ query: object; params: object; body: object }> = {}): Request =>
  ({ query: {}, params: {}, body: {}, ...overrides } as unknown as Request)

const makeRes = () => {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { json, status } as unknown as Response & { json: jest.Mock; status: jest.Mock }
}

const FAKE_TENANT = { id: 't1', name: 'Acme', configs: [] }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('tenants.controller.list', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('defaults page=1, pageSize=20 when query params are absent', async () => {
    mockList.mockResolvedValue({ tenants: [], total: 0, page: 1, pageSize: 20 } as never)
    await list(makeReq(), makeRes())
    expect(mockList).toHaveBeenCalledWith(1, 20)
  })

  it('parses page and pageSize from query string', async () => {
    mockList.mockResolvedValue({ tenants: [], total: 0, page: 2, pageSize: 10 } as never)
    await list(makeReq({ query: { page: '2', pageSize: '10' } }), makeRes())
    expect(mockList).toHaveBeenCalledWith(2, 10)
  })

  it('clamps page to minimum 1 for invalid values (page=0)', async () => {
    mockList.mockResolvedValue({ tenants: [], total: 0, page: 1, pageSize: 20 } as never)
    await list(makeReq({ query: { page: '0' } }), makeRes())
    expect(mockList).toHaveBeenCalledWith(1, 20)
  })

  it('responds with paginated envelope', async () => {
    mockList.mockResolvedValue({ tenants: [FAKE_TENANT], total: 1, page: 1, pageSize: 20 } as never)
    const res = makeRes()
    await list(makeReq(), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ total: 1 }) })
    )
  })
})

describe('tenants.controller.getById', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls service with req.params.id', async () => {
    mockGetById.mockResolvedValue(FAKE_TENANT as never)
    await getById(makeReq({ params: { id: 't1' } }), makeRes())
    expect(mockGetById).toHaveBeenCalledWith('t1')
  })

  it('responds with success envelope wrapping the tenant', async () => {
    mockGetById.mockResolvedValue(FAKE_TENANT as never)
    const res = makeRes()
    await getById(makeReq({ params: { id: 't1' } }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, data: FAKE_TENANT })
    )
  })
})

describe('tenants.controller.create', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls service with body.name and body.config', async () => {
    mockCreate.mockResolvedValue(FAKE_TENANT as never)
    await create(makeReq({ body: { name: 'New Corp', config: {} } }), makeRes())
    expect(mockCreate).toHaveBeenCalledWith('New Corp', expect.objectContaining({}))
  })

  it('responds with HTTP 201 and success envelope', async () => {
    mockCreate.mockResolvedValue(FAKE_TENANT as never)
    const res = makeRes()
    await create(makeReq({ body: { name: 'x', config: {} } }), res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.status(201).json).toHaveBeenCalledWith(
      expect.objectContaining({ data: FAKE_TENANT })
    )
  })
})

describe('tenants.controller.update', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls service with params.id and body.config', async () => {
    mockUpdate.mockResolvedValue(FAKE_TENANT as never)
    await update(makeReq({ params: { id: 't1' }, body: { config: {} } }), makeRes())
    expect(mockUpdate).toHaveBeenCalledWith('t1', expect.objectContaining({}))
  })

  it('responds with success envelope wrapping the updated tenant', async () => {
    mockUpdate.mockResolvedValue(FAKE_TENANT as never)
    const res = makeRes()
    await update(makeReq({ params: { id: 't1' }, body: { config: {} } }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: FAKE_TENANT })
    )
  })
})

describe('tenants.controller.remove', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls service with params.id', async () => {
    mockRemove.mockResolvedValue(undefined as never)
    await remove(makeReq({ params: { id: 't1' } }), makeRes())
    expect(mockRemove).toHaveBeenCalledWith('t1')
  })

  it('responds with success null and "Tenant deleted" message', async () => {
    mockRemove.mockResolvedValue(undefined as never)
    const res = makeRes()
    await remove(makeReq({ params: { id: 't1' } }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Tenant deleted', data: null })
    )
  })
})
