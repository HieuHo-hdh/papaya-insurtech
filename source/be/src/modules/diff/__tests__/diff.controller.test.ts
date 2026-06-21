/**
 * TL Sample — diff controller
 *
 * FE API contract:
 *   GET /diff?a=<tenantId>&b=<tenantId>
 *   → 400 if a or b missing
 *   → success({ tenantA, tenantB, diffs: DiffEntry[] })
 */
import type { Request, Response } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../diff.service', () => ({ diffConfigs: jest.fn() }))

import { getDiff } from '../diff.controller'
import * as diffService from '../diff.service'

const mockDiffConfigs = jest.mocked(diffService.diffConfigs)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (query: Record<string, string | undefined>): Request =>
  ({ query } as unknown as Request)

const makeRes = () => {
  const json = jest.fn()
  return { json } as unknown as Response & { json: jest.Mock }
}

const FAKE_RESULT = { tenantA: {}, tenantB: {}, diffs: [{ path: 'branding.companyName', valueA: 'A', valueB: 'B' }] }

// ─────────────────────────────────────────────────────────────────────────────

describe('diff.controller.getDiff', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws AppError 400 when query param "a" is missing', async () => {
    await expect(getDiff(makeReq({ b: 'tenant-b' }), makeRes())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Query params a and b are required',
    })
  })

  it('throws AppError 400 when query param "b" is missing', async () => {
    await expect(getDiff(makeReq({ a: 'tenant-a' }), makeRes())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws AppError 400 when both params are absent', async () => {
    await expect(getDiff(makeReq({}), makeRes())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('calls diffConfigs with a and b when both are present', async () => {
    mockDiffConfigs.mockResolvedValue(FAKE_RESULT as never)
    await getDiff(makeReq({ a: 'tenant-a', b: 'tenant-b' }), makeRes())
    expect(mockDiffConfigs).toHaveBeenCalledWith('tenant-a', 'tenant-b')
  })

  it('responds with success envelope wrapping the diff result', async () => {
    mockDiffConfigs.mockResolvedValue(FAKE_RESULT as never)
    const res = makeRes()
    await getDiff(makeReq({ a: 'tenant-a', b: 'tenant-b' }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, data: FAKE_RESULT })
    )
  })
})
