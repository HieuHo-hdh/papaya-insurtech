/**
 * TL Sample — versions controller
 *
 * NOTE: rollback() uses req.params.id — confirm the route mounts it as :id or :tenantId.
 *
 * FE API contract:
 *   GET  /tenants/:tenantId/versions                      → paginated(Version[])
 *   GET  /tenants/:tenantId/versions/:versionId           → success(Version)
 *   POST /tenants/:tenantId/versions/:versionId/rollback  → success(Version)
 */
import type { Request, Response } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../versions.service', () => ({
  listVersions: jest.fn(),
  getVersion: jest.fn(),
  rollback: jest.fn(),
}))

import { listVersions, getVersion, rollback } from '../versions.controller'
import * as versionsService from '../versions.service'

const mockListVersions = jest.mocked(versionsService.listVersions)
const mockGetVersion = jest.mocked(versionsService.getVersion)
const mockRollback = jest.mocked(versionsService.rollback)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (overrides: Partial<{ query: object; params: object }> = {}): Request =>
  ({ query: {}, params: {}, ...overrides } as unknown as Request)

const makeRes = () => {
  const json = jest.fn()
  return { json } as unknown as Response & { json: jest.Mock }
}

const FAKE_VERSION = { id: 'v1', tenantId: 't1', version: 2, isActive: true, config: {} }

// ─────────────────────────────────────────────────────────────────────────────

describe('versions.controller.listVersions', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('passes tenantId from params and defaults page/pageSize to service', async () => {
    mockListVersions.mockResolvedValue({ versions: [], total: 0, page: 1, pageSize: 20 } as never)
    await listVersions(makeReq({ params: { tenantId: 'tenant-1' } }), makeRes())
    expect(mockListVersions).toHaveBeenCalledWith('tenant-1', 1, 20)
  })

  it('parses page and pageSize from query string', async () => {
    mockListVersions.mockResolvedValue({ versions: [], total: 0, page: 2, pageSize: 5 } as never)
    await listVersions(makeReq({ params: { tenantId: 't1' }, query: { page: '2', pageSize: '5' } }), makeRes())
    expect(mockListVersions).toHaveBeenCalledWith('t1', 2, 5)
  })

  it('responds with paginated envelope', async () => {
    mockListVersions.mockResolvedValue({ versions: [FAKE_VERSION], total: 1, page: 1, pageSize: 20 } as never)
    const res = makeRes()
    await listVersions(makeReq({ params: { tenantId: 't1' } }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ total: 1 }) })
    )
  })
})

describe('versions.controller.getVersion', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls service with tenantId and versionId from params', async () => {
    mockGetVersion.mockResolvedValue(FAKE_VERSION as never)
    await getVersion(makeReq({ params: { tenantId: 't1', versionId: 'v1' } }), makeRes())
    expect(mockGetVersion).toHaveBeenCalledWith('t1', 'v1')
  })

  it('responds with success envelope wrapping the version', async () => {
    mockGetVersion.mockResolvedValue(FAKE_VERSION as never)
    const res = makeRes()
    await getVersion(makeReq({ params: { tenantId: 't1', versionId: 'v1' } }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, data: FAKE_VERSION })
    )
  })
})

describe('versions.controller.rollback', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls service with req.params.id and versionId', async () => {
    mockRollback.mockResolvedValue(FAKE_VERSION as never)
    await rollback(makeReq({ params: { id: 't1', versionId: 'v1' } }), makeRes())
    expect(mockRollback).toHaveBeenCalledWith('t1', 'v1')
  })

  it('responds with success envelope wrapping the new version', async () => {
    mockRollback.mockResolvedValue(FAKE_VERSION as never)
    const res = makeRes()
    await rollback(makeReq({ params: { id: 't1', versionId: 'v1' } }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: FAKE_VERSION })
    )
  })
})
