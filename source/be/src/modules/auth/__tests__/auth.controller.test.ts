/**
 * TL Sample — auth controller
 *
 * FE contract:
 *   POST /auth/login  → { code: 200, message: 'OK', data: { token: string } }
 *   POST /auth/logout → { code: 200, message: 'Logged out', data: null }
 */
import type { Request, Response } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../auth.service', () => ({ login: jest.fn() }))

import { login as loginController, logout } from '../auth.controller'
import * as authService from '../auth.service'

const mockLogin = jest.mocked(authService.login)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (body: Record<string, string> = {}): Request =>
  ({ body } as unknown as Request)

const makeRes = () => {
  const json = jest.fn()
  return { json } as unknown as Response & { json: jest.Mock }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auth.controller.login', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('extracts email and password from req.body and passes them to service', async () => {
    mockLogin.mockResolvedValue('jwt-token' as never)
    await loginController(makeReq({ email: 'admin@papaya.dev', password: 'Secret@1' }), makeRes())
    expect(mockLogin).toHaveBeenCalledWith('admin@papaya.dev', 'Secret@1')
  })

  it('responds with success envelope containing the token', async () => {
    mockLogin.mockResolvedValue('signed-jwt' as never)
    const res = makeRes()
    await loginController(makeReq({ email: 'x@x.com', password: 'pass' }), res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, data: { token: 'signed-jwt' } })
    )
  })

  it('propagates service errors (controller does not swallow)', async () => {
    mockLogin.mockRejectedValue(new Error('service error') as never)
    await expect(loginController(makeReq({ email: 'x@x.com', password: 'x' }), makeRes())).rejects.toThrow('service error')
  })
})

describe('auth.controller.logout', () => {
  it('responds with "Logged out" message and null data', () => {
    const res = makeRes()
    logout({} as Request, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Logged out', data: null })
    )
  })
})
