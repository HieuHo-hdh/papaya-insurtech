/**
 * TL Sample — claims controller
 *
 * FE API contract:
 *   POST /tenants/:tenantId/claims/process
 *   body: { claimType, amount, customFields }
 *   → success(ProcessClaimResult)
 */
import type { Request, Response } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/engine/processClaim', () => ({ processClaim: jest.fn() }))

import { processClaimHandler } from '../claims.controller'
import * as processClaimModule from '@/engine/processClaim'

const mockProcessClaim = jest.mocked(processClaimModule.processClaim)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (tenantId: string, body: object): Request =>
  ({ params: { tenantId }, body } as unknown as Request)

const makeRes = () => {
  const json = jest.fn()
  return { json } as unknown as Response & { json: jest.Mock }
}

const FAKE_CLAIM_BODY = { claimType: 'OUTPATIENT' as const, amount: 30000, customFields: { employee_id: 'EMP001' } }

const FAKE_RESULT = {
  requiredDocuments: ['Medical Report', 'Receipt'],
  approvalTiers: [{ tier: 'assessor' }],
  notifications: [] as never[],
  slaDeadline: '2024-01-10T00:00:00.000Z',
  customFieldsRequired: [] as never[],
}

// ─────────────────────────────────────────────────────────────────────────────

describe('claims.controller.processClaimHandler', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('calls processClaim with tenantId from params and full body', async () => {
    mockProcessClaim.mockResolvedValue(FAKE_RESULT as never)
    await processClaimHandler(makeReq('tenant-1', FAKE_CLAIM_BODY), makeRes())
    expect(mockProcessClaim).toHaveBeenCalledWith('tenant-1', FAKE_CLAIM_BODY)
  })

  it('responds with success envelope wrapping the ProcessClaimResult', async () => {
    mockProcessClaim.mockResolvedValue(FAKE_RESULT as never)
    const res = makeRes()
    await processClaimHandler(makeReq('tenant-1', FAKE_CLAIM_BODY), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, data: FAKE_RESULT })
    )
  })

  it('propagates engine 404 errors without swallowing them', async () => {
    const err = new Error('Tenant not found')
    mockProcessClaim.mockRejectedValue(err as never)
    await expect(
      processClaimHandler(makeReq('missing', FAKE_CLAIM_BODY), makeRes())
    ).rejects.toThrow('Tenant not found')
  })
})
