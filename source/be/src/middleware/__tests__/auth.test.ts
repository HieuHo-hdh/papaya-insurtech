/**
 * TL Sample — auth middleware (JWT guard)
 *
 * Every protected route passes through this middleware.
 * It reads the Bearer token, verifies it, and attaches the payload to req.user.
 */
import { auth } from '../auth'
import jwt from 'jsonwebtoken'
import { AppError } from '@/utils/AppError'
import type { Request, Response, NextFunction } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-at-least-16-chars' },
}))

jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }))

const mockVerify = jest.mocked(jwt.verify)

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (authHeader?: string): Request =>
  ({ headers: { authorization: authHeader } } as unknown as Request)

const res = {} as Response
const next = jest.fn() as unknown as NextFunction

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auth middleware', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws AppError 401 when Authorization header is absent', () => {
    expect(() => auth(makeReq(), res, next)).toThrow(
      expect.objectContaining({ statusCode: 401, message: 'Unauthorized' })
    )
  })

  it('throws AppError 401 when header does not start with "Bearer "', () => {
    expect(() => auth(makeReq('Token abc123'), res, next)).toThrow(
      expect.objectContaining({ statusCode: 401 })
    )
  })

  it('throws AppError 401 when jwt.verify throws (invalid or expired token)', () => {
    mockVerify.mockImplementation(() => { throw new Error('jwt expired') })
    expect(() => auth(makeReq('Bearer bad.token.here'), res, next)).toThrow(
      expect.objectContaining({ statusCode: 401, message: 'Invalid or expired token' })
    )
  })

  it('attaches decoded payload to req.user and calls next() for valid token', () => {
    const payload = { id: 'user-1', email: 'admin@test.com' }
    mockVerify.mockReturnValue(payload as never)

    const req = makeReq('Bearer valid.token.here')
    auth(req, res, next)

    expect(req.user).toEqual(payload)
    expect(next as jest.Mock).toHaveBeenCalledWith()
  })

  it('error thrown is an instance of AppError (not generic Error)', () => {
    expect(() => auth(makeReq(), res, next)).toThrow(AppError)
  })
})
