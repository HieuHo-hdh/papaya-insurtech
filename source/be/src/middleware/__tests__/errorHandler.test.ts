/**
 * TL Sample — errorHandler middleware
 *
 * The single error-to-HTTP-response translation point.
 * AppError → { code, message, ?details } with matching HTTP status.
 * Everything else → 500 "Internal server error".
 *
 * FE contract:
 *   { code: number, message: string, details?: Record<string, string[]> }
 */
import { errorHandler } from '../errorHandler'
import { AppError } from '@/utils/AppError'
import type { Request, Response, NextFunction } from 'express'
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'

const makeRes = () => {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json } as unknown as Response)
  return { status, json } as unknown as Response & { status: jest.Mock; json: jest.Mock }
}

const req = {} as Request
const next = (() => {}) as NextFunction
let consoleSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => consoleSpy.mockRestore())

describe('errorHandler', () => {
  it('maps AppError statusCode to HTTP status', () => {
    const res = makeRes()
    errorHandler(new AppError(404, 'Not found'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('responds with { code, message } body for AppError', () => {
    const res = makeRes()
    errorHandler(new AppError(401, 'Unauthorized'), req, res, next)
    expect(res.status(401).json).toHaveBeenCalledWith({ code: 401, message: 'Unauthorized' })
  })

  it('includes details when AppError carries field errors', () => {
    const res = makeRes()
    const details = { email: ['Invalid email'] }
    errorHandler(new AppError(400, 'Validation failed', details), req, res, next)
    expect(res.status(400).json).toHaveBeenCalledWith(
      expect.objectContaining({ details })
    )
  })

  it('omits "details" key entirely when AppError has no details', () => {
    const res = makeRes()
    errorHandler(new AppError(403, 'Forbidden'), req, res, next)
    const body = (res.status(403).json as jest.Mock).mock.calls[0][0]
    expect(body).not.toHaveProperty('details')
  })

  it('returns 500 for unknown errors', () => {
    const res = makeRes()
    errorHandler(new Error('unexpected'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.status(500).json).toHaveBeenCalledWith({
      code: 500,
      message: 'Internal server error',
    })
  })

  it('logs unknown errors via console.error', () => {
    const res = makeRes()
    const err = new Error('unexpected')
    errorHandler(err, req, res, next)
    expect(consoleSpy).toHaveBeenCalledWith(err)
  })
})
